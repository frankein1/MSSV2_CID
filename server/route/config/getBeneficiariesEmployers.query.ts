import { createQuery } from '~~/server/route'
import type { ProtectedAppContext } from '~~/server/trpc'
import {
  statFilterOptionsInputSchema,
  type StatFilterOptionsInput
} from '~~/server/schema'
import { AllowSecurityCheck } from '~~/server/security/rules/types'
import { BeneficiaryRepo, BeneficiaryConstraints } from '~~/server/database'

const handler = async ({
  ctx: { user },
  input
}: {
  ctx: ProtectedAppContext
  input: StatFilterOptionsInput
}) => {
  const constraints = BeneficiaryConstraints.get(user)

  return await BeneficiaryRepo.prisma.groupBy({
    by: ['employer'],
    where: {
      AND: [
        { employer: { not: null, notIn: [''] } },
        constraints,
        ...(input.structureIds?.length
          ? [{ structureId: { in: input.structureIds } }]
          : [])
      ]
    },
    orderBy: [{ employer: 'asc' }]
  })
}

export const getBeneficiariesEmployersQuery = createQuery({
  handler,
  inputValidation: statFilterOptionsInputSchema,
  securityCheck: AllowSecurityCheck
})
