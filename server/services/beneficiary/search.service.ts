import { prepareBeneficiarySearchConditions } from './helper'
import type { SearchBeneficiaryInput } from '~~/server/schema'
import type { SecurityRuleContext } from '~~/server/security'
import { BeneficiaryRepo } from '~~/server/database'
import { StructureType } from '@prisma/client'

export async function search({
  ctx,
  input
}: {
  ctx: SecurityRuleContext
  input: SearchBeneficiaryInput
}) {
  const isMinistry = ctx.structure.type === StructureType.Ministere
  const searchConditions = prepareBeneficiarySearchConditions(input.query, {
    isMinistry
  })

  const where = {
    ...searchConditions,
    id: { notIn: input.excludedIds }
  }

  // TODO benchmark this and stress tes, then create indexes for case-insensitive filtering.
  // TODO check pg_trgm https://www.postgresql.org/docs/12/pgtrgm.html#id-1.11.7.40.7 for indexing
  const results = await BeneficiaryRepo.findMany(ctx.user, {
    where,
    orderBy: [{ birthDate: 'asc' }],
    select: {
      id: true,
      familyFileId: true,
      // ANONYMIZED fileNumber, usualName, firstName, birthName, phone1, numeroPegase
      status: true,
      birthDate: true
    },
    take: 10
  })
  return results
}
