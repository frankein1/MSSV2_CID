import type { Prisma } from '@prisma/client'
import type { SecurityRuleGrantee } from '~~/server/security'
import { isAdmin } from '~~/server/security/rules/helpers'

const get = (user: SecurityRuleGrantee) => {
  const where: Prisma.StructureTypeSurveyWhereInput = {}
  if (isAdmin(user)) {
    return where
  }

  if (!user.structureId) {
    throw new Error('structure-type-survey-constraints: missing structure id')
  }

  Object.assign<
    Prisma.StructureTypeSurveyWhereInput,
    Prisma.StructureTypeSurveyWhereInput
  >(where, {
    structureId: user.structureId
  })
  return where
}

export const StructureTypeSurveyConstraints = {
  get
}
