import { createQuery } from '~~/server/route'
import type { ProtectedAppContext } from '~~/server/trpc'
import type { SecurityRuleGrantee } from '~~/server/security/rules/types'
import { AllowSecurityCheck } from '~~/server/security/rules/types'
import { WorkshopAttendeeRepo, WorkshopRepo } from '~~/server/database'
import { getWorkshopSchema } from '~~/server/schema/workshop/getWorkshop.schema'
import { isReferent } from '~~/server/security'
import { formatWorkshopAttendees } from '~~/server/services/workshop/helper'
import { WorkshopAttendeeListType } from '@prisma/client'

export const handler = async ({
  ctx: { user },
  input
}: {
  ctx: ProtectedAppContext
  input: { id: string; includeAttendees?: boolean }
}) => {
  if (input.includeAttendees) {
    return await getOneWithAttendees(user, input.id)
  }
  return await getOne(user, input.id)
}

async function getAttendeeCount(user: SecurityRuleGrantee, workshopId: string) {
  const [mainAttendeeCount, waitingAttendeeCount] = await Promise.all([
    WorkshopAttendeeRepo.count(user, {
      where: { listType: WorkshopAttendeeListType.Main, workshopId }
    }),
    WorkshopAttendeeRepo.count(user, {
      where: { listType: WorkshopAttendeeListType.Waiting, workshopId }
    })
  ])

  return {
    mainAttendees: mainAttendeeCount,
    waitingAttendees: waitingAttendeeCount
  }
}

export const getOne = async (user: SecurityRuleGrantee, id: string) => {
  const [workshop, _count] = await Promise.all([
    WorkshopRepo.findUniqueOrThrow(user, {
      where: { id },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        location: true,
        partnerOrganizationId: true,
        supportProgramNameId: true,
        host: true,
        sessionName: true,
        description: true,
        ageLimit: true,
        ageLimitCondition: true,
        attendeeLimit: true,
        chargeable: true,
        workshopName: { select: { name: true } },
        supportProgramName: { select: { id: true, name: true } }
      }
    }),
    getAttendeeCount(user, id)
  ])

  return { ...workshop, _count }
}
export const getOneWithAttendees = async (
  user: SecurityRuleGrantee,
  id: string
) => {
  const [{ workshopAttendees, ...rest }, _count] = await Promise.all([
    WorkshopRepo.findUniqueOrThrow(user, {
      where: { id },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        location: true,
        partnerOrganizationId: true,
        supportProgramNameId: true,
        host: true,
        sessionName: true,
        description: true,
        ageLimit: true,
        ageLimitCondition: true,
        attendeeLimit: true,
        chargeable: true,
        workshopName: { select: { name: true } },
        partnerOrganization: { select: { id: true, name: true } },
        supportProgramName: { select: { id: true, name: true } },
        workshopAttendees: {
          select: {
            id: true,
            created: true,
            updated: true,
            workshopId: true,
            attendance: true,
            type: true,
            listType: true,
            comment: true,
            paymentReceived: true,
            paymentAmount: true,
            beneficiaryId: true,
            workshopExternalAttendeeId: true,
            beneficiary: {
              select: {
                birthDate: true,
                // birthName: true,
                // firstName: true,
                // usualName: true,
                title: true,
                // street: true,
                city: true,
                zipcode: true
                // phone1: true,
                // email: true
              }
            },
            workshopExternalAttendee: {
              select: {
                // firstName: true,
                // lastName: true,
                gender: true,
                // birthDate: true,
                // email: true,
                city: true,
                // phone: true,
                isAnonymized: true
              }
            }
          },
          // WorkshopAttendeeConstraints can't apply here — nested relation selects bypass the constraint layer
          ...(isReferent(user) && {
            where: {
              OR: [
                {
                  type: { not: 'Beneficiary' }
                },
                {
                  beneficiary: {
                    familyFile: { referents: { some: { id: user.id } } }
                  }
                }
              ]
            }
          }),
          // `id` is a deterministic tiebreaker: attendees duplicated in one
          // transaction share the same `created` timestamp, so without it the
          // order is undefined and can reshuffle after any attendee update.
          orderBy: [{ created: 'asc' }, { id: 'asc' }]
        }
      }
    }),
    getAttendeeCount(user, id)
  ])

  return {
    ...rest,
    _count,
    workshopAttendees: formatWorkshopAttendees(workshopAttendees)
  }
}

export const getQuery = createQuery({
  handler,
  securityCheck: AllowSecurityCheck,
  inputValidation: getWorkshopSchema
})
