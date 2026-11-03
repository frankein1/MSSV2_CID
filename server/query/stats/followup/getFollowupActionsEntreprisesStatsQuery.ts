import { StructureType, type Prisma } from '@prisma/client'
import { prepareSocialSupportStatFilters } from '../helpers'
import { FollowupRepo } from '~~/server/database'
import type { StatFilterInput } from '~~/server/schema'
import type { ProtectedAppContext } from '~~/server/trpc'

// Each action is a Followup flag, ticked in the followup form
type ActionEntrepriseId = 'helpRequested' | 'classified' | 'forwardedToJustice'

type ActionEntrepriseStat = {
  actionEntrepriseId: ActionEntrepriseId
  actionEntreprise: string
  _count: number
}

const sortByCountDesc = (stats: ActionEntrepriseStat[]) =>
  stats.sort((a, b) => b._count - a._count)

async function getActionsEntreprises(
  ctx: ProtectedAppContext,
  socialSupportFilters: Prisma.SocialSupportWhereInput
): Promise<[ActionEntrepriseStat]> {
  const helpRequestedCount = await FollowupRepo.count(ctx.user, {
    where: { socialSupport: socialSupportFilters, helpRequested: true }
  })

  return [
    {
      actionEntrepriseId: 'helpRequested',
      actionEntreprise: 'Instruction',
      _count: helpRequestedCount
    }
  ]
}

async function getActionsEntreprisesForMinistere(
  ctx: ProtectedAppContext,
  socialSupportFilters: Prisma.SocialSupportWhereInput
) {
  const followups = await FollowupRepo.findMany(ctx.user, {
    where: { socialSupport: socialSupportFilters },
    select: { helpRequested: true, classified: true, forwardedToJustice: true }
  })

  const helpRequested: ActionEntrepriseStat = {
    actionEntrepriseId: 'helpRequested',
    actionEntreprise: 'Instruction',
    _count: 0
  }
  const classified: ActionEntrepriseStat = {
    actionEntrepriseId: 'classified',
    actionEntreprise: 'Classé',
    _count: 0
  }
  const forwardedToJustice: ActionEntrepriseStat = {
    actionEntrepriseId: 'forwardedToJustice',
    actionEntreprise: 'Transmis à la justice',
    _count: 0
  }

  // An action counts only when its box is ticked: false and null both mean "not taken"
  for (const followup of followups) {
    if (followup.helpRequested === true) {
      helpRequested._count++
    }
    if (followup.classified === true) {
      classified._count++
    }
    if (followup.forwardedToJustice === true) {
      forwardedToJustice._count++
    }
  }

  return sortByCountDesc([helpRequested, classified, forwardedToJustice])
}

export async function getFollowupActionsEntreprisesStatsQuery(
  ctx: ProtectedAppContext,
  input: StatFilterInput
) {
  const socialSupportFilters = prepareSocialSupportStatFilters(input)

  return ctx.structure.type === StructureType.Ministere
    ? getActionsEntreprisesForMinistere(ctx, socialSupportFilters)
    : getActionsEntreprises(ctx, socialSupportFilters)
}
