import type { Prisma } from '@prisma/client'
import { BeneficiaryRepo } from '~~/server/database'
import type { SecurityRuleContext } from '~~/server/security'

export async function getBeneficiaryListQuery(
  ctx: SecurityRuleContext,
  args: Omit<Prisma.BeneficiaryFindManyArgs, 'select' | 'include'>,
  options?: { referents?: boolean }
) {
  return BeneficiaryRepo.findMany(ctx.user, {
    where: args.where,
    select: {
      id: true,
      familyFileId: true,
      // firstName: true,
      // birthName: true,
      // usualName: true,
      // birthDate: true,
      // phone1: true,
      // street: true,
      city: true,
      zipcode: true,
      ...(options?.referents && {
        familyFile: {
          select: {
            referents: {
              select: { id: true }
            }
          }
        }
      })
    },
    take: args.take,
    skip: args.skip,
    orderBy: args.orderBy
  })
}
