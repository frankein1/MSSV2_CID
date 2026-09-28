import type { Prisma } from '@prisma/client'
import type { SecurityRuleGrantee } from '~~/server/security'
import { isAdmin, isReferent } from '~~/server/security/rules/helpers'
import { TRPCError } from '@trpc/server'

const get = (user: SecurityRuleGrantee) => {
  const where: Prisma.SocialSupportWhereInput = {}
  if (isAdmin(user)) {
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: 'social-support-constraints: get not implemented for admin'
    })
  }

  if (!user.structureId) {
    throw new Error('social-support-constraints: missing structure id')
  }

  Object.assign<Prisma.SocialSupportWhereInput, Prisma.SocialSupportWhereInput>(
    where,
    {
      structureId: user.multiStructureIds
        ? { in: user.multiStructureIds }
        : user.structureId
    }
  )

  if (isReferent(user)) {
    Object.assign<
      Prisma.SocialSupportWhereInput,
      Prisma.SocialSupportWhereInput
    >(where, {
      familyFile: {
        referents: { some: { id: user.id } }
      }
    })
  }
  return where
}

export const SocialSupportConstraints = {
  get,
  remove: get,
  update: get
}
