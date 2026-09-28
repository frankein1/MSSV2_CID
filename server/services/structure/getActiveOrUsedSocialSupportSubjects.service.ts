import { SocialSupportSubjectRepo } from '~~/server/database'
import type { SecurityRuleContext } from '~~/server/security/rules/types'

export async function getActiveOrUsedSocialSupportSubjects({
  ctx,
  structureIds
}: {
  ctx: SecurityRuleContext
  structureIds?: string[] | null
}) {
  return await SocialSupportSubjectRepo.findMany(ctx.user, {
    where: {
      AND: [
        {
          OR: [{ inactive: false }, { inactive: true, used: true }]
        },
        ...(structureIds?.length
          ? [{ ownedByStructureId: { in: structureIds } }]
          : [])
      ]
    },
    orderBy: {
      name: 'asc'
    }
  })
}
