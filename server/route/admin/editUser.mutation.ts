import { UserActivityType, UserRole } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { UserRepo, StructureRepo } from '~~/server/database'
import { createOrUpdateUser } from '~~/server/integrations/brevo/service'
import { createMutation } from '~~/server/route'
import type { AdminEditUserInput } from '~~/server/schema'
import { adminEditUserSchema } from '~~/server/schema'
import type { AdminContext } from '~~/server/trpc'
import { cleanEmail } from '~/utils/user'

const adminHandler = async ({
  ctx,
  input
}: {
  ctx: AdminContext
  input: AdminEditUserInput
}) => {
  const { id, email, ...user } = input

  const targetUser = await UserRepo.findUniqueOrThrow(ctx.user, {
    where: { id }
  })

  if (targetUser.role === UserRole.Administrator) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Cannot edit an Administrator'
    })
  }

  if (targetUser.structureId) {
    const structure = await StructureRepo.findUniqueOrThrow(ctx.user, {
      where: { id: targetUser.structureId }
    })
    if (structure.disabled) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Cannot edit a user in a disabled structure'
      })
    }
  }

  const updatedUser = await UserRepo.prisma.update({
    where: { id },
    data: {
      // email: cleanEmail(email),
      ...user
    }
  })
  createOrUpdateUser(updatedUser.id).catch(error => {
    console.error(error)
  })

  return updatedUser
}

export const editUser = createMutation({
  inputValidation: adminEditUserSchema,
  adminHandler,
  auditLog: {
    key: 'admin.user.edit',
    target: 'User',
    targetId: ({ input }) => {
      return input.id
    },
    action: UserActivityType.UPDATE
  }
})
