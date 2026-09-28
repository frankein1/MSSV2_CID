import type { Prisma } from '@prisma/client'
import type { SecurityRuleGrantee } from '~~/server/security'
import { isAdmin } from '~~/server/security/rules/helpers'

const get = (user: SecurityRuleGrantee) => {
  const where: Prisma.SocialSupportSubjectWhereInput = {}
  if (isAdmin(user)) {
    return where
  }

  // A non admin user should always have structure id filled
  if (!user.structureId) {
    throw new Error('social-support-subject-constraints: missing structure id')
  }

  Object.assign<
    Prisma.SocialSupportSubjectWhereInput,
    Prisma.SocialSupportSubjectWhereInput
  >(where, {
    ownedByStructureId: user.multiStructureIds
      ? { in: user.multiStructureIds }
      : user.structureId
  })

  return where
}

export const SocialSupportSubjectConstraints = {
  get,
  update: get
}
