import type { Prisma } from '@prisma/client'
import { NotificationType } from '@prisma/client'
import { SocialSupportSubjectService } from '../../services'
import { cleanUpdateInput } from './helper'
import {
  SocialSupportRepo,
  HelpRequestRepo,
  FileInstructionRepo,
  NotificationRepo
} from '~~/server/database'
import type { EditHelpRequestInput } from '~~/server/schema'
import type { SecurityRuleContext } from '~~/server/security/rules/types'
import {
  prepareDocumentsMutations,
  connect,
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
  input: EditHelpRequestInput
}

export async function update({ input, ctx }: UpdateParams) {
  const target = await HelpRequestRepo.findUniqueOrThrow(ctx.user, {
    where: { id: input.id },
    select: {
      financialSupport: true,
      fileInstruction: {
        select: {
          instructorOrganizationId: true,
          socialSupport: {
            select: {
              id: true,
              beneficiaryId: true,
              createdById: true,
              subjects: true,
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
    subjectId,
    documents,
    socialSupportRedirections,
    externalStructure,
    status,
    askedAmount,
    examinationDate,
    decisionDate,
    allocatedAmount,
    paymentMethod,
    paymentDate,
    handlingDate,
    refusalReason,
    prescribingOrganizationId,
    prescribingOrganizationContactId,
    instructorOrganizationId,
    instructorOrganizationContactId,
    dispatchDate,
    synthesis,
    synthesisRichText,
    privateSynthesis,
    privateSynthesisRichText,
    dueDate,
    fullFile,
    endOfSocialSupport,
    date,
    isRefundable,
    supportProgramId
  } = cleanUpdateInput({ input, isFinancial: target.financialSupport })
  const disconnectSubject = target.fileInstruction.socialSupport.subjects
    .filter(s => s.id !== subjectId)
    .map(({ id }) => ({ id }))

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
          partnerOrganizationContactId: r.partnerOrganizationContactId
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
        subjects: {
          ...connect(subjectId),
          disconnect: disconnectSubject
        },
        documents: prepareDocumentsMutations(
          documents,
          target.fileInstruction.socialSupport.documents
        ),
        socialSupportRedirections: prepareRedirections
          ? prepareRelationUpdates(prepareRedirections, previousRedirectionIds)
          : undefined
      },
      select: {
        id: true
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
        instructorOrganizationId: instructorOrganizationId || null,
        instructorOrganizationContactId: instructorOrganizationContactId || null
      },
      select: {
        id: true
      }
    })

  const updateHelpRequest = () =>
    HelpRequestRepo.prisma.update({
      where: { id: input.id },
      data: {
        askedAmount,
        allocatedAmount,
        paymentMethod,
        paymentDate,
        handlingDate,
        isRefundable,
        subjectId,
        prescribingOrganizationId: prescribingOrganizationId || null,
        prescribingOrganizationContactId:
          prescribingOrganizationContactId || null
      },
      select: {
        id: true
      }
    })

  const updateSocialSupportSubject = () =>
    SocialSupportSubjectService.markUsed(ctx, [subjectId])

  const transactions: (() => Prisma.PrismaPromise<any>)[] = [
    updateSocialSupport,
    updateFileInstruction,
    updateHelpRequest,
    updateSocialSupportSubject
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
