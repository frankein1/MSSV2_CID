import {
  FollowupMedium,
  NotificationType,
  SocialSupportType
} from '@prisma/client'
import { SocialSupportSubjectService } from '../../services'
import {
  deriveFollowupSubtype,
  prepareSocialSupportSubjectsMutations
} from './helper'
import { FamilyFileRepo, SocialSupportRepo } from '~~/server/database'
import type { AddFollowupInput } from '~~/server/schema'
import type { SecurityRuleContext } from '~~/server/security'
import { connect, prepareDocumentsMutations } from '~/utils/prisma'
import { randomUUID } from 'node:crypto'
import {
  resolveRedirectionReasonIds,
  resolveReasonId
} from '../redirection/helper'

type CreateParams = {
  ctx: SecurityRuleContext
  input: AddFollowupInput
}

export const create = async ({ ctx, input }: CreateParams) => {
  const { structure, user } = ctx
  const {
    familyFileId,
    beneficiaryId,
    subjects,
    documents,
    medium,
    place,
    thirdPersonName,
    prescribingOrganizationId,
    prescribingOrganizationContactId,
    ministerId,
    isMinistry,
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
    duration,
    socialSupportRedirections,
    supportProgramId
  } = input

  const familyFile = await FamilyFileRepo.findUniqueOrThrow(user, {
    where: { id: familyFileId },
    select: {
      referents: {
        select: {
          id: true
        }
      }
    }
  })
  const reasonIds = await resolveRedirectionReasonIds(
    ctx,
    socialSupportRedirections
  )
  const redirectionData =
    socialSupportRedirections
      ?.map(r => {
        if (r.type) {
          return {
            id: r.id || randomUUID(),
            type: r.type,
            redirectionReasonId: resolveReasonId(
              reasonIds,
              r.redirectionReasonName
            ),
            externalStructureName: r.externalStructureName || null,
            partnerOrganizationId: r.partnerOrganizationId || null,
            partnerOrganizationContactId: r.partnerOrganizationContactId || null
          }
        }
      })
      .filter(r => r != null) || []

  const fu = await SocialSupportRepo.prisma.create({
    data: {
      status,
      socialSupportType: SocialSupportType.Followup,
      subtype: deriveFollowupSubtype(medium),
      date,
      structure: connect(structure.id),
      familyFile: connect(familyFileId),
      beneficiary: connect(beneficiaryId),
      createdBy: connect(user.id),
      subjects: prepareSocialSupportSubjectsMutations(subjects),
      documents: prepareDocumentsMutations(documents),
      notifications: {
        createMany: {
          data: familyFile.referents
            .filter(referent => referent.id !== user.id)
            .map(referent => ({
              beneficiaryId,
              recipientId: referent.id,
              type: NotificationType.NewFollowupElement,
              itemCreatedById: user.id
            }))
        }
      },
      minister: isMinistry && ministerId ? connect(ministerId) : undefined,
      numeroPegase,
      endOfSocialSupport,
      synthesis,
      synthesisRichText,
      privateSynthesis,
      privateSynthesisRichText,
      dueDate,
      supportProgram: supportProgramId ? connect(supportProgramId) : undefined,
      followup: {
        create: {
          prescribingOrganization: prescribingOrganizationId
            ? connect(prescribingOrganizationId)
            : undefined,
          prescribingOrganizationContact: prescribingOrganizationContactId
            ? connect(prescribingOrganizationContactId)
            : undefined,
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
        }
      },
      socialSupportRedirections: {
        createMany: {
          data: redirectionData
        }
      }
    },
    select: {
      id: true
    }
  })

  await SocialSupportSubjectService.markUsed({ structure, user }, subjects)

  return { id: fu.id }
}
