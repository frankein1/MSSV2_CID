import { createQuery } from '~~/server/route'
import type { ProtectedAppContext } from '~~/server/trpc'
import {
  statFilterOptionsInputSchema,
  type StatFilterOptionsInput
} from '~~/server/schema'
import { AllowSecurityCheck } from '~~/server/security/rules/types'
import { SupportProgramNameRepo } from '~~/server/database'

const handler = async ({
  ctx,
  input
}: {
  ctx: ProtectedAppContext
  input: StatFilterOptionsInput
}) => {
  return await SupportProgramNameRepo.findMany(ctx.user, {
    select: { id: true, name: true, hasLifecycle: true },
    where: {
      AND: [
        { supportPrograms: { some: {} } },
        ...(input.structureIds?.length
          ? [{ structureId: { in: input.structureIds } }]
          : [])
      ]
    },
    orderBy: { name: 'asc' }
  })
}

export const getActiveSupportProgramNameListQuery = createQuery({
  inputValidation: statFilterOptionsInputSchema,
  securityCheck: AllowSecurityCheck,
  handler
})
