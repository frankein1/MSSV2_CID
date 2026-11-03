import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const prisma = new PrismaClient()
const dryRun = process.argv.includes('--dry-run')

const envArg = process.argv.find(a => a.startsWith('--env='))?.split('=')[1]
const validEnvs = ['dev', 'demo', 'prod'] as const
type Env = (typeof validEnvs)[number]
if (!envArg || !validEnvs.includes(envArg as Env)) {
  console.error(
    `Usage: npx tsx migrate-data-inclusion-v1-unmatched.ts --env=<${validEnvs.join('|')}> [--dry-run]`
  )
  process.exit(1)
}
const env: Env = envArg as Env

function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function main() {
  const startTime = performance.now()

  const {
    ambiguousOverrides,
    customPartnerOverrideIds: rawCustomPartnerOverrideIds
  } = (await import(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    `./migrate-data-inclusion-v1-unmatched.overrides.${env}.ignore`
  ).catch(() => ({
    ambiguousOverrides: {}
  }))) as {
    ambiguousOverrides: Record<string, string>
    customPartnerOverrideIds?: Set<string>
  }
  const customPartnerOverrideIds =
    rawCustomPartnerOverrideIds ?? new Set<string>()
  console.log(
    `Loaded ${Object.keys(ambiguousOverrides).length} overrides and ${customPartnerOverrideIds.size} custom partner override IDs from file`
  )

  const t0 = performance.now()
  const v1Structures = await prisma.dataInclusionStructureV1.findMany({
    select: { id: true, name: true, siret: true, zipcode: true }
  })
  console.log(
    `Loaded ${v1Structures.length} v1 structures in ${Math.round(performance.now() - t0)}ms`
  )

  const v1Ids = new Set(v1Structures.map(s => s.id))

  const v1BySiret = new Map<
    string,
    { id: string; name: string; zipcode: string | null }[]
  >()
  for (const s of v1Structures) {
    if (s.siret) {
      const existing = v1BySiret.get(s.siret)
      if (existing) {
        existing.push({ id: s.id, name: s.name, zipcode: s.zipcode })
      } else {
        v1BySiret.set(s.siret, [{ id: s.id, name: s.name, zipcode: s.zipcode }])
      }
    }
  }
  console.log(`Built siret lookup with ${v1BySiret.size} unique sirets`)

  const v1ByNormalizedNameZipcode = new Map<
    string,
    { id: string; name: string; siret: string | null }[]
  >()
  for (const s of v1Structures) {
    if (s.zipcode) {
      const key = `${normalize(s.name)}|${s.zipcode}`
      const existing = v1ByNormalizedNameZipcode.get(key)
      if (existing) {
        existing.push({ id: s.id, name: s.name, siret: s.siret })
      } else {
        v1ByNormalizedNameZipcode.set(key, [
          { id: s.id, name: s.name, siret: s.siret }
        ])
      }
    }
  }
  console.log(
    `Built name+zipcode lookup with ${v1ByNormalizedNameZipcode.size} unique keys`
  )

  const partnerOrgs = await prisma.partnerOrganization.findMany({
    where: {
      dataInclusionId: { not: null },
      dataInclusionIdV1: null
    },
    select: {
      id: true,
      name: true,
      dataInclusionId: true,
      dataInclusionStructure: {
        select: { siret: true, name: true, zipcode: true }
      }
    }
  })
  console.log(
    `Found ${partnerOrgs.length} partner orgs with v0 id but no v1 id`
  )
  if (dryRun) {
    console.log('DRY RUN — no updates will be written')
  }

  const partnerOrgById = new Map(partnerOrgs.map(o => [o.id, o]))
  const invalidOverrides: {
    partnerOrgId: string
    name: string
    dataInclusionId: string
    v1Id: string
  }[] = []
  for (const [partnerOrgId, v1Id] of Object.entries(ambiguousOverrides)) {
    if (!v1Ids.has(v1Id)) {
      const org = partnerOrgById.get(partnerOrgId)
      invalidOverrides.push({
        partnerOrgId,
        name: org?.name ?? '?',
        dataInclusionId: org?.dataInclusionId ?? '?',
        v1Id
      })
    }
  }
  if (invalidOverrides.length > 0) {
    console.warn(
      `\n⚠ ${invalidOverrides.length} overrides reference v1 IDs not found in DataInclusionStructureV1:`
    )
    for (const o of invalidOverrides) {
      console.warn(`  ${o.name} (v0: ${o.dataInclusionId}) → ${o.v1Id}`)
    }
    console.warn('')
  }

  let skippedCustomPartnerOverride = 0
  // Unique match on normalized name + zipcode (trusted)
  let matchedByName = 0
  // Unique match on SIRET only — name+zipcode failed; review recommended (v0 SIRETs can be stale)
  let matchedBySiretFallback = 0
  const matchedBySiretFallbackDetails: {
    partnerOrgId: string
    name: string
    v0Siret: string
    v0Zipcode: string | null
    v1Id: string
    v1Name: string
    v1Zipcode: string | null
  }[] = []
  // Multiple v1 structures share the same SIRET — needs manual override
  const ambiguousBySiret: {
    partnerOrgId: string
    name: string
    v0Siret: string
    candidates: { v1Id: string; v1Name: string; v1Zipcode: string | null }[]
  }[] = []
  // Multiple v1 structures share the same normalized name + zipcode — needs manual override
  const ambiguousByName: {
    partnerOrgId: string
    name: string
    v0Name: string
    v0Zipcode: string
    candidates: { v1Id: string; v1Name: string; v1Siret: string | null }[]
  }[] = []
  // Manually resolved via ambiguousOverrides map
  const overrideDetails: {
    partnerOrgId: string
    name: string
    matchMethod: 'override' | 'name+zipcode' | 'siret-fallback'
    resolvedV1Id: string
  }[] = []
  // Partner org has a v0 dataInclusionId but the referenced v0 structure doesn't exist
  const noV0Structure: {
    partnerOrgId: string
    name: string
    dataInclusionId: string
  }[] = []
  // No v1 match found by either method
  const noMatch: {
    partnerOrgId: string
    name: string
    dataInclusionId: string
    v0Siret: string | null
    v0Name: string
    v0Zipcode: string | null
  }[] = []

  for (const org of partnerOrgs) {
    const v0Structure = org.dataInclusionStructure
    if (!v0Structure) {
      noV0Structure.push({
        partnerOrgId: org.id,
        name: org.name,
        dataInclusionId: org.dataInclusionId!
      })
      continue
    }

    const override = ambiguousOverrides[org.id]
    if (override) {
      if (!v1Ids.has(override)) {
        continue
      }
      if (!dryRun) {
        await prisma.partnerOrganization.update({
          where: { id: org.id },
          data: { dataInclusionIdV1: override }
        })
      }
      overrideDetails.push({
        partnerOrgId: org.id,
        name: org.name,
        matchMethod: 'override',
        resolvedV1Id: override
      })
      continue
    }

    if (customPartnerOverrideIds.has(org.id)) {
      skippedCustomPartnerOverride++
      continue
    }

    if (v0Structure.zipcode) {
      const key = `${normalize(v0Structure.name)}|${v0Structure.zipcode}`
      const v1Candidates = v1ByNormalizedNameZipcode.get(key)
      if (v1Candidates?.length === 1) {
        if (!dryRun) {
          await prisma.partnerOrganization.update({
            where: { id: org.id },
            data: { dataInclusionIdV1: v1Candidates[0]!.id }
          })
        }
        matchedByName++
        continue
      }
      if (v1Candidates && v1Candidates.length > 1) {
        ambiguousByName.push({
          partnerOrgId: org.id,
          name: org.name,
          v0Name: v0Structure.name,
          v0Zipcode: v0Structure.zipcode,
          candidates: v1Candidates.map(c => ({
            v1Id: c.id,
            v1Name: c.name,
            v1Siret: c.siret
          }))
        })
        continue
      }
    }

    if (v0Structure.siret) {
      const v1Candidates = v1BySiret.get(v0Structure.siret)
      if (v1Candidates?.length === 1) {
        // SIRET fallback matches are NOT applied automatically — v0 SIRETs can be stale.
        // They appear in the report for review, and must be confirmed via ambiguousOverrides.
        matchedBySiretFallback++
        matchedBySiretFallbackDetails.push({
          partnerOrgId: org.id,
          name: org.name,
          v0Siret: v0Structure.siret,
          v0Zipcode: v0Structure.zipcode,
          v1Id: v1Candidates[0]!.id,
          v1Name: v1Candidates[0]!.name,
          v1Zipcode: v1Candidates[0]!.zipcode
        })
        continue
      }
      if (v1Candidates && v1Candidates.length > 1) {
        ambiguousBySiret.push({
          partnerOrgId: org.id,
          name: org.name,
          v0Siret: v0Structure.siret,
          candidates: v1Candidates.map(c => ({
            v1Id: c.id,
            v1Name: c.name,
            v1Zipcode: c.zipcode
          }))
        })
        continue
      }
    }

    noMatch.push({
      partnerOrgId: org.id,
      name: org.name,
      dataInclusionId: org.dataInclusionId!,
      v0Siret: v0Structure.siret,
      v0Name: v0Structure.name,
      v0Zipcode: v0Structure.zipcode
    })
  }

  const report = {
    date: new Date().toISOString(),
    env,
    dryRun,
    expected: partnerOrgs.length,
    matchedByName,
    matchedBySiretFallback,
    matchedBySiretFallbackDetails,
    overrideApplied: overrideDetails.length,
    overrideDetails,
    ambiguousBySiret: ambiguousBySiret.length,
    ambiguousBySiretDetails: ambiguousBySiret,
    ambiguousByName: ambiguousByName.length,
    ambiguousByNameDetails: ambiguousByName,
    noV0Structure: noV0Structure.length,
    noV0StructureDetails: noV0Structure,
    noMatch: noMatch.length,
    noMatchDetails: noMatch,
    skippedCustomPartnerOverride,
    invalidOverrides: invalidOverrides.length,
    invalidOverridesDetails: invalidOverrides
  }

  const duration = Math.round(performance.now() - startTime)
  console.log(
    `\nDone in ${duration}ms:` +
      `\n  ${matchedByName} matched by name+zipcode` +
      `\n  ${matchedBySiretFallback} siret fallback (not applied — needs override to confirm)` +
      `\n  ${overrideDetails.length} overrides applied` +
      `\n  ${skippedCustomPartnerOverride} skipped (custom partner override — DI Legacy)` +
      `\n  ${ambiguousByName.length} ambiguous by name+zipcode` +
      `\n  ${ambiguousBySiret.length} ambiguous by siret` +
      `\n  ${noV0Structure.length} no v0 structure found` +
      `\n  ${noMatch.length} no match` +
      `\n  ${invalidOverrides.length} invalid overrides (v1 id not found)` +
      `\n  out of ${partnerOrgs.length} expected`
  )

  const reportPath = join(
    __dirname,
    `report-unmatched-name-first-${env}-${Date.now()}.ignore.json`
  )
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`Report written to ${reportPath}`)
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
