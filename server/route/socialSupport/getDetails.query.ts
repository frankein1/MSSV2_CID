import type { Prisma } from '@prisma/client'
import { createQuery } from '~~/server/route'
import type { ProtectedAppContext } from '~~/server/trpc'
import type { SecurityRuleContext } from '~~/server/security'
import type { IdInput } from '~~/server/schema'
import { idSchema } from '~~/server/schema'
import { SocialSupportRepo } from '~~/server/database'
import { SocialSupportService } from '~~/server/services'
import { formatSocialSupportDetail } from './utils'

async function getSocialSupportDetail({
  ctx,
  input: { id }
}: {
  input: { id: string }
  ctx: ProtectedAppContext
}) {
  return SocialSupportRepo.findUniqueOrThrow(ctx.user, {
    where: { id },
    select: {
      id: true,
      structureId: true,
      familyFileId: true,
      beneficiaryId: true,
      createdById: true,
      lastUpdatedById: true,
      date: true,
      synthesis: true,
      privateSynthesis: true,
      synthesisRichText: true,
      privateSynthesisRichText: true,
      ministerId: true,
      numeroPegase: true,
      endOfSocialSupport: true,
      status: true,
      dueDate: true,
      created: true,
      updated: true,
      socialSupportType: true,
      subtype: true,
      supportProgramId: true,
      supportProgram: {
        select: {
          id: true,
          startDate: true,
          endDate: true,
          supportProgramName: {
            select: { id: true, name: true, hasLifecycle: true }
          }
        }
      },
      createdBy: {
        select: {
          id: true
          // firstName: true,
          // lastName: true
        }
      },
      lastUpdatedBy: {
        select: {
          id: true
          // firstName: true,
          // lastName: true
        }
      },
      familyFile: {
        select: {
          id: true,
          structureId: true,
          referents: {
            select: { id: true, role: true, status: true, structureId: true }
          }
        }
      },
      beneficiary: {
        select: {
          id: true
          // firstName: true,
          // usualName: true,
          // birthName: true,
          // birthDate: true
        }
      },
      documents: true,
      subjects: true,
      minister: true,
      socialSupportRedirections: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          type: true,
          externalStructureName: true,
          partnerOrganizationId: true,
          partnerOrganizationContactId: true,
          socialSupportId: true,
          createdAt: true,
          partnerOrganization: true,
          partnerOrganizationContact: true,
          redirectionReason: { select: { name: true } }
        }
      },
      comments: {
        orderBy: { created: 'asc' },
        select: {
          id: true,
          created: true,
          createdById: true,
          updated: true,
          content: true,
          socialSupportId: true,
          createdBy: true
        }
      },
      fileInstruction: {
        select: {
          id: true,
          updated: true,
          type: true,
          instructorOrganizationId: true,
          instructorOrganizationContactId: true,
          externalStructure: true,
          examinationDate: true,
          decisionDate: true,
          refusalReason: true,
          refusalReasonOther: true,
          dispatchDate: true,
          fullFile: true,
          socialSupportId: true,
          instructorOrganization: true,
          instructorOrganizationContact: true,
          helpRequest: {
            select: {
              id: true,
              subjectId: true,
              prescribingOrganizationId: true,
              prescribingOrganizationContactId: true,
              financialSupport: true,
              isRefundable: true,
              askedAmount: true,
              allocatedAmount: true,
              paymentMethod: true,
              paymentDate: true,
              handlingDate: true,
              fileInstructionId: true,
              prescribingOrganization: true,
              prescribingOrganizationContact: true
            }
          },
          housingHelpRequest: {
            select: {
              id: true,
              prescribingOrganizationId: true,
              prescribingOrganizationContactId: true,
              isFirst: true,
              firstOpeningDate: true,
              askedHousing: true,
              uniqueId: true,
              taxHouseholdAdditionalInformation: true,
              maxRent: true,
              maxCharges: true,
              housingType: true,
              roomCount: true,
              isPmr: true,
              reason: true,
              lowIncomeHousingType: true,
              handlingDate: true,
              fileInstructionId: true,
              prescribingOrganization: true,
              prescribingOrganizationContact: true
            }
          }
        }
      },
      followup: {
        select: {
          id: true,
          updated: true,
          prescribingOrganizationId: true,
          prescribingOrganizationContactId: true,
          medium: true,
          helpRequested: true,
          place: true,
          // thirdPersonName: true,
          classified: true,
          firstFollowup: true,
          forwardedToJustice: true,
          isDuringWalkInSession: true,
          duration: true,
          socialSupportId: true,
          prescribingOrganization: true,
          prescribingOrganizationContact: true
        }
      },
      _count: {
        select: {
          notifications: {
            where: { readAt: null, recipientId: ctx.user.id }
          }
        }
      }
    }
  })
}

const handler = async ({
  ctx,
  input
}: {
  input: { id: string }
  ctx: ProtectedAppContext
}) => {
  const socialSupport = await getSocialSupportDetail({ ctx, input })

  return formatSocialSupportDetail(socialSupport, ctx, socialSupport.familyFile)
}

export type SocialSupportDetail = Prisma.PromiseReturnType<
  typeof getSocialSupportDetail
>

const securityCheck = async (ctx: SecurityRuleContext, input: IdInput) => {
  const permissions = await SocialSupportService.getEditionPermissions(
    ctx,
    input.id
  )
  return permissions.view
}

export const getDetails = createQuery({
  inputValidation: idSchema,
  securityCheck,
  handler
})
