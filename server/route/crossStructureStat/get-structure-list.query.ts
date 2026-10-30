import { createQuery } from '~~/server/route'
import type { ProtectedAppContext } from '~~/server/trpc'
import { emptySchema } from '~~/server/schema'
import { AllowSecurityCheck } from '~~/server/security/rules/types'
import { StructureRepo } from '~~/server/database'

// Review app only: every structure, for the structure selector
const handler = async ({ ctx: { user } }: { ctx: ProtectedAppContext }) => {
  return await StructureRepo.findMany(user, {
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  })
}

export const getStructureListQuery = createQuery({
  inputValidation: emptySchema,
  securityCheck: AllowSecurityCheck,
  handler
})
