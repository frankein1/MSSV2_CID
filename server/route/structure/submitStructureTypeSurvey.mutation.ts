import { TRPCError } from '@trpc/server'
import { Prisma, UserActivityObject, UserActivityType } from '@prisma/client'
import { createMutation } from '~~/server/route'
import type { ProtectedAppContext } from '~~/server/trpc'
import type { SubmitStructureTypeSurveyInput } from '~~/server/schema'
import { submitStructureTypeSurveySchema } from '~~/server/schema'
import type { SecurityRuleContext } from '~~/server/security'
import { getAppContextPermissions } from '~~/server/security'
import { StructureTypeSurveyRepo } from '~~/server/database'

const handler = async ({
  input,
  ctx
}: {
  input: SubmitStructureTypeSurveyInput
  ctx: ProtectedAppContext
}) => {
  const alreadySubmittedError = new TRPCError({
    code: 'CONFLICT',
    message: `Survey already submitted for structure`
  })

  const existingSurveyCount = await StructureTypeSurveyRepo.count(ctx.user, {})
  // The survey can only be submitted once per structure
  if (existingSurveyCount > 0) {
    throw alreadySubmittedError
  }

  try {
    return await StructureTypeSurveyRepo.prisma.create({
      data: {
        ...input,
        structureId: ctx.structure.id,
        filledById: ctx.user.id
      },
      select: { id: true }
    })
  } catch (error) {
    // Concurrent submissions: the unique constraint on structureId rejects the second one
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw alreadySubmittedError
    }
    throw error
  }
}

const securityCheck = (ctx: SecurityRuleContext) =>
  getAppContextPermissions(ctx).edit.structureTypeSurvey

export const submitStructureTypeSurvey = createMutation({
  handler,
  inputValidation: submitStructureTypeSurveySchema,
  securityCheck,
  auditLog: {
    key: 'structure.submit-structure-type-survey',
    target: UserActivityObject.Structure,
    targetId: ({ ctx }) => ctx.structure.id,
    action: UserActivityType.CREATE
  }
})
