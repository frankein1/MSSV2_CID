// Review app only: structure-scoped labels (subjects, partners, redirection
// reasons, support program names) have one id per structure. Across structures,
// breakdowns are regrouped by exact name and their counts summed.
// Near-duplicates ("Aide alimentaire" / "Aide alimentaire d'urgence") stay apart.

// Option lists: one entry per name, with the ids of every structure, so the
// existing id filters (socialSupportSubjects, supportProgramNameIds) match them all
export function groupIdsByName(items: { id: string; name: string }[]) {
  const byName = new Map<string, string[]>()
  for (const { id, name } of items) {
    byName.set(name, [...(byName.get(name) ?? []), id])
  }
  return [...byName.entries()].map(([name, ids]) => ({ name, ids }))
}

function mergeByName<T extends { name: string | null }>(
  items: T[],
  merge: (a: T, b: T) => T
) {
  const byName = new Map<string | null, T>()
  for (const item of items) {
    const existing = byName.get(item.name)
    byName.set(item.name, existing ? merge(existing, item) : item)
  }
  return [...byName.values()]
}

const sumCount = <T extends { _count: number }>(a: T, b: T): T => ({
  ...a,
  _count: a._count + b._count
})

export function mergeSubjectStats<
  T extends { name: string; _count: { socialSupports: number } }
>(subjects: T[]) {
  return mergeByName(subjects, (a, b) => ({
    ...a,
    _count: {
      socialSupports: a._count.socialSupports + b._count.socialSupports
    }
  })).sort((a, b) => b._count.socialSupports - a._count.socialSupports)
}

export function mergeRedirectionReasonStats<
  T extends { reasons: { name: string; _count: number }[] }
>(stats: T): T {
  return {
    ...stats,
    reasons: mergeByName(stats.reasons, sumCount).sort(
      (a, b) => b._count - a._count
    )
  }
}

export function mergeRedirectionStats<
  T extends {
    withTypeIsPartners: { partners: { name: string; _count: number }[] }
  }
>(stats: T): T {
  return {
    ...stats,
    withTypeIsPartners: {
      ...stats.withTypeIsPartners,
      partners: mergeByName(stats.withTypeIsPartners.partners, sumCount).sort(
        (a, b) => b._count - a._count
      )
    }
  }
}

// A beneficiary belongs to one structure, so distinct beneficiary counts of
// same-named partners from different structures add up
export function mergeSupportProgramPartnerStats<
  T extends { partners: { name: string | null; _count: number }[] }
>(stats: T): T {
  return {
    ...stats,
    partners: mergeByName(stats.partners, sumCount).sort((a, b) => {
      // Not filled always comes last
      if (a.name === null || b.name === null) {
        return Number(a.name === null) - Number(b.name === null)
      }
      return b._count - a._count || a.name.localeCompare(b.name, 'fr')
    })
  }
}

export function mergeSupportProgramEntriesExitsStats<
  T extends { name: string; entries: number; exits: number; ongoing: number }
>(stats: T[]) {
  return mergeByName(stats, (a, b) => ({
    ...a,
    entries: a.entries + b.entries,
    exits: a.exits + b.exits,
    ongoing: a.ongoing + b.ongoing
  })).sort(
    (a, b) =>
      b.entries - a.entries ||
      b.exits - a.exits ||
      a.name.localeCompare(b.name, 'fr')
  )
}
