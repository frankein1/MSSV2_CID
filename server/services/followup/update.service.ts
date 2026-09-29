import type { Prisma } from '@prisma/client'
import { FollowupMedium, NotificationType } from '@prisma/client'
import { SocialSupportSubjectService } from '../../services'
import {
  deriveFollowupSubtype,
  prepareSocialSupportSubjectsMutations
} from './helper'
import {
  FollowupRepo,
  NotificationRepo,
  SocialSupportRepo
} from '~~/server/database'
import type { EditFollowupInput } from '~~/server/schema'
import type { SecurityRuleContext } from '~~/server/security'
import {
  connect,
  prepareDocumentsMutations,
  prepareRelationUpdates
} from '~/utils/prisma'
import { prismaClient } from '~~/server/prisma'
import { filterOutEmptyElements } from '../helper'
import { getSocialSupportWithRedirections } from '../socialSupport/helper'
import { randomUUID } from 'node:crypto'
import {
  resolveRedirectionReasonIds,
  resolveReasonId,
  deleteOrphanedRedirectionReasons
} from '../redirection/helper'

type UpdateParams = {
  ctx: SecurityRuleContext
  input: EditFollowupInput
}

export const update = async ({ ctx, input }: UpdateParams) => {
  const target = await SocialSupportRepo.findUniqueOrThrow(ctx.user, {
    where: { id: input.socialSupportId },
    select: {
      id: true,
      beneficiaryId: true,
      createdById: true,
      documents: true,
      subjects: true,
      privateSynthesis: true,
      privateSynthesisRichText: true
    }
  })

  const {
    subjects,
    documents,
    medium,
    place,
    thirdPersonName,
    prescribingOrganizationId,
    prescribingOrganizationContactId,
    isMinistry,
    ministerId,
    date,
    synthesis,
    synthesisRichText,
    privateSynthesis,
    privateSynthesisRichText,
    status,
    helpRequested,
    dueDate,
    firstFollowup,
    endOfSocialSupport,
    numeroPegase,
    classified,
    forwardedToJustice,
    isDuringWalkInSession,
    socialSupportId,
    duration,
    socialSupportRedirections,
    supportProgramId
  } = input

  const { socialSupportRedirections: previousRedirectionIds } =
    await getSocialSupportWithRedirections(ctx.user, input.socialSupportId)

  const reasonIds = await resolveRedirectionReasonIds(
    ctx,
    socialSupportRedirections
  )

  const prepareRedirections = socialSupportRedirections
    ?.map(r => {
      if (r.type) {
        return {
          id: r.id || randomUUID(),
          type: r.type,
          redirectionReasonId: resolveReasonId(
            reasonIds,
            r.redirectionReasonName
          ),
          externalStructureName: r.externalStructureName,
          partnerOrganizationId: r.partnerOrganizationId,
          partnerOrganizationContactId: r.partnerOrganizationContactId,
          createdAt: new Date()
        }
      }
    })
    .filter(r => r != null)
    .filter(filterOutEmptyElements)

  const removedReasonIds = prepareRedirections
    ? previousRedirectionIds
        .filter(r => {
          const updated = prepareRedirections.find(p => p.id === r.id)
          return (
            !updated || updated.redirectionReasonId !== r.redirectionReasonId
          )
        })
        .map(r => r.redirectionReasonId)
    : []

  const updateSocialSupport = () =>
    SocialSupportRepo.update(ctx.user, {
      where: { id: socialSupportId },
      data: {
        lastUpdatedBy: connect(ctx.user.id),
        documents: prepareDocumentsMutations(documents, target.documents),
        subjects: prepareSocialSupportSubjectsMutations(
          subjects,
          target.subjects
        ),
        minister: isMinistry && ministerId ? connect(ministerId) : undefined,
        // keep the denormalized subtype in sync with followup.medium
        subtype: deriveFollowupSubtype(medium),
        date,
        synthesis,
        synthesisRichText,
        // only social support creator can update private synthesis. see FollowupPermissions
        // /server/security/permissions/getFollowupPermissions.ts
        privateSynthesis:
          ctx.user.id === target.createdById
            ? privateSynthesis
            : target.privateSynthesis,
        privateSynthesisRichText:
          ctx.user.id === target.createdById
            ? privateSynthesisRichText
            : target.privateSynthesisRichText,
        status,
        numeroPegase,
        endOfSocialSupport,
        dueDate,
        supportProgram: supportProgramId
          ? connect(supportProgramId)
          : { disconnect: true },
        socialSupportRedirections: prepareRedirections
          ? prepareRelationUpdates(prepareRedirections, previousRedirectionIds)
          : undefined
      },
      select: {
        id: true
      }
    })

  const updateFollowup = () =>
    FollowupRepo.update(ctx.user, {
      where: { id: input.id },
      data: {
        prescribingOrganizationId: prescribingOrganizationId || null,
        prescribingOrganizationContactId:
          prescribingOrganizationContactId || null,
        medium,
        place: medium === FollowupMedium.ExternalAppointment ? place : null,
        thirdPersonName:
          medium === FollowupMedium.ThirdParty ? thirdPersonName : null,
        helpRequested,
        firstFollowup,
        classified,
        forwardedToJustice,
        isDuringWalkInSession,
        duration
      },
      select: {
        id: true
      }
    })

  const updateSocialSupportSubject = () =>
    SocialSupportSubjectService.markUsed(ctx, subjects)

  const transactions: (() => Prisma.PrismaPromise<any>)[] = [
    updateSocialSupport,
    updateFollowup,
    updateSocialSupportSubject
  ]

  if (ctx.user.id !== target.createdById) {
    const createNotification = () =>
      NotificationRepo.prisma.create({
        data: {
          recipientId: target.createdById,
          itemCreatedById: ctx.user.id,
          beneficiaryId: target.beneficiaryId,
          socialSupportId: target.id,
          type: NotificationType.UpdateFollowupElement
        },
        select: {
          id: true
        }
      })
    transactions.push(createNotification)
  }

  const [socialSupportResult] = await prismaClient.$transaction(
    transactions.map(transaction => transaction())
  )

  await deleteOrphanedRedirectionReasons(removedReasonIds)

  return { id: socialSupportResult.id }
}
