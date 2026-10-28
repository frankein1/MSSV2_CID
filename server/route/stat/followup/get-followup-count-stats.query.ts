import { createQuery } from '~~/server/route'
import type { ProtectedAppContext } from '~~/server/trpc'
import type { StatFilterInput } from '~~/server/schema'
import { statFilterSchema } from '~~/server/schema'
import {
  getFirstFollowupCountQuery,
  getFollowupBeneficiaryNumberQuery,
  getFollowupCountQuery,
  getWalkInSessionFollowupCountQuery
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
  const [
    followups,
    firstFollowups,
    walkInSessionFollowups,
    followupBeneficiaries
  ] = await Promise.all([
    getFollowupCountQuery(user, input),
    getFirstFollowupCountQuery(user, input),
    getWalkInSessionFollowupCountQuery(user, input),
    getFollowupBeneficiaryNumberQuery(user, input)
  ])

  return {
    followups,
    firstFollowups,
    walkInSessionFollowups,
    followupBeneficiaries
  }
}

export const getFollowupCountStatsQuery = createQuery({
  inputValidation: statFilterSchema,
  securityCheck,
  handler
})
