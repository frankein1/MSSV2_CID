import { prepareHelpRequestStatFilters } from '../helpers'
import { SocialSupportRepo } from '~~/server/database'
import type { StatFilterInput } from '~~/server/schema'
import type { SecurityRuleGrantee } from '~~/server/security/rules/types'

export async function getHelpRequestCountQuery(
  user: SecurityRuleGrantee,
  input: StatFilterInput
) {
  const { socialSupportType: socialSupportTypeFilter, ...filters } =
    prepareHelpRequestStatFilters(input)

  return await SocialSupportRepo.count(user, {
    where: {
      ...filters,
      socialSupportType: socialSupportTypeFilter || {
        in: ['HelpRequest', 'HelpRequestHousing']
      }
    }
  })
}
