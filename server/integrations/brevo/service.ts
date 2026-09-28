import { BeneficiaryRepo, StructureRepo, UserRepo } from '~~/server/database'
import { mapStructureToBrevoCompany, mapUserToBrevoContact } from './utils'
import {
  createCompany,
  createCompanyAttribute,
  createContactAttribute,
  createOrUpdateContact,
  getCompanyByStructureId,
  getContact,
  linkContactToCompany,
  sendEvent,
  updateCompany
} from './apiClient'
import { structureTypeKeys, userRoleKeys } from '~~/client/options'
import { prismaClient } from '~~/server/prisma'
import { UserRole, UserStatus } from '@prisma/client'

export async function createOrUpdateUser(userId: string) {
  return
  // if (process.env.NODE_ENV === 'test') {
  //   return
  // }
  // const [user, overseenBeneficiaryCount] = await Promise.all([
  //   UserRepo.prisma.findUniqueOrThrow({
  //     select: {
  //       id: true,
  //       email: true,
  //       firstName: true,
  //       lastName: true,
  //       role: true,
  //       created: true,
  //       firstAccess: true,
  //       lastAccess: true,
  //       status: true,
  //       structure: {
  //         select: {
  //           id: true,
  //           lastAccess: true,
  //           type: true,
  //           siret: true,
  //           name: true,
  //           _count: {
  //             select: {
  //               beneficiaries: true,
  //               socialSupports: true
  //             }
  //           }
  //         }
  //       },
  //       _count: {
  //         select: {
  //           createdSocialSupports: true
  //         }
  //       }
  //     },
  //     where: { id: userId }
  //   }),
  //   BeneficiaryRepo.prisma.count({
  //     where: {
  //       familyFile: {
  //         referents: { some: { id: userId } }
  //       }
  //     }
  //   })
  // ])
  // const contact = mapUserToBrevoContact({
  //   ...user,
  //   _count: { ...user._count, overseenBeneficiaries: overseenBeneficiaryCount }
  // })
  // await createOrUpdateContact(contact)
  // if (user.structure?.id) {
  //   // In the future, this shouldn't be necessary anymore,
  //   // as it's also done when the user is created, and users can't change
  //   // their structureId.
  //   // However, until all existing Brevo contacts have been associated with
  //   // their structure, this will auto-link the active ones.
  //   await linkUserToStructure({
  //     userId: user.id,
  //     structureId: user.structure.id
  //   })
  // }
}

export async function createOrUpdateStructure(structureId: string) {
  return
  if (process.env.NODE_ENV === 'test') {
    return
  }
  // const [structure, deactivatedUserCount, managerCount] = await Promise.all([
  //   StructureRepo.prisma.findUniqueOrThrow({
  //     select: {
  //       id: true,
  //       name: true,
  //       dpoEmail: true,
  //       dpoFirstName: true,
  //       dpoLastName: true,
  //       lastAccess: true,
  //       lastActivity: true,
  //       created: true,
  //       phone: true,
  //       email: true,
  //       type: true,
  //       _count: {
  //         select: {
  //           socialSupports: true,
  //           beneficiaries: true,
  //           users: true
  //         }
  //       }
  //     },
  //     where: { id: structureId }
  //   }),
  //   UserRepo.prisma.count({
  //     where: {
  //       structureId,
  //       status: 'Disabled'
  //     }
  //   }),
  //   UserRepo.prisma.count({
  //     where: {
  //       structureId,
  //       role: 'StructureManager'
  //     }
  //   })
  // ])

  // const company = mapStructureToBrevoCompany({
  //   ...structure,
  //   _count: {
  //     ...structure._count,
  //     managerUsers: managerCount,
  //     deactivatedUsers: deactivatedUserCount
  //   }
  // })
  // const result = await getCompanyByStructureId(structureId)
  // if (result) {
  //   await updateCompany(result.id, company)
  // } else {
  //   const { id } = await createCompany(structure)
  //   await updateCompany(id, company)
  // }
}

export async function sendStructureEvent({
  name,
  id
}: {
  name: string
  id: string
}) {
  const manager = await prismaClient.user.findFirstOrThrow({
    where: {
      role: UserRole.StructureManager,
      status: UserStatus.Active,
      structureId: id
    }
  })
  const company = await getCompanyByStructureId(id)
  await sendEvent({
    event_name: name,
    identifiers: {
      ext_id: manager.id
    },
    object: {
      type: 'company',
      identifiers: {
        id: company.id
      }
    }
  })
}

export async function createContactAttributes() {
  const attributes: Parameters<typeof createContactAttribute>[0][] = [
    { name: 'PRENOM', type: 'text' },
    { name: 'NOM', type: 'text' },
    { name: 'ROLE', type: 'category', options: userRoleKeys.keys },
    {
      name: 'TYPE_STRUCTURE',
      type: 'category',
      options: structureTypeKeys.keys
    },
    { name: 'SIRET_STRUCTURE', type: 'text' },
    { name: 'NOM_STRUCTURE', type: 'text' },
    { name: 'DERNIERE_CONNEXION_STRUCTURE', type: 'date' },
    { name: 'ACCES_MSS', type: 'boolean' },
    { name: 'STRUCTURE_AVEC_1_SUIVI', type: 'boolean' },
    { name: 'CREATION_DATE', type: 'date' },
    { name: 'PREMIERE_CONNEXION', type: 'date' },
    { name: 'DERNIERE_CONNEXION', type: 'date' },
    { name: 'UTILISATEUR_AVEC_1_SUIVI', type: 'boolean' },
    { name: 'NOMBRE_BENEFICIAIRES_UTILISATEUR', type: 'float' },
    { name: 'NOMBRE_SUIVIS_UTILISATEUR', type: 'float' },
    { name: 'NOMBRE_BENEFICIAIRES_STRUCTURE', type: 'float' },
    { name: 'NOMBRE_SUIVIS_STRUCTURE', type: 'float' }
  ]
  await Promise.all(attributes.map(createContactAttribute))
}

export async function createStructureAttributes() {
  // Be careful about the case with company attributes:
  // Brevo API seems to be case-sensitive when it wants to.
  // Uppercase attributes will appear in uppercase in the UI,
  // however in the API calls, they need to be lowercase ¯\_(ツ)_/¯.
  const attributes: Parameters<typeof createCompanyAttribute>[0][] = [
    { name: 'EXT_ID', type: 'text' },
    { name: 'PHONE', type: 'text' },
    { name: 'ACTION_30_DERNIERS_JOURS', type: 'boolean' },
    { name: 'ADRESSE_MAIL_STRUCTURE', type: 'text' },
    { name: 'CREATION_COMPTE', type: 'date' },
    { name: 'DERNIERE_CONNEXION', type: 'date' },
    { name: 'DPO_RENSEIGNE', type: 'boolean' },
    { name: 'NOMBRE_BENEFICIAIRES', type: 'number' },
    { name: 'NOMBRE_COMPTE_UTILISATEURS_DESACTIVES', type: 'number' },
    { name: 'NOMBRE_RESPO_STRUCTURE', type: 'number' },
    { name: 'NOMBRE_SUIVIS', type: 'number' },
    { name: 'PREMIERE_CONNEXION', type: 'date' },
    {
      name: 'TYPE_STRUCTURE',
      type: 'single-select',
      options: structureTypeKeys.keys
    }
  ]
  await Promise.all(attributes.map(createCompanyAttribute))
}

export async function linkUserToStructure({
  userId,
  structureId
}: {
  userId: string
  structureId: string
}) {
  // For now, only allow Brevo updates on the test structure
  const [{ id: contactId }, { id: companyId, linkedContactsIds }] =
    await Promise.all([
      getContact(userId),
      getCompanyByStructureId(structureId)
    ])
  if (linkedContactsIds.includes(contactId)) {
    return
  }
  await linkContactToCompany({ contactId, companyId })
}
