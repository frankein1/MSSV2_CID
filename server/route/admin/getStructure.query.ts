import { createQuery } from '~~/server/route'
import type { AdminContext } from '~~/server/trpc'
import type { IdInput } from '~~/server/schema'
import { idSchema } from '~~/server/schema'
import { AllowSecurityCheck } from '~~/server/security/rules/types'
import { SocialSupportSubjectRepo, StructureRepo } from '~~/server/database'

const adminHandler = async ({
  ctx: { user },
  input
}: {
  ctx: AdminContext
  input: IdInput
}) => {
  const { users, ...structure } = await StructureRepo.findUniqueOrThrow(user, {
    where: { id: input.id },
    select: {
      id: true,
      name: true,
      type: true,
      address: true,
      zipcode: true,
      city: true,
      phone: true,
      // email: true,
      inhabitantsNumber: true,
      inseeCode: true,
      siret: true,
      // dpoFirstName: true,
      // dpoLastName: true,
      // dpoEmail: true,
      typeSurvey: {
        select: {
          structureType: true,
          structureTypeOther: true,
          socialSupportTypes: true
        }
      },
      externalRdvspActive: true,
      created: true,
      lastAccess: true,
      deactivationAlertEmail: true,
      deactivationAlertEmailDate: true,
      _count: {
        select: {
          beneficiaries: true,
          socialSupports: true,
          users: true
        }
      },
      users: {
        select: {
          id: true,
          // lastName: true,
          // firstName: true,
          // email: true,
          // role: true,
          aidantConnectAuthorisation: true,
          status: true
        },
        orderBy: {
          created: 'desc'
        }
      }
    }
  })

  const socialSupportSubjects = await SocialSupportSubjectRepo.findMany(user, {
    where: {
      ownedByStructureId: input.id,
      inactive: false
    },
    orderBy: {
      name: 'asc'
    }
  })

  return {
    structure,
    users,
    socialSupportSubjects
  }
}

export const getStructure = createQuery({
  adminHandler,
  inputValidation: idSchema,
  securityCheck: AllowSecurityCheck
})
