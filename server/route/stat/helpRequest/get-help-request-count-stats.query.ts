import { createQuery } from '~~/server/route'
import type { ProtectedAppContext } from '~~/server/trpc'
import type { StatFilterInput } from '~~/server/schema'
import { statFilterSchema } from '~~/server/schema'
import {
  getHelpRequestBeneficiaryNumberQuery,
  getHelpRequestCountQuery
} from '~~/server/query/stats'
import { AllowSecurityCheck } from '~~/server/security/rules/types'

const securityCheck = AllowSecurityCheck

const handler = async ({
  input,
  ctx: { user }
}: {
  input: StatFilterInput
  ctx: ProtectedAppContext
}) => {
  const [helpRequests, helpRequestBeneficiaries] = await Promise.all([
    getHelpRequestCountQuery(user, input),
    getHelpRequestBeneficiaryNumberQuery(user, input)
  ])

  return {
    helpRequests,
    helpRequestBeneficiaries
  }
}

export const getHelpRequestCountStatsQuery = createQuery({
  inputValidation: statFilterSchema,
  securityCheck,
  handler
})
