import { createQuery } from '~~/server/route'
import type { ProtectedAppContext } from '~~/server/trpc'
import { formatUserDisplayName } from '~/utils/user'
import { emptySchema } from '~~/server/schema'
import { AllowSecurityCheck } from '~~/server/security/rules/types'
import { UserRepo } from '~~/server/database'

const handler = async ({ ctx: { user } }: { ctx: ProtectedAppContext }) => {
  return await UserRepo.findMany(user, {
    select: {
      id: true,
      // firstName: true,
      // lastName: true,
      status: true
    },
    where: {
      role: { not: 'Administrator' },
      structureId: user.structureId
    }
    // orderBy: { lastName: 'asc' }
  }).then(agents =>
    agents.map(user => ({
      id: user.id,
      name: formatUserDisplayName({ ...user, firstName: '', lastName: '' }),
      status: user.status
    }))
  )
}

export const getAgentsQuery = createQuery({
  handler,
  inputValidation: emptySchema,
  securityCheck: AllowSecurityCheck
})
