import { prepareFollowupStatFilters } from '../helpers'
import { getSocialSupportSubjectMeanDuration } from './getSocialSupportSubjectMeanDuration'
import { SocialSupportSubjectRepo } from '~~/server/database'
import type { StatFilterInput } from '~~/server/schema'
import type { SecurityRuleGrantee } from '~~/server/security/rules/types'

export async function getFollowupMeanTimeStatsQuery(
  user: SecurityRuleGrantee,
  input: StatFilterInput
) {
  const subjects = await SocialSupportSubjectRepo.findMany(user, {
    where: {
      socialSupports: {
        some: {
          followup: {
            duration: { not: null }
          }
        }
      }
    },
    select: {
      id: true,
      name: true,
      socialSupports: {
        where: {
          ...prepareFollowupStatFilters(input),
          followup: {
            duration: { not: null }
          }
        },
        select: {
          followup: {
            select: {
              duration: true
            }
          }
        }
      }
    }
  })

  // Reduce each subject's durations to one mean here, so the response
  // carries one row per subject instead of every followup duration
  return subjects.map(({ id, name, socialSupports }) => ({
    id,
    name,
    meanDuration: getSocialSupportSubjectMeanDuration(socialSupports)
  }))
}
