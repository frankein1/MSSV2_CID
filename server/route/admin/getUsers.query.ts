import type { Prisma } from '@prisma/client'
import { UserRole } from '@prisma/client'
import { createQuery } from '~~/server/route'
import type { AdminGetUsersInput, UserAdminFilterInput } from '~~/server/schema'
import { adminGetUsersSchema } from '~~/server/schema'
import { UserRepo } from '~~/server/database'
import type { AdminContext } from '~~/server/trpc'

const adminHandler = async ({
  ctx: { user },
  input
}: {
  ctx: AdminContext
  input: AdminGetUsersInput
}) => {
  let where = input.filters ? prepareUserFilters(input.filters) : {}
  if (input.search) {
    where = {
      ...where,
      OR: [
        {
          lastName: {
            contains: input.search,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: input.search,
            mode: 'insensitive'
          }
        }
      ]
    }
  }

  where = {
    ...where,
    AND: [
      { role: { not: UserRole.Administrator }, structure: { disabled: false } }
    ]
  }

  const users = await UserRepo.findMany(user, {
    where,
    select: {
      id: true,
      // lastName: true,
      // firstName: true,
      lastAccess: true,
      // email: true,
      role: true,
      status: true,
      structure: true
    },
    orderBy: {
      structure: {
        name: 'asc'
      }
    }
  })

  return { users }
}

export type AdminUsersOutput = Prisma.PromiseReturnType<typeof adminHandler>

function prepareUserFilters(filters: UserAdminFilterInput) {
  const formattedFilters: Prisma.UserWhereInput = {}

  if (filters.role) {
    formattedFilters.role = filters.role
  }

  return formattedFilters
}

export const getUsers = createQuery({
  inputValidation: adminGetUsersSchema,
  adminHandler
})
