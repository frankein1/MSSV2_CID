import {
  prepareFollowupStatFilters,
  preparePrescribingOrganizationStats
} from '../helpers'
import { SocialSupportRepo } from '~~/server/database'
import type { StatFilterInput } from '~~/server/schema'
import type { SecurityRuleGrantee } from '~~/server/security/rules/types'

export async function getFollowupPrescribingOrganizationStatsQuery(
  user: SecurityRuleGrantee,
  input: StatFilterInput
) {
  const socialSupports = await SocialSupportRepo.findMany(user, {
    where: { ...prepareFollowupStatFilters(input) },
    select: {
      followup: {
        select: {
          prescribingOrganization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  })

  const followups = socialSupports.flatMap(({ followup }) =>
    followup !== null ? [followup] : []
  )

  return preparePrescribingOrganizationStats(followups)
}
