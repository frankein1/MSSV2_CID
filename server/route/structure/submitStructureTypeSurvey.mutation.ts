import { TRPCError } from '@trpc/server'
import { UserActivityObject, UserActivityType } from '@prisma/client'
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
  const existingSurveyCount = await StructureTypeSurveyRepo.count(ctx.user, {})
  // The survey can only be submitted once per structure
  if (existingSurveyCount > 0) {
    throw new TRPCError({
      code: 'CONFLICT',
      message: `Survey already submitted for structure ${ctx.structure.id}`
    })
  }

  return StructureTypeSurveyRepo.prisma.create({
    data: {
      ...input,
      structureId: ctx.structure.id,
      filledById: ctx.user.id
    },
    select: { id: true }
  })
}

const securityCheck = (ctx: SecurityRuleContext) =>
  getAppContextPermissions(ctx).edit.structureTypeSurvey

export const submitStructureTypeSurvey = createMutation({
  handler,
  inputValidation: submitStructureTypeSurveySchema,
  securityCheck,
  auditLog: {
    key: 'structure.typeSurvey.submit',
    target: UserActivityObject.Structure,
    targetId: ({ ctx }) => ctx.structure.id,
    action: UserActivityType.CREATE
  }
})
