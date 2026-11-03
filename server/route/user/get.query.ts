import { createQuery } from '~~/server/route'
import { forbiddenError, type ProtectedAppContext } from '~~/server/trpc'
import type { GetUserInput } from '~~/server/schema'
import { getUserSchema } from '~~/server/schema'
import { UserRepo } from '~~/server/database'
import type { SecurityRuleContext } from '~~/server/security/rules/types'
import { getAppContextPermissions } from '~~/server/security'
import { UserRole, type Prisma } from '@prisma/client'
import type { UserBlockingRelation } from '~~/client/labels'

const securityCheck = (ctx: SecurityRuleContext) =>
  getAppContextPermissions(ctx).module.users

const userSelect = {
  id: true,
  // firstName: true,
  // lastName: true,
  // email: true,
  role: true,
  status: true,
  aidantConnectAuthorisation: true,
  externalRdvspId: true
} as const satisfies Prisma.UserSelect

/** Relations whose foreign key blocks a deletion, only the delete page needs them */
const blockingRelationsSelect = {
  referentFor: true,
  createdDocuments: true,
  createdSocialSupports: true,
  createdComments: true,
  createdWorkshops: true,
  createdWorkshopNames: true,
  archivedBeneficiaries: true,
  createdRedirectionReasons: true,
  createdSupportProgramNames: true
} as const satisfies Prisma.UserCountOutputTypeSelect

const handler = async ({
  ctx,
  input: { id, withCounts }
}: {
  ctx: ProtectedAppContext
  input: GetUserInput
}) => {
  if (!withCounts) {
    const user = await UserRepo.findUniqueOrThrow(ctx.user, {
      where: { id },
      select: userSelect
    })

    if (user.role === UserRole.Administrator) {
      throw forbiddenError(
        'Cannot have an Administrator among user-managed users'
      )
    }

    return {
      id: user.id,
      // firstName: user.firstName,
      // lastName: user.lastName,
      // email: user.email,
      role: user.role,
      status: user.status,
      aidantConnectAuthorisation: user.aidantConnectAuthorisation,
      externalRdvspId: user.externalRdvspId,
      _count: undefined
    }
  }

  const user = await UserRepo.findUniqueOrThrow(ctx.user, {
    where: { id },
    select: { ...userSelect, _count: { select: blockingRelationsSelect } }
  })

  if (user.role === UserRole.Administrator) {
    throw forbiddenError(
      'Cannot have an Administrator among user-managed users'
    )
  }

  return {
    id: user.id,
    // firstName: user.firstName,
    // lastName: user.lastName,
    // email: user.email,
    role: user.role,
    status: user.status,
    aidantConnectAuthorisation: user.aidantConnectAuthorisation,
    externalRdvspId: user.externalRdvspId,
    _count: {
      referentFor: user._count.referentFor,
      createdDocuments: user._count.createdDocuments,
      createdSocialSupports: user._count.createdSocialSupports,
      createdComments: user._count.createdComments,
      workshops: user._count.createdWorkshops,
      workshopNames: user._count.createdWorkshopNames,
      archivedBeneficiaries: user._count.archivedBeneficiaries,
      redirectionReasons: user._count.createdRedirectionReasons,
      supportProgramNames: user._count.createdSupportProgramNames
    } satisfies Record<UserBlockingRelation, number>
  }
}

export type SructureUser = Prisma.PromiseReturnType<typeof handler>

export const getUserQuery = createQuery({
  inputValidation: getUserSchema,
  securityCheck,
  handler
})
