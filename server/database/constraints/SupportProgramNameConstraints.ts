import type { Prisma } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import type { SecurityRuleGrantee } from '~~/server/security'
import { isAdmin } from '~~/server/security/rules/helpers'

// All users of a structure can see any program name in the same structure.
const get = (user: SecurityRuleGrantee) => {
  const where: Prisma.SupportProgramNameWhereInput = {}
  if (isAdmin(user)) {
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message:
        'support-program-name-constraints: create not implemented for admin'
    })
  }

  if (!user.structureId) {
    throw new Error('support-program-name-constraints: missing structure id')
  }

  Object.assign<
    Prisma.SupportProgramNameWhereInput,
    Prisma.SupportProgramNameWhereInput
  >(where, {
    structureId: user.multiStructureIds
      ? { in: user.multiStructureIds }
      : user.structureId
  })
  return where
}

const create = (user: SecurityRuleGrantee) => {
  const data: Partial<Prisma.SupportProgramNameCreateInput> = {}
  if (isAdmin(user)) {
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message:
        'support-program-name-constraints: create not implemented for admin'
    })
  }

  if (!user.structureId) {
    throw new Error('support-program-name-constraints: missing structure id')
  }

  Object.assign<
    Partial<Prisma.SupportProgramNameCreateInput>,
    Partial<Prisma.SupportProgramNameCreateInput>
  >(data, {
    createdBy: { connect: { id: user.id } },
    structure: { connect: { id: user.structureId } }
  })
  return data
}

export const SupportProgramNameConstraints = {
  get,
  create,
  // The edit/deletion authorization management is done in the security check
  update: get,
  delete: get
}
