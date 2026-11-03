import type { Prisma } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import type { SecurityRuleGrantee } from '~~/server/security'
import { isAdmin, isReferent } from '~~/server/security/rules/helpers'

const get = (user: SecurityRuleGrantee) => {
  const where: Prisma.BeneficiaryWhereInput = {}
  if (isAdmin(user)) {
    return where
  }

  // A non admin user should always have structure id filled
  if (!user.structureId) {
    throw new Error('beneficiary-constraints: missing structure id')
  }

  Object.assign<Prisma.BeneficiaryWhereInput, Prisma.BeneficiaryWhereInput>(
    where,
    {
      structureId: user.multiStructureIds
        ? { in: user.multiStructureIds }
        : user.structureId
    }
  )

  if (isReferent(user)) {
    Object.assign<Prisma.BeneficiaryWhereInput, Prisma.BeneficiaryWhereInput>(
      where,
      {
        familyFile: { referents: { some: { id: user.id } } }
      }
    )
  }

  return where
}

const create = (user: SecurityRuleGrantee) => {
  const data: Partial<Prisma.BeneficiaryCreateInput> = {}
  if (isAdmin(user)) {
    throw new TRPCError({
      code: 'NOT_IMPLEMENTED',
      message: 'beneficiary-constraints: create not implemented for admin'
    })
  }

  if (!user.structureId) {
    throw new Error('beneficiary-constraints: missing structure id')
  }

  Object.assign<
    Partial<Prisma.BeneficiaryCreateInput>,
    Partial<Prisma.BeneficiaryCreateInput>
  >(data, {
    structure: { connect: { id: user.structureId } },
    createdBy: { connect: { id: user.id } }
  })
  return data
}

export const BeneficiaryConstraints = {
  get,
  update: get,
  create
}
