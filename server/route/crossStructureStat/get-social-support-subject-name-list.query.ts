import { createQuery } from '~~/server/route'
import type { ProtectedAppContext } from '~~/server/trpc'
import { emptySchema } from '~~/server/schema'
import { AllowSecurityCheck } from '~~/server/security/rules/types'
import { SocialSupportSubjectRepo } from '~~/server/database'
import { groupIdsByName } from './merge-by-name'

// Review app only: subject names across structures, each with all its ids,
// same active-or-used rule as the structure-side filter
const handler = async ({ ctx: { user } }: { ctx: ProtectedAppContext }) => {
  const items = await SocialSupportSubjectRepo.findMany(user, {
    select: { id: true, name: true },
    where: { OR: [{ inactive: false }, { inactive: true, used: true }] },
    orderBy: { name: 'asc' }
  })
  return groupIdsByName(items)
}

export const getSocialSupportSubjectNameListQuery = createQuery({
  inputValidation: emptySchema,
  securityCheck: AllowSecurityCheck,
  handler
})
