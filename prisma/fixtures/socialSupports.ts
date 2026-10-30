import type { Prisma } from '@prisma/client'
import {
  AskedHousing,
  FileInstructionType,
  HousingReason,
  HousingRoomCount,
  HousingType,
  LowIncomeHousingType
} from '@prisma/client'
import {
  fixtureStructures,
  fixturesBeneficiaries,
  FixtureBeneficiary,
  fixturesSocialSupportSubjects,
  fixturesUsers,
  FixtureUserRole,
  fixturesPartnerOrganizations,
  FixturePartnerOrganization,
  fixturesPartnerOrganizationContacts,
  fixturesNotifications,
  FixtureNotification
} from '../fixtures'

export enum FixtureSocialSupport {
  FollowupTearlePlannedInPerson = 0,
  FollowupTearlePhoneCall = 1,
  FollowupCoursorVideoconference = 2,
  FollowupPensonUnplannedInPerson = 3,
  FollowupCoursorInProgress = 4,
  FollowupUnknownWithComment = 5,
  HelpRequestTearleOther = 6,
  HelpRequestCoursorOtherInvestigation = 7,
  HelpRequestUnknownFinancial = 8,
  HelpRequestUnknownFinancialExternal = 9,
  HelpRequestUnknownFinancialExternalPrescribing = 10,
  HelpRequestPenberthyFinancialInvestigation = 11,
  HousingTearleAccepted = 12,
  HousingCoursorInvestigation = 13,
  HousingUnknownWithAskedHousing = 14,
  HousingUnknownExternal = 15,
  HousingUnknownExternalPrescribing = 16,
  HousingPenberthyFirstRequest = 17
}

export const fixtureCommentId = '24d14db7-c0ac-4924-86ae-c786efba3afc'

export const fixturesRedirectionReasons = [
  {
    id: 'a1f3e2d4-0b5c-4a7e-9f8d-1c2b3a4e5f60',
    name: 'Hors compétence',
    structureId: fixtureStructures[0].id,
    createdById: fixturesUsers[FixtureUserRole.SocialWorker].id
  },
  {
    id: 'b2e4f3c5-1c6d-4b8f-a09e-2d3c4b5f6a71',
    name: 'Besoin d’un suivi spécialisé',
    structureId: fixtureStructures[0].id,
    createdById: fixturesUsers[FixtureUserRole.SocialWorker].id
  },
  {
    id: 'c3d5a4b6-2d7e-4c9a-b10f-3e4d5c6a7b82',
    name: 'Demande du bénéficiaire',
    structureId: fixtureStructures[0].id,
    createdById: fixturesUsers[FixtureUserRole.SocialWorker].id
  },
  {
    id: 'd4c6b5a7-3e8f-4d0b-c21a-4f5e6d7b8c93',
    name: 'Délai de prise en charge trop long',
    structureId: fixtureStructures[0].id,
    createdById: fixturesUsers[FixtureUserRole.SocialWorker].id
  },
  {
    id: 'e5b7c6a8-4f9a-4e1c-d32b-5a6f7e8c9d04',
    name: 'Orientation vers le droit commun',
    structureId: fixtureStructures[0].id,
    createdById: fixturesUsers[FixtureUserRole.SocialWorker].id
  }
] satisfies Prisma.RedirectionReasonCreateManyInput[]

const fixturesFollowupSocialSupports = [
  {
    id: 'e20b26f8-52fd-4620-8959-4cbb4623fb05',
    createdById: fixturesUsers[FixtureUserRole.Referent].id,
    status: 'Done',
    structureId: fixtureStructures[0].id,
    beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.TEARLE].id,
    familyFileId: fixturesBeneficiaries[FixtureBeneficiary.TEARLE].id,
    subjects: {
      connect: [
        { id: fixturesSocialSupportSubjects[0].id },
        { id: fixturesSocialSupportSubjects[1].id }
      ]
    },
    date: new Date('2022-10-20'),
    socialSupportType: 'Followup',
    subtype: 'PlannedInPerson',
    followup: {
      create: {
        medium: 'PlannedInPerson'
      }
    },
    socialSupportRedirections: {
      create: [
        {
          type: 'PartnerOrganization',
          partnerOrganizationId:
            fixturesPartnerOrganizations[
              FixturePartnerOrganization.MairieValence
            ].id,
          redirectionReasonId: fixturesRedirectionReasons[0]!.id
        },
        {
          type: 'Intern',
          redirectionReasonId: fixturesRedirectionReasons[1]!.id
        }
      ]
    }
  },
  {
    id: '8f8a083f-f04f-4977-9e07-8b88135c7210',
    createdById: fixturesUsers[FixtureUserRole.Referent].id,
    status: 'Done',
    structureId: fixtureStructures[0].id,
    beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.TEARLE].id,
    familyFileId: fixturesBeneficiaries[FixtureBeneficiary.TEARLE].id,
    subjects: {
      connect: [{ id: fixturesSocialSupportSubjects[0].id }]
    },
    date: new Date('2022-10-21'),
    socialSupportType: 'Followup',
    subtype: 'PhoneCall',
    followup: {
      create: {
        medium: 'PhoneCall'
      }
    },
    socialSupportRedirections: {
      create: [
        {
          type: 'Other',
          redirectionReasonId: fixturesRedirectionReasons[2]!.id
        }
      ]
    }
  },
  {
    id: '07e809c3-4b6e-4152-bde3-357c501c981f',
    createdById: fixturesUsers[FixtureUserRole.Referent].id,
    status: 'Done',
    structureId: fixtureStructures[0].id,
    beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.COURSOR].id,
    familyFileId: fixturesBeneficiaries[FixtureBeneficiary.COURSOR].id,
    subjects: {
      connect: [
        { id: fixturesSocialSupportSubjects[2].id },
        { id: fixturesSocialSupportSubjects[1].id }
      ]
    },
    date: new Date('2022-10-22'),
    socialSupportType: 'Followup',
    subtype: 'Videoconference',
    followup: {
      create: {
        medium: 'Videoconference'
      }
    },
    socialSupportRedirections: {
      create: [
        {
          type: 'PartnerOrganization',
          partnerOrganizationId:
            fixturesPartnerOrganizations[
              FixturePartnerOrganization.FranceTravail
            ].id,
          redirectionReasonId: fixturesRedirectionReasons[0]!.id
        }
      ]
    }
  },
  {
    id: 'b811a9d7-ada7-42ca-b809-926caaebaf52',
    createdById: fixturesUsers[FixtureUserRole.Referent].id,
    status: 'Done',
    structureId: fixtureStructures[0].id,
    beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.PENSON].id,
    familyFileId: fixturesBeneficiaries[FixtureBeneficiary.PENSON].id,
    subjects: {
      connect: [{ id: fixturesSocialSupportSubjects[2].id }]
    },
    date: new Date('2022-10-23'),
    socialSupportType: 'Followup',
    subtype: 'UnplannedInPerson',
    followup: {
      create: {
        medium: 'UnplannedInPerson'
      }
    },
    socialSupportRedirections: {
      create: [
        {
          type: 'PartnerOrganization',
          partnerOrganizationId:
            fixturesPartnerOrganizations[FixturePartnerOrganization.CAF26].id,
          redirectionReasonId: fixturesRedirectionReasons[1]!.id
        }
      ]
    }
  },
  {
    id: 'b15eba7c-d00d-4de6-a227-75361066c322',
    createdById: fixturesUsers[FixtureUserRole.Referent].id,
    status: 'InProgress',
    structureId: fixtureStructures[0].id,
    beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.COURSOR].id,
    familyFileId: fixturesBeneficiaries[FixtureBeneficiary.COURSOR].id,
    subjects: {
      connect: [
        { id: fixturesSocialSupportSubjects[3].id },
        { id: fixturesSocialSupportSubjects[4].id }
      ]
    },
    date: new Date('2022-10-24'),
    socialSupportType: 'Followup',
    subtype: 'PlannedInPerson',
    followup: {
      create: {
        medium: 'PlannedInPerson'
      }
    }
  },
  {
    id: '19ed2ebb-4e28-433a-9e2d-d97d9098624a',
    createdById: fixturesUsers[FixtureUserRole.Referent].id,
    status: 'InProgress',
    structureId: fixtureStructures[0].id,
    beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.UNKNOWN].id,
    familyFileId: fixturesBeneficiaries[FixtureBeneficiary.UNKNOWN].id,
    subjects: {
      connect: [{ id: fixturesSocialSupportSubjects[4].id }]
    },
    date: new Date('2022-10-25'),
    comments: {
      create: {
        id: fixtureCommentId,
        createdById: fixturesUsers[FixtureUserRole.StructureManager].id,
        content:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur nisl erat, facilisis eget congue eget, fermentum vitae ante. Maecenas bibendum quis dui luctus molestie. Fusce sollicitudin dolor eget libero tempus semper. Praesent non urna libero. Vivamus vitae ex magna. Ut semper, sem vitae tincidunt finibus, nisl tortor blandit massa, vel rutrum est felis quis metus. In hac habitasse platea dictumst. Ut eget sapien sodales, varius lorem ut, posuere est. Quisque fermentum, erat a luctus vehicula, lorem quam cursus lorem, sed mollis augue felis et urna.',
        notification: {
          create: fixturesNotifications[FixtureNotification.ReferentNewComment]
        }
      }
    },
    documents: {
      create: {
        key: '97042692-54df-42ce-b755-ac40aef20f88',
        mimeType: 'application/pdf',
        name: 'Agir-pour-lenvironnement-Rapport-nucleaire.pdf',
        filenameDisk: 'b3d7eb72-e957-4a18-a2ce-6ec75a2f19e8.pdf',
        filenameDownload: 'Agir-pour-lenvironnement-Rapport-nucleaire.pdf',
        type: 'Cerfa',
        size: 887560,
        tags: ['BudgetRessources'],
        confidential: false,
        migrated: true,
        encryptedDataKey: 'vault:v2:seeded-document-dek',
        beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.UNKNOWN].id,
        familyFileId: fixturesBeneficiaries[FixtureBeneficiary.UNKNOWN].id,
        createdById: fixturesUsers[FixtureUserRole.StructureManager].id,
        notifications: {
          create: {
            id: '907300c8-105d-421a-9ee5-a0599f0822e6',
            recipientId: fixturesUsers[FixtureUserRole.Instructor].id,
            beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.UNKNOWN].id,
            type: 'NewDocument',
            itemCreatedById: fixturesUsers[FixtureUserRole.StructureManager].id
          }
        }
      }
    },
    socialSupportType: 'Followup',
    subtype: 'PhoneCall',
    followup: {
      create: {
        medium: 'PhoneCall'
      }
    },
    socialSupportRedirections: {
      create: [
        {
          type: 'Intern',
          redirectionReasonId: fixturesRedirectionReasons[3]!.id
        }
      ]
    }
  }
] satisfies Prisma.SocialSupportUncheckedCreateInput[]

const fixturesHelpRequestSocialSupports = [
  {
    id: 'c95126c4-b0b5-4606-82ca-8d95c544fd35',
    createdById: fixturesUsers[FixtureUserRole.SocialWorker].id,
    status: 'Accepted',
    structureId: fixtureStructures[0].id,
    beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.TEARLE].id,
    familyFileId: fixturesBeneficiaries[FixtureBeneficiary.TEARLE].id,
    subjects: { connect: { id: fixturesSocialSupportSubjects[4].id } },
    socialSupportType: 'HelpRequest',
    date: new Date('2022-10-26'),
    fileInstruction: {
      create: {
        type: FileInstructionType.Other,
        externalStructure: false,
        helpRequest: {
          create: {
            financialSupport: false,
            subjectId: fixturesSocialSupportSubjects[4].id,
            prescribingOrganizationId:
              fixturesPartnerOrganizations[
                FixturePartnerOrganization.MairieValence
              ].id
          }
        }
      }
    },
    socialSupportRedirections: {
      create: [
        {
          type: 'PartnerOrganization',
          partnerOrganizationId:
            fixturesPartnerOrganizations[
              FixturePartnerOrganization.FranceTravail
            ].id,
          redirectionReasonId: fixturesRedirectionReasons[2]!.id
        }
      ]
    }
  },
  {
    id: '4aad5e90-7a9e-4aeb-90f1-1c986664f47f',
    createdById: fixturesUsers[FixtureUserRole.SocialWorker].id,
    status: 'InvestigationOngoing',
    structureId: fixtureStructures[0].id,
    beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.COURSOR].id,
    familyFileId: fixturesBeneficiaries[FixtureBeneficiary.COURSOR].id,
    subjects: { connect: { id: fixturesSocialSupportSubjects[3].id } },
    socialSupportType: 'HelpRequest',
    subtype: FileInstructionType.Other,
    date: new Date('2022-10-27'),
    fileInstruction: {
      create: {
        type: FileInstructionType.Other,
        externalStructure: false,
        helpRequest: {
          create: {
            financialSupport: false,
            subjectId: fixturesSocialSupportSubjects[3].id
          }
        }
      }
    },
    socialSupportRedirections: {
      create: [
        {
          type: 'Intern',
          redirectionReasonId: fixturesRedirectionReasons[3]!.id
        },
        {
          type: 'Other',
          redirectionReasonId: fixturesRedirectionReasons[4]!.id
        }
      ]
    }
  },
  {
    id: 'da9acc1f-4927-4794-be6a-12f3b02b5478',
    createdById: fixturesUsers[FixtureUserRole.SocialWorker].id,
    status: 'Accepted',
    structureId: fixtureStructures[0].id,
    beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.UNKNOWN].id,
    familyFileId: fixturesBeneficiaries[FixtureBeneficiary.UNKNOWN].id,
    subjects: { connect: { id: fixturesSocialSupportSubjects[4].id } },
    socialSupportType: 'HelpRequest',
    subtype: FileInstructionType.Financial,
    date: new Date('2022-10-18'),
    fileInstruction: {
      create: {
        type: FileInstructionType.Financial,
        externalStructure: false,
        helpRequest: {
          create: {
            financialSupport: true,
            subjectId: fixturesSocialSupportSubjects[4].id,
            askedAmount: 2000,
            allocatedAmount: 2000,
            prescribingOrganizationId:
              fixturesPartnerOrganizations[FixturePartnerOrganization.CAF26].id
          }
        }
      }
    },
    socialSupportRedirections: {
      create: [
        {
          type: 'PartnerOrganization',
          partnerOrganizationId:
            fixturesPartnerOrganizations[
              FixturePartnerOrganization.MairieValence
            ].id,
          redirectionReasonId: fixturesRedirectionReasons[0]!.id
        }
      ]
    }
  },
  {
    id: '047f05e4-2ce2-40c5-ab6e-b16fe7a55c24',
    createdById: fixturesUsers[FixtureUserRole.SocialWorker].id,
    status: 'Accepted',
    structureId: fixtureStructures[0].id,
    beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.UNKNOWN].id,
    familyFileId: fixturesBeneficiaries[FixtureBeneficiary.UNKNOWN].id,
    subjects: { connect: { id: fixturesSocialSupportSubjects[4].id } },
    socialSupportType: 'HelpRequest',
    subtype: FileInstructionType.Financial,
    date: new Date('2022-11-03'),
    fileInstruction: {
      create: {
        type: FileInstructionType.Financial,
        externalStructure: true,
        instructorOrganizationId:
          fixturesPartnerOrganizationContacts[0].partnerId,
        instructorOrganizationContactId:
          fixturesPartnerOrganizationContacts[0].id,
        dispatchDate: new Date('2022-11-03'),
        helpRequest: {
          create: {
            financialSupport: true,
            subjectId: fixturesSocialSupportSubjects[4].id,
            askedAmount: 1000,
            allocatedAmount: 1000,
            isRefundable: true
          }
        }
      }
    }
  },
  {
    id: '8cc71beb-6c55-4ec4-85bd-80a93cd0e553',
    createdById: fixturesUsers[FixtureUserRole.SocialWorker].id,
    status: 'Accepted',
    structureId: fixtureStructures[0].id,
    beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.UNKNOWN].id,
    familyFileId: fixturesBeneficiaries[FixtureBeneficiary.UNKNOWN].id,
    subjects: { connect: { id: fixturesSocialSupportSubjects[4].id } },
    socialSupportType: 'HelpRequest',
    subtype: FileInstructionType.Financial,
    date: new Date('2022-12-09'),
    fileInstruction: {
      create: {
        type: FileInstructionType.Financial,
        externalStructure: true,
        instructorOrganizationId:
          fixturesPartnerOrganizationContacts[0].partnerId,
        instructorOrganizationContactId:
          fixturesPartnerOrganizationContacts[0].id,
        dispatchDate: new Date('2022-12-21'),
        helpRequest: {
          create: {
            financialSupport: true,
            subjectId: fixturesSocialSupportSubjects[4].id,
            askedAmount: 5000,
            allocatedAmount: 5000,
            isRefundable: true,
            prescribingOrganizationId:
              fixturesPartnerOrganizations[
                FixturePartnerOrganization.MairieValence
              ].id
          }
        }
      }
    }
  },
  {
    id: '8f6da38f-82ff-4121-ae77-45fc707a1acc',
    createdById: fixturesUsers[FixtureUserRole.SocialWorker].id,
    status: 'InvestigationOngoing',
    structureId: fixtureStructures[0].id,
    beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.PENBERTHY].id,
    familyFileId: fixturesBeneficiaries[FixtureBeneficiary.PENBERTHY].id,
    subjects: { connect: { id: fixturesSocialSupportSubjects[3].id } },
    socialSupportType: 'HelpRequest',
    subtype: FileInstructionType.Financial,
    date: new Date('2023-10-19'),
    fileInstruction: {
      create: {
        type: FileInstructionType.Financial,
        externalStructure: true,
        dispatchDate: new Date('2022-10-19'),
        helpRequest: {
          create: {
            financialSupport: true,
            subjectId: fixturesSocialSupportSubjects[3].id,
            askedAmount: 1500
          }
        }
      }
    }
  }
] satisfies Prisma.SocialSupportUncheckedCreateInput[]

const fixturesHousingHelpRequestSocialSupports = [
  {
    id: '100d98a0-13e8-4dda-a74c-5cb1aed6a90c',
    createdById: fixturesUsers[FixtureUserRole.SocialWorker].id,
    status: 'Accepted',
    structureId: fixtureStructures[0].id,
    beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.TEARLE].id,
    familyFileId: fixturesBeneficiaries[FixtureBeneficiary.TEARLE].id,
    subjects: { connect: { id: fixturesSocialSupportSubjects[4].id } },
    socialSupportType: 'HelpRequestHousing',
    subtype: FileInstructionType.Housing,
    date: new Date('2024-10-26'),
    fileInstruction: {
      create: {
        type: FileInstructionType.Housing,
        externalStructure: false,
        housingHelpRequest: {
          create: {
            isFirst: false,
            prescribingOrganizationId:
              fixturesPartnerOrganizations[
                FixturePartnerOrganization.MairieValence
              ].id
          }
        }
      }
    },
    socialSupportRedirections: {
      create: [
        {
          type: 'Other',
          redirectionReasonId: fixturesRedirectionReasons[4]!.id
        }
      ]
    }
  },
  {
    id: '95aba2b3-89ed-427c-bda6-09aa3e433e37',
    createdById: fixturesUsers[FixtureUserRole.SocialWorker].id,
    status: 'InvestigationOngoing',
    structureId: fixtureStructures[0].id,
    beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.COURSOR].id,
    familyFileId: fixturesBeneficiaries[FixtureBeneficiary.COURSOR].id,
    socialSupportType: 'HelpRequestHousing',
    subtype: FileInstructionType.Housing,
    date: new Date('2022-10-27'),
    fileInstruction: {
      create: {
        type: FileInstructionType.Housing,
        externalStructure: false,
        housingHelpRequest: {
          create: {
            maxRent: 2000,
            roomCount: [HousingRoomCount.One, HousingRoomCount.Two],
            isPmr: true
          }
        }
      }
    }
  },
  {
    id: '5055463d-f754-4a7e-90f4-263bc5972b31',
    createdById: fixturesUsers[FixtureUserRole.SocialWorker].id,
    status: 'Accepted',
    structureId: fixtureStructures[0].id,
    beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.UNKNOWN].id,
    familyFileId: fixturesBeneficiaries[FixtureBeneficiary.UNKNOWN].id,
    subjects: { connect: { id: fixturesSocialSupportSubjects[4].id } },
    socialSupportType: 'HelpRequestHousing',
    subtype: FileInstructionType.Housing,
    date: new Date('2024-10-18'),
    fileInstruction: {
      create: {
        type: FileInstructionType.Housing,
        externalStructure: false,
        housingHelpRequest: {
          create: {
            askedHousing: [AskedHousing.ParcPrive, AskedHousing.ParcSocial],
            housingType: [HousingType.Appartement],
            maxRent: 300,
            prescribingOrganizationId:
              fixturesPartnerOrganizations[FixturePartnerOrganization.CAF26].id
          }
        }
      }
    }
  },
  {
    id: '98942a89-fb50-4576-a304-ccae2f80c9bb',
    createdById: fixturesUsers[FixtureUserRole.SocialWorker].id,
    status: 'Accepted',
    structureId: fixtureStructures[0].id,
    beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.UNKNOWN].id,
    familyFileId: fixturesBeneficiaries[FixtureBeneficiary.UNKNOWN].id,
    subjects: { connect: { id: fixturesSocialSupportSubjects[4].id } },
    socialSupportType: 'HelpRequestHousing',
    subtype: FileInstructionType.Housing,
    date: new Date('2024-11-03'),
    fileInstruction: {
      create: {
        type: FileInstructionType.Housing,
        externalStructure: true,
        instructorOrganizationId:
          fixturesPartnerOrganizationContacts[0].partnerId,
        instructorOrganizationContactId:
          fixturesPartnerOrganizationContacts[0].id,
        dispatchDate: new Date('2024-11-03'),
        housingHelpRequest: {
          create: {
            maxRent: 1000,
            reason: HousingReason.DivorceSeparation,
            lowIncomeHousingType: [LowIncomeHousingType.PLAI]
          }
        }
      }
    }
  },
  {
    id: 'e8abf78a-c0d5-4aa0-a52c-11e27b86e741',
    createdById: fixturesUsers[FixtureUserRole.SocialWorker].id,
    status: 'Accepted',
    structureId: fixtureStructures[0].id,
    beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.UNKNOWN].id,
    familyFileId: fixturesBeneficiaries[FixtureBeneficiary.UNKNOWN].id,
    subjects: { connect: { id: fixturesSocialSupportSubjects[4].id } },
    socialSupportType: 'HelpRequestHousing',
    subtype: FileInstructionType.Housing,
    date: new Date('2024-12-09'),
    fileInstruction: {
      create: {
        type: FileInstructionType.Housing,
        externalStructure: true,
        instructorOrganizationId:
          fixturesPartnerOrganizationContacts[0].partnerId,
        instructorOrganizationContactId:
          fixturesPartnerOrganizationContacts[0].id,
        dispatchDate: new Date('2024-12-21'),
        housingHelpRequest: {
          create: {
            maxCharges: 100,
            maxRent: 500,
            prescribingOrganizationId:
              fixturesPartnerOrganizations[
                FixturePartnerOrganization.MairieValence
              ].id
          }
        }
      }
    }
  },
  {
    id: '2eb3857a-11ac-461b-b351-9041e2e22192',
    createdById: fixturesUsers[FixtureUserRole.SocialWorker].id,
    status: 'InvestigationOngoing',
    structureId: fixtureStructures[0].id,
    beneficiaryId: fixturesBeneficiaries[FixtureBeneficiary.PENBERTHY].id,
    familyFileId: fixturesBeneficiaries[FixtureBeneficiary.PENBERTHY].id,
    subjects: { connect: { id: fixturesSocialSupportSubjects[3].id } },
    socialSupportType: 'HelpRequestHousing',
    subtype: FileInstructionType.Housing,
    date: new Date('2024-10-19'),
    fileInstruction: {
      create: {
        type: FileInstructionType.Housing,
        externalStructure: true,
        dispatchDate: new Date('2024-10-19'),
        housingHelpRequest: {
          create: {
            maxRent: 1000,
            isFirst: true
          }
        }
      }
    }
  }
] satisfies Prisma.SocialSupportUncheckedCreateInput[]

export const fixturesSocialSupports = [
  ...fixturesFollowupSocialSupports,
  ...fixturesHelpRequestSocialSupports,
  ...fixturesHousingHelpRequestSocialSupports
]
