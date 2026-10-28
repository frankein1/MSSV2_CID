import { prepareFollowupStatFilters } from '../helpers'
import {
  SocialSupportConstraints,
  SocialSupportSubjectRepo
} from '~~/server/database'
import type { StatFilterInput } from '~~/server/schema'
import type { SecurityRuleGrantee } from '~~/server/security/rules/types'
import { appendConstraints } from '~~/server/database/repository/helper/appendConstraints'

export async function getFollowupSubjectsStatsQuery(
  user: SecurityRuleGrantee,
  input: StatFilterInput
) {
  const where = { where: { ...prepareFollowupStatFilters(input) } }
  appendConstraints(user, where, SocialSupportConstraints.get)

  const res = await SocialSupportSubjectRepo.findMany(user, {
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          socialSupports: where
        }
      }
    }
  })

  return res.sort((a, b) => b._count.socialSupports - a._count.socialSupports)
}
