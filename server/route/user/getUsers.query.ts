import { createQuery } from '~~/server/route'
import type { SecurityRuleContext } from '~~/server/security'
import { getAppContextPermissions } from '~~/server/security'
import { forbiddenError, type ProtectedAppContext } from '~~/server/trpc'
import { emptySchema } from '~~/server/schema'
import { UserRepo } from '~~/server/database'
import { UserRole } from '@prisma/client'

const securityCheck = (ctx: SecurityRuleContext) =>
  getAppContextPermissions(ctx).module.users

const handler = async ({ ctx }: { ctx: ProtectedAppContext }) => {
  return await getUsers(ctx)
}

export const getUsers = async (ctx: ProtectedAppContext) => {
  const users = await UserRepo.findMany(ctx.user, {
    select: {
      id: true,
      // firstName: true,
      // lastName: true,
      // email: true,
      status: true,
      role: true,
      aidantConnectAuthorisation: true,
      externalRdvspId: true,
      referentFor: true,
      _count: { select: { referentFor: true } }
    },
    orderBy: { role: 'asc' }
  })

  if (users.some(u => u.role === UserRole.Administrator)) {
    throw forbiddenError(
      'Cannot have an Administrator among user-managed users'
    )
  }

  return users
}

export const getUsersQuery = createQuery({
  inputValidation: emptySchema,
  securityCheck,
  handler
})
