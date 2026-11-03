import { createQuery } from '~~/server/route'
import type { ProtectedAppContext } from '~~/server/trpc'
import { AllowSecurityCheck } from '~~/server/security/rules/types'
import {
  statFilterOptionsInputSchema,
  type StatFilterOptionsInput
} from '~~/server/schema'
import { StructureService } from '~~/server/services'

const handler = async ({
  ctx,
  input
}: {
  ctx: ProtectedAppContext
  input: StatFilterOptionsInput
}) => {
  return await StructureService.getActiveOrUsedSocialSupportSubjects({
    ctx,
    structureIds: input.structureIds
  })
}

export const getActiveOrUsedSocialSupportSubjects = createQuery({
  handler,
  securityCheck: AllowSecurityCheck,
  inputValidation: statFilterOptionsInputSchema
})
