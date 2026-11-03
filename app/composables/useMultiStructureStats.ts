import type { Options } from '~/utils/options'
import type { StatFilterInput } from '~~/server/schema'

export type MultiStructureConfig = {
  structureOptions: ComputedRef<Options>
  selectedStructureIds: Ref<string[]>
  isMultiStructure: ComputedRef<boolean>
}

export const multiStructureConfigKey = 'multiStructureConfig'

export function useMultiStructureConfig() {
  return inject<MultiStructureConfig | null>(multiStructureConfigKey, null)
}

/**
 * Initial filters of a stats tab. They must match the initial values of the
 * filter form: the form emits its values once its fields are mounted, and a
 * different value would run every stat query a second time.
 */
export function useInitialStatFilters(): StatFilterInput {
  const multiStructure = useMultiStructureConfig()
  if (!multiStructure?.isMultiStructure.value) {
    return {}
  }
  return { structureIds: [...multiStructure.selectedStructureIds.value] }
}

function normalizeFilterValue(value: unknown): unknown {
  return Array.isArray(value) ? [...value].sort() : value
}

/** Same filter values, whatever the key order and the order of multiple values */
export function isSameStatFilters(a: object, b: object): boolean {
  const normalize = (filters: object) =>
    JSON.stringify(
      Object.entries(filters)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, normalizeFilterValue(value)])
        .sort(([keyA], [keyB]) => String(keyA).localeCompare(String(keyB)))
    )
  return normalize(a) === normalize(b)
}
