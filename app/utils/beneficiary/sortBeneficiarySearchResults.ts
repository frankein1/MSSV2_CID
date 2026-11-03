import type { inferProcedureOutput } from '@trpc/server'
import type { AppRouter } from '~~/server/trpc/routers'
import type { ArrayElement } from '~~/types/utils'

type BeneficiarySearchResult = ArrayElement<
  inferProcedureOutput<AppRouter['beneficiary']['search']>
>

// ANONYMIZED: name-based sorting no longer possible
export default function sortBeneficiarySearchResults(_input: string) {
  return function sortResults(
    a: BeneficiarySearchResult,
    b: BeneficiarySearchResult
  ) {
    return a.id < b.id ? -1 : 1
  }
}
