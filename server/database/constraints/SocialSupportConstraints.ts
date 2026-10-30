import type { Prisma } from '@prisma/client'
import type { SecurityRuleGrantee } from '~~/server/security'
import { isAdmin, isReferent } from '~~/server/security/rules/helpers'

const get = (user: SecurityRuleGrantee) => {
  const where: Prisma.SocialSupportWhereInput = {}
  if (isAdmin(user)) {
    // Review app only: crossStructureProcedure runs as an admin to read every structure
    return where
  }

  if (!user.structureId) {
    throw new Error('social-support-constraints: missing structure id')
  }

  Object.assign<Prisma.SocialSupportWhereInput, Prisma.SocialSupportWhereInput>(
    where,
    { structureId: user.structureId }
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
