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
    `Usage: npx tsx migrate-data-inclusion-v1.ts --env=<${validEnvs.join('|')}> [--dry-run]`
  )
  process.exit(1)
}
const env: Env = envArg as Env

function buildV0ToV1Map(
  v1Structures: { id: string; doublons: string[] }[]
): Map<string, string[]> {
  const map = new Map<string, string[]>()

  function addEntry(v0Id: string, v1Id: string) {
    const existing = map.get(v0Id)
    if (existing) {
      if (!existing.includes(v1Id)) {
        existing.push(v1Id)
      }
    } else {
      map.set(v0Id, [v1Id])
    }
  }

  for (const structure of v1Structures) {
    const separatorIndex = structure.id.indexOf('--')
    if (separatorIndex !== -1) {
      const v0Id = structure.id.substring(separatorIndex + 2)
      addEntry(v0Id, structure.id)
    }

    for (const doublon of structure.doublons) {
      const separatorIndex = doublon.indexOf('--')
      if (separatorIndex !== -1) {
        const v0Id = doublon.substring(separatorIndex + 2)
        addEntry(v0Id, structure.id)
      }
    }
  }

  return map
}

async function main() {
  const startTime = performance.now()

  const { ambiguousOverrides } = (await import(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    `./migrate-data-inclusion-v1.overrides.${env}.ignore`
  ).catch(() => ({ ambiguousOverrides: {} }))) as {
    ambiguousOverrides: Record<string, string>
  }
  console.log(
    `Loaded ${Object.keys(ambiguousOverrides).length} overrides from file`
  )

  const t0 = performance.now()
  const v1Structures = await prisma.dataInclusionStructureV1.findMany({
    select: { id: true, name: true, doublons: true }
  })
  console.log(
    `Loaded ${v1Structures.length} v1 structures in ${Math.round(performance.now() - t0)}ms`
  )

  const v0ToV1 = buildV0ToV1Map(v1Structures)
  console.log(`Built lookup map with ${v0ToV1.size} v0 entries`)

  const v1NameById = new Map(v1Structures.map(s => [s.id, s.name]))

  const partnerOrgs = await prisma.partnerOrganization.findMany({
    where: { dataInclusionId: { not: null } },
    select: { id: true, name: true, dataInclusionId: true }
  })
  console.log(
    `Found ${partnerOrgs.length} partner orgs with a v0 dataInclusionId`
  )
  if (dryRun) {
    console.log('DRY RUN — no updates will be written')
  }

  const unmatched: {
    partnerOrgId: string
    dataInclusionId: string
    name: string
  }[] = []
  const ambiguous: {
    partnerOrgId: string
    name: string
    v0Id: string
    candidates: { v1Id: string; v1Name: string }[]
  }[] = []
  const overrideDetails: {
    partnerOrgId: string
    name: string
    v0Id: string
    candidateV1Ids: string[]
    resolvedV1Id: string
  }[] = []
  let matched = 0

  for (const org of partnerOrgs) {
    const v0Id = org.dataInclusionId!
    const v1Ids = v0ToV1.get(v0Id)

    if (!v1Ids || v1Ids.length === 0) {
      unmatched.push({
        partnerOrgId: org.id,
        dataInclusionId: v0Id,
        name: org.name
      })
      continue
    }

    if (v1Ids.length > 1) {
      const override = ambiguousOverrides[org.id]
      if (override) {
        if (!dryRun) {
          await prisma.partnerOrganization.update({
            where: { id: org.id },
            data: { dataInclusionIdV1: override }
          })
        }
        overrideDetails.push({
          partnerOrgId: org.id,
          name: org.name,
          v0Id,
          candidateV1Ids: v1Ids,
          resolvedV1Id: override
        })
        continue
      }

      if (dryRun) {
        ambiguous.push({
          partnerOrgId: org.id,
          name: org.name,
          v0Id,
          candidates: v1Ids.map(v1Id => ({
            v1Id,
            v1Name: v1NameById.get(v1Id) ?? 'unknown'
          }))
        })
        continue
      }

      throw new Error(
        `Ambiguous match for partner org "${org.name}" (${org.id}): ` +
          `v0 id "${v0Id}" maps to ${v1Ids.length} v1 ids: ${v1Ids.join(', ')}`
      )
    }

    if (!dryRun) {
      await prisma.partnerOrganization.update({
        where: { id: org.id },
        data: { dataInclusionIdV1: v1Ids[0] }
      })
    }
    matched++
  }

  const report = {
    date: new Date().toISOString(),
    env,
    dryRun,
    expected: partnerOrgs.length,
    matched,
    unmatched: unmatched.length,
    unmatchedDetails: unmatched,
    overrideApplied: overrideDetails.length,
    overrideDetails,
    ambiguous: ambiguous.length,
    ambiguousDetails: ambiguous
  }

  const duration = Math.round(performance.now() - startTime)
  console.log(
    `\nDone in ${duration}ms: ${matched} matched, ${overrideDetails.length} overrides, ${ambiguous.length} ambiguous, ${unmatched.length} unmatched out of ${partnerOrgs.length} expected`
  )

  const reportPath = join(__dirname, `report-${env}-${Date.now()}.ignore.json`)
  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`Report written to ${reportPath}`)
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
