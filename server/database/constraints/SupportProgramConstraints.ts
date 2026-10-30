import type { Prisma } from '@prisma/client'
import type { SecurityRuleGrantee } from '~~/server/security'
import { isAdmin, isReferent } from '~~/server/security/rules/helpers'

const get = (user: SecurityRuleGrantee) => {
  const where: Prisma.SupportProgramWhereInput = {}

  if (isAdmin(user)) {
    // Review app only: crossStructureProcedure runs as an admin to read every structure
    return where
  }

  if (!user.structureId) {
    throw new Error('support-program-constraints: missing structure id')
  }

  Object.assign<
    Prisma.SupportProgramWhereInput,
    Prisma.SupportProgramWhereInput
  >(where, {
    supportProgramName: { structureId: user.structureId }
  })

  if (isReferent(user)) {
    Object.assign<
      Prisma.SupportProgramWhereInput,
      Prisma.SupportProgramWhereInput
    >(where, {
      beneficiary: {
        familyFile: { referents: { some: { id: user.id } } }
      }
    })
  }
  return where
}

export const SupportProgramConstraints = {
  get
}
