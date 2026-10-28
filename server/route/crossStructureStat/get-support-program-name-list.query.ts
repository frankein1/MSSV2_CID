import { createQuery } from '~~/server/route'
import type { ProtectedAppContext } from '~~/server/trpc'
import { emptySchema } from '~~/server/schema'
import { AllowSecurityCheck } from '~~/server/security/rules/types'
import { SupportProgramNameRepo } from '~~/server/database'
import { groupIdsByName } from './merge-by-name'

// Review app only: support program names across structures, each with all
// its ids, same "linked to beneficiaries" rule as the structure-side filter
const handler = async ({ ctx: { user } }: { ctx: ProtectedAppContext }) => {
  const items = await SupportProgramNameRepo.findMany(user, {
    select: { id: true, name: true },
    where: { supportPrograms: { some: {} } },
    orderBy: { name: 'asc' }
  })
  return groupIdsByName(items)
}

export const getSupportProgramNameListQuery = createQuery({
  inputValidation: emptySchema,
  securityCheck: AllowSecurityCheck,
  handler
})
