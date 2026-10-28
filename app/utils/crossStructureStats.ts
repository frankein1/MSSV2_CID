import type { Options } from '~/utils/options'

// Review app only: cross-structure statistics panel.
// Subjects and support program names are merged by name across structures:
// one option per name, valued by its first id (a uuid, so the existing filter
// schemas still validate), expanded to every structure's ids before querying.

type MergedName = { name: string; ids: string[] }

export type MergedIds = Record<string, string[]>

export function toMergedOptions(items: MergedName[]): Options {
  return items.flatMap(({ name, ids }) =>
    ids[0] ? [{ value: ids[0], label: name }] : []
  )
}

export function toMergedIds(items: MergedName[]): MergedIds {
  return Object.fromEntries(
    items.flatMap(({ ids }) => (ids[0] ? [[ids[0], ids]] : []))
  )
}

function expandIds(values: string[] | null | undefined, mergedIds: MergedIds) {
  return values?.flatMap(value => mergedIds[value] ?? [value])
}

export function expandMergedIds<
  T extends {
    socialSupportSubjects?: string[] | null
    supportProgramNameIds?: string[] | null
  }
>(filters: T, mergedIds: MergedIds): T {
  return {
    ...filters,
    ...(filters.socialSupportSubjects && {
      socialSupportSubjects: expandIds(filters.socialSupportSubjects, mergedIds)
    }),
    ...(filters.supportProgramNameIds && {
      supportProgramNameIds: expandIds(filters.supportProgramNameIds, mergedIds)
    })
  }
}
