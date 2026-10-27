import { prepareSocialSupportStatFilters } from '../helpers'
import { FollowupRepo } from '~~/server/database'
import type { StatFilterInput } from '~~/server/schema'
import type { SecurityRuleGrantee } from '~~/server/security/rules/types'

export async function getWalkInSessionFollowupCountQuery(
  user: SecurityRuleGrantee,
  input: StatFilterInput
) {
  return await FollowupRepo.count(user, {
    where: {
      isDuringWalkInSession: true,
      socialSupport: prepareSocialSupportStatFilters(input)
    }
  })
}
