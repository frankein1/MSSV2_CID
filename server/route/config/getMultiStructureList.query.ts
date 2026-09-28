import { createQuery } from '~~/server/route'
import type { ProtectedAppContext } from '~~/server/trpc'
import { emptySchema } from '~~/server/schema'
import { AllowSecurityCheck } from '~~/server/security/rules/types'
import { prismaClient } from '~~/server/prisma'

function anonymizeStructureName(name: string): string {
  if (name.length <= 2) {
    return '*'.repeat(name.length)
  }
  if (name.length <= 6) {
    return name[0] + '******' + name[name.length - 1]
  }
  return name.slice(0, 2) + '******' + name.slice(-3)
}

const handler = async ({ ctx: { user } }: { ctx: ProtectedAppContext }) => {
  if (!user.multiStructureIds?.length) {
    return []
  }

  const structures = await prismaClient.structure.findMany({
    select: { id: true, name: true },
    where: { id: { in: user.multiStructureIds } },
    orderBy: { name: 'asc' }
  })

  return structures.map(s => ({
    id: s.id,
    name: anonymizeStructureName(s.name)
  }))
}

export const getMultiStructureListQuery = createQuery({
  handler,
  inputValidation: emptySchema,
  securityCheck: AllowSecurityCheck
})
