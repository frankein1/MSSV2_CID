import type { Prisma } from '@prisma/client'
import { StructureTypeSurveyConstraints } from '../constraints'
import { appendConstraints } from './helper/appendConstraints'
import { prismaClient } from '~~/server/prisma'
import type { SecurityRuleGrantee } from '~~/server/security'

// VIEW

function count(
  user: SecurityRuleGrantee,
  params: Prisma.StructureTypeSurveyCountArgs
) {
  appendConstraints(user, params, StructureTypeSurveyConstraints.get)
  return prismaClient.structureTypeSurvey.count(params)
}

export const StructureTypeSurveyRepo = {
  count,
  prisma: {
    create: prismaClient.structureTypeSurvey.create
  }
}
