import type { Prisma } from '@prisma/client'
import { NotificationType } from '@prisma/client'
import { cleanUpdateInput } from './helper'
import {
  SocialSupportRepo,
  HousingHelpRequestRepo,
  FileInstructionRepo,
  NotificationRepo
} from '~~/server/database'
import type { EditHousingHelpRequestInput } from '~~/server/schema'
import type { SecurityRuleContext } from '~~/server/security/rules/types'
import {
  connect,
  prepareDocumentsMutations,
  prepareRelationUpdates
} from '~/utils/prisma'
import { prismaClient } from '~~/server/prisma'
import { getSocialSupportWithRedirections } from '../socialSupport/helper'
import { filterOutEmptyElements } from '../helper'
import { randomUUID } from 'node:crypto'
import {
  resolveRedirectionReasonIds,
  resolveReasonId,
  deleteOrphanedRedirectionReasons
} from '../redirection/helper'

type UpdateParams = {
  ctx: SecurityRuleContext
  input: EditHousingHelpRequestInput
}

export async function update({ input, ctx }: UpdateParams) {
  const target = await HousingHelpRequestRepo.findUniqueOrThrow(ctx.user, {
    where: { id: input.id },
    select: {
      fileInstruction: {
        select: {
          instructorOrganizationId: true,
          socialSupport: {
            select: {
              id: true,
              beneficiaryId: true,
              createdById: true,
              documents: true,
              socialSupportRedirections: true,
              privateSynthesis: true,
              privateSynthesisRichText: true
            }
          }
        }
      }
    }
  })

  const {
    numeroPegase,
    ministerId,
    isMinistry,
    documents,
    socialSupportRedirections,
    externalStructure,
    status,
    examinationDate,
    decisionDate,
    refusalReason,
    prescribingOrganizationId,
    prescribingOrganizationContactId,
    instructorOrganizationId,
    instructorOrganizationContactId,
    dispatchDate,
    handlingDate,
    synthesis,
    synthesisRichText,
    privateSynthesis,
    privateSynthesisRichText,
    dueDate,
    fullFile,
    endOfSocialSupport,
    date,
    isFirst,
    firstOpeningDate,
    askedHousing,
    reason,
    uniqueId,
    taxHouseholdAdditionalInformation,
    maxRent,
    maxCharges,
    housingType,
    roomCount,
    lowIncomeHousingType,
    isPmr,
    supportProgramId
  } = cleanUpdateInput(input)

  const { socialSupportRedirections: previousRedirectionIds } =
    await getSocialSupportWithRedirections(
      ctx.user,
      target.fileInstruction.socialSupport.id
    )

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
      where: { id: target.fileInstruction.socialSupport.id },
      data: {
        lastUpdatedBy: connect(ctx.user.id),
        status,
        synthesis,
        synthesisRichText,
        // only social support creator can update private synthesis. see FileInstructionPermissions
        // /server/security/permissions/getFileInstructionPermissions.ts
        privateSynthesis:
          ctx.user.id === target.fileInstruction.socialSupport.createdById
            ? privateSynthesis
            : target.fileInstruction.socialSupport.privateSynthesis,
        privateSynthesisRichText:
          ctx.user.id === target.fileInstruction.socialSupport.createdById
            ? privateSynthesisRichText
            : target.fileInstruction.socialSupport.privateSynthesisRichText,
        minister: isMinistry && ministerId ? connect(ministerId) : undefined,
        numeroPegase,
        endOfSocialSupport,
        dueDate,
        date,
        supportProgram: supportProgramId
          ? connect(supportProgramId)
          : { disconnect: true },
        documents: prepareDocumentsMutations(
          documents,
          target.fileInstruction.socialSupport.documents
        ),
        socialSupportRedirections: prepareRedirections
          ? prepareRelationUpdates(prepareRedirections, previousRedirectionIds)
          : undefined
      },
      select: {
        id: true,
        familyFile: {
          select: {
            id: true
          }
        }
      }
    })

  const updateFileInstruction = () =>
    FileInstructionRepo.prisma.update({
      where: {
        socialSupportId: target.fileInstruction.socialSupport.id
      },
      data: {
        examinationDate,
        decisionDate,
        refusalReason,
        dispatchDate,
        fullFile,
        externalStructure,
        instructorOrganizationId: instructorOrganizationId || undefined,
        instructorOrganizationContactId:
          instructorOrganizationContactId || undefined
      },
      select: {
        id: true
      }
    })

  const updateHousingHelpRequest = () =>
    HousingHelpRequestRepo.prisma.update({
      where: { id: input.id },
      data: {
        isFirst,
        firstOpeningDate,
        reason,
        uniqueId,
        askedHousing,
        handlingDate,
        housingType: housingType || undefined,
        roomCount: roomCount || undefined,
        lowIncomeHousingType: lowIncomeHousingType || undefined,
        taxHouseholdAdditionalInformation,
        maxRent,
        maxCharges,
        isPmr,
        prescribingOrganizationId: prescribingOrganizationId || null,
        prescribingOrganizationContactId:
          prescribingOrganizationContactId || null
      },
      select: {
        id: true
      }
    })

  const transactions: (() => Prisma.PrismaPromise<any>)[] = [
    updateSocialSupport,
    updateFileInstruction,
    updateHousingHelpRequest
  ]
  if (ctx.user.id !== target.fileInstruction.socialSupport.createdById) {
    const createNotification = () =>
      NotificationRepo.prisma.create({
        data: {
          recipientId: target.fileInstruction.socialSupport.createdById,
          itemCreatedById: ctx.user.id,
          beneficiaryId: target.fileInstruction.socialSupport.beneficiaryId,
          socialSupportId: target.fileInstruction.socialSupport.id,
          type: NotificationType.UpdateFileInstructionElement
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
