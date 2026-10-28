import type { Prisma } from '@prisma/client'
import { FileInstructionType } from '@prisma/client'
import {
  fixtureStructures,
  FixtureStructure,
  fixturesBeneficiaries,
  FixtureBeneficiary,
  fixturesSocialSupportSubjects,
  fixturesUsers,
  FixtureUserRole,
  fixturesPartnerOrganizations,
  FixturePartnerOrganization,
  fixturesRedirectionReasons
} from './fixtures'
import { prismaClient } from '~~/server/prisma'

const STRUCTURE_ID = fixtureStructures[FixtureStructure.Test].id
const CREATOR_ID = fixturesUsers[FixtureUserRole.SocialWorker].id
const SUBJECT_ID = fixturesSocialSupportSubjects[4].id

const CAF26_ID =
  fixturesPartnerOrganizations[FixturePartnerOrganization.CAF26].id
const FRANCE_TRAVAIL_ID =
  fixturesPartnerOrganizations[FixturePartnerOrganization.FranceTravail].id
const MAIRIE_VALENCE_ID =
  fixturesPartnerOrganizations[FixturePartnerOrganization.MairieValence].id

const RR0 = fixturesRedirectionReasons[0]!.id // Hors compétence
const RR1 = fixturesRedirectionReasons[1]!.id // Besoin d’un suivi spécialisé
const RR2 = fixturesRedirectionReasons[2]!.id // Demande du bénéficiaire
const RR3 = fixturesRedirectionReasons[3]!.id // Délai de prise en charge trop long
const RR4 = fixturesRedirectionReasons[4]!.id // Orientation vers le droit commun

function ben(key: FixtureBeneficiary) {
  return {
    beneficiaryId: fixturesBeneficiaries[key].id,
    familyFileId: fixturesBeneficiaries[key].familyFileId
  }
}

const socialSupports: (Prisma.SocialSupportUncheckedCreateInput & {
  id: string
})[] = [
  // === FOLLOWUP (7) ===
  {
    id: '1a000001-0000-4000-8000-000000000001',
    ...ben(FixtureBeneficiary.TEARLE),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'Done',
    date: new Date('2025-01-10'),
    socialSupportType: 'Followup',
    subtype: 'PlannedInPerson',
    subjects: { connect: [{ id: fixturesSocialSupportSubjects[0].id }] },
    followup: { create: { medium: 'PlannedInPerson' } },
    socialSupportRedirections: {
      create: [
        {
          type: 'PartnerOrganization',
          partnerOrganizationId: CAF26_ID,
          redirectionReasonId: RR0
        }
      ]
    }
  },
  {
    id: '1b000002-0000-4000-8000-000000000002',
    ...ben(FixtureBeneficiary.COURSOR),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'Done',
    date: new Date('2025-01-15'),
    socialSupportType: 'Followup',
    subtype: 'PhoneCall',
    subjects: { connect: [{ id: fixturesSocialSupportSubjects[1].id }] },
    followup: { create: { medium: 'PhoneCall' } },
    socialSupportRedirections: {
      create: [
        { type: 'Intern', redirectionReasonId: RR1 },
        { type: 'Other', redirectionReasonId: RR2 }
      ]
    }
  },
  {
    id: '1c000003-0000-4000-8000-000000000003',
    ...ben(FixtureBeneficiary.UNKNOWN),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'InProgress',
    date: new Date('2025-02-01'),
    socialSupportType: 'Followup',
    subtype: 'UnplannedInPerson',
    subjects: { connect: [{ id: fixturesSocialSupportSubjects[2].id }] },
    followup: { create: { medium: 'UnplannedInPerson' } },
    socialSupportRedirections: {
      create: [
        {
          type: 'PartnerOrganization',
          partnerOrganizationId: FRANCE_TRAVAIL_ID,
          redirectionReasonId: RR0
        },
        { type: 'Intern', redirectionReasonId: RR3 },
        { type: 'Other', redirectionReasonId: RR4 }
      ]
    }
  },
  {
    id: '1d000004-0000-4000-8000-000000000004',
    ...ben(FixtureBeneficiary.WONFAR),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'Done',
    date: new Date('2025-02-10'),
    socialSupportType: 'Followup',
    subtype: 'Videoconference',
    subjects: { connect: [{ id: fixturesSocialSupportSubjects[0].id }] },
    followup: { create: { medium: 'Videoconference' } },
    socialSupportRedirections: {
      create: [
        {
          type: 'PartnerOrganization',
          partnerOrganizationId: MAIRIE_VALENCE_ID,
          redirectionReasonId: RR1
        }
      ]
    }
  },
  {
    id: '1e000005-0000-4000-8000-000000000005',
    ...ben(FixtureBeneficiary.PISCOPO),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'Done',
    date: new Date('2025-02-20'),
    socialSupportType: 'Followup',
    subtype: 'PhoneCall',
    subjects: { connect: [{ id: fixturesSocialSupportSubjects[3].id }] },
    followup: { create: { medium: 'PhoneCall' } },
    socialSupportRedirections: {
      create: [
        { type: 'Intern', redirectionReasonId: RR2 },
        {
          type: 'PartnerOrganization',
          partnerOrganizationId: CAF26_ID,
          redirectionReasonId: RR0
        }
      ]
    }
  },
  {
    id: '1f000006-0000-4000-8000-000000000006',
    ...ben(FixtureBeneficiary.APFELMANN),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'InProgress',
    date: new Date('2025-03-05'),
    socialSupportType: 'Followup',
    subtype: 'Email',
    subjects: { connect: [{ id: fixturesSocialSupportSubjects[4].id }] },
    followup: { create: { medium: 'Email' } },
    socialSupportRedirections: {
      create: [{ type: 'Other', redirectionReasonId: RR3 }]
    }
  },
  {
    id: '1a000007-0000-4000-8000-000000000007',
    ...ben(FixtureBeneficiary.BREITLING),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'Done',
    date: new Date('2025-03-15'),
    socialSupportType: 'Followup',
    subtype: 'PlannedInPerson',
    subjects: { connect: [{ id: fixturesSocialSupportSubjects[1].id }] },
    followup: { create: { medium: 'PlannedInPerson' } },
    socialSupportRedirections: {
      create: [
        { type: 'Intern', redirectionReasonId: RR4 },
        { type: 'Other', redirectionReasonId: RR1 },
        {
          type: 'PartnerOrganization',
          partnerOrganizationId: FRANCE_TRAVAIL_ID,
          redirectionReasonId: RR3
        }
      ]
    }
  },

  // === HELPREQUEST (7) ===
  {
    id: '2a000001-0000-4000-8000-000000000001',
    ...ben(FixtureBeneficiary.TEARLE),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'Accepted',
    date: new Date('2025-01-20'),
    socialSupportType: 'HelpRequest',
    subtype: FileInstructionType.Financial,
    subjects: { connect: [{ id: SUBJECT_ID }] },
    fileInstruction: {
      create: {
        type: FileInstructionType.Financial,
        externalStructure: false,
        helpRequest: {
          create: {
            financialSupport: true,
            subjectId: SUBJECT_ID,
            askedAmount: 500
          }
        }
      }
    },
    socialSupportRedirections: {
      create: [
        { type: 'Intern', redirectionReasonId: RR0 },
        {
          type: 'PartnerOrganization',
          partnerOrganizationId: FRANCE_TRAVAIL_ID,
          redirectionReasonId: RR2
        }
      ]
    }
  },
  {
    id: '2b000002-0000-4000-8000-000000000002',
    ...ben(FixtureBeneficiary.COURSOR),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'InvestigationOngoing',
    date: new Date('2025-01-25'),
    socialSupportType: 'HelpRequest',
    subtype: FileInstructionType.Other,
    subjects: { connect: [{ id: SUBJECT_ID }] },
    fileInstruction: {
      create: {
        type: FileInstructionType.Other,
        externalStructure: false,
        helpRequest: {
          create: { financialSupport: false, subjectId: SUBJECT_ID }
        }
      }
    },
    socialSupportRedirections: {
      create: [{ type: 'Other', redirectionReasonId: RR3 }]
    }
  },
  {
    id: '2c000003-0000-4000-8000-000000000003',
    ...ben(FixtureBeneficiary.UNKNOWN),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'Accepted',
    date: new Date('2025-02-05'),
    socialSupportType: 'HelpRequest',
    subtype: FileInstructionType.Financial,
    subjects: { connect: [{ id: SUBJECT_ID }] },
    fileInstruction: {
      create: {
        type: FileInstructionType.Financial,
        externalStructure: false,
        helpRequest: {
          create: {
            financialSupport: true,
            subjectId: SUBJECT_ID,
            askedAmount: 1200,
            allocatedAmount: 1200
          }
        }
      }
    },
    socialSupportRedirections: {
      create: [
        {
          type: 'PartnerOrganization',
          partnerOrganizationId: CAF26_ID,
          redirectionReasonId: RR1
        },
        { type: 'Intern', redirectionReasonId: RR4 },
        { type: 'Other', redirectionReasonId: RR0 }
      ]
    }
  },
  {
    id: '2d000004-0000-4000-8000-000000000004',
    ...ben(FixtureBeneficiary.HEINIG),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'InvestigationOngoing',
    date: new Date('2025-02-15'),
    socialSupportType: 'HelpRequest',
    subtype: FileInstructionType.Financial,
    subjects: { connect: [{ id: SUBJECT_ID }] },
    fileInstruction: {
      create: {
        type: FileInstructionType.Financial,
        externalStructure: true,
        helpRequest: {
          create: {
            financialSupport: true,
            subjectId: SUBJECT_ID,
            askedAmount: 800
          }
        }
      }
    },
    socialSupportRedirections: {
      create: [{ type: 'Intern', redirectionReasonId: RR2 }]
    }
  },
  {
    id: '2e000005-0000-4000-8000-000000000005',
    ...ben(FixtureBeneficiary.PENBERTHY),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'Accepted',
    date: new Date('2025-02-25'),
    socialSupportType: 'HelpRequest',
    subtype: FileInstructionType.Other,
    subjects: { connect: [{ id: SUBJECT_ID }] },
    fileInstruction: {
      create: {
        type: FileInstructionType.Other,
        externalStructure: false,
        helpRequest: {
          create: { financialSupport: false, subjectId: SUBJECT_ID }
        }
      }
    },
    socialSupportRedirections: {
      create: [
        {
          type: 'PartnerOrganization',
          partnerOrganizationId: MAIRIE_VALENCE_ID,
          redirectionReasonId: RR1
        },
        { type: 'Other', redirectionReasonId: RR4 }
      ]
    }
  },
  {
    id: '2f000006-0000-4000-8000-000000000006',
    ...ben(FixtureBeneficiary.DOWNER),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'Done',
    date: new Date('2025-03-08'),
    socialSupportType: 'HelpRequest',
    subtype: FileInstructionType.Financial,
    subjects: { connect: [{ id: SUBJECT_ID }] },
    fileInstruction: {
      create: {
        type: FileInstructionType.Financial,
        externalStructure: false,
        helpRequest: {
          create: {
            financialSupport: true,
            subjectId: SUBJECT_ID,
            askedAmount: 300,
            allocatedAmount: 300
          }
        }
      }
    },
    socialSupportRedirections: {
      create: [{ type: 'Intern', redirectionReasonId: RR0 }]
    }
  },
  {
    id: '2a000007-0000-4000-8000-000000000007',
    ...ben(FixtureBeneficiary.TESSON),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'InvestigationOngoing',
    date: new Date('2025-03-20'),
    socialSupportType: 'HelpRequest',
    subtype: FileInstructionType.Financial,
    subjects: { connect: [{ id: SUBJECT_ID }] },
    fileInstruction: {
      create: {
        type: FileInstructionType.Financial,
        externalStructure: false,
        helpRequest: {
          create: {
            financialSupport: true,
            subjectId: SUBJECT_ID,
            askedAmount: 1500
          }
        }
      }
    },
    socialSupportRedirections: {
      create: [
        {
          type: 'PartnerOrganization',
          partnerOrganizationId: FRANCE_TRAVAIL_ID,
          redirectionReasonId: RR2
        },
        { type: 'Intern', redirectionReasonId: RR3 },
        { type: 'Other', redirectionReasonId: RR4 }
      ]
    }
  },

  // === HOUSINGHELPREQUEST (6) ===
  {
    id: '3a000001-0000-4000-8000-000000000001',
    ...ben(FixtureBeneficiary.TEARLE),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'Accepted',
    date: new Date('2025-01-30'),
    socialSupportType: 'HelpRequestHousing',
    subtype: FileInstructionType.Housing,
    subjects: { connect: [{ id: SUBJECT_ID }] },
    fileInstruction: {
      create: {
        type: FileInstructionType.Housing,
        externalStructure: false,
        housingHelpRequest: { create: { isFirst: true, maxRent: 700 } }
      }
    },
    socialSupportRedirections: {
      create: [{ type: 'Other', redirectionReasonId: RR4 }]
    }
  },
  {
    id: '3b000002-0000-4000-8000-000000000002',
    ...ben(FixtureBeneficiary.COURSOR),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'InvestigationOngoing',
    date: new Date('2025-02-08'),
    socialSupportType: 'HelpRequestHousing',
    subtype: FileInstructionType.Housing,
    fileInstruction: {
      create: {
        type: FileInstructionType.Housing,
        externalStructure: false,
        housingHelpRequest: { create: { maxRent: 900, isPmr: false } }
      }
    },
    socialSupportRedirections: {
      create: [
        { type: 'Intern', redirectionReasonId: RR0 },
        {
          type: 'PartnerOrganization',
          partnerOrganizationId: CAF26_ID,
          redirectionReasonId: RR1
        }
      ]
    }
  },
  {
    id: '3c000003-0000-4000-8000-000000000003',
    ...ben(FixtureBeneficiary.UNKNOWN),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'Accepted',
    date: new Date('2025-02-18'),
    socialSupportType: 'HelpRequestHousing',
    subtype: FileInstructionType.Housing,
    subjects: { connect: [{ id: fixturesSocialSupportSubjects[3].id }] },
    fileInstruction: {
      create: {
        type: FileInstructionType.Housing,
        externalStructure: false,
        housingHelpRequest: { create: { maxRent: 600, maxCharges: 80 } }
      }
    },
    socialSupportRedirections: {
      create: [
        {
          type: 'PartnerOrganization',
          partnerOrganizationId: MAIRIE_VALENCE_ID,
          redirectionReasonId: RR2
        },
        { type: 'Intern', redirectionReasonId: RR3 },
        { type: 'Other', redirectionReasonId: RR0 }
      ]
    }
  },
  {
    id: '3d000004-0000-4000-8000-000000000004',
    ...ben(FixtureBeneficiary.WONFAR),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'InvestigationOngoing',
    date: new Date('2025-03-01'),
    socialSupportType: 'HelpRequestHousing',
    subtype: FileInstructionType.Housing,
    subjects: { connect: [{ id: fixturesSocialSupportSubjects[2].id }] },
    fileInstruction: {
      create: {
        type: FileInstructionType.Housing,
        externalStructure: false,
        housingHelpRequest: { create: { isFirst: false } }
      }
    },
    socialSupportRedirections: {
      create: [
        { type: 'Other', redirectionReasonId: RR4 },
        { type: 'Intern', redirectionReasonId: RR2 }
      ]
    }
  },
  {
    id: '3e000005-0000-4000-8000-000000000005',
    ...ben(FixtureBeneficiary.PENBERTHY),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'Accepted',
    date: new Date('2025-03-12'),
    socialSupportType: 'HelpRequestHousing',
    subtype: FileInstructionType.Housing,
    subjects: { connect: [{ id: fixturesSocialSupportSubjects[1].id }] },
    fileInstruction: {
      create: {
        type: FileInstructionType.Housing,
        externalStructure: false,
        housingHelpRequest: { create: { maxRent: 500 } }
      }
    },
    socialSupportRedirections: {
      create: [
        {
          type: 'PartnerOrganization',
          partnerOrganizationId: FRANCE_TRAVAIL_ID,
          redirectionReasonId: RR1
        }
      ]
    }
  },
  {
    id: '3f000006-0000-4000-8000-000000000006',
    ...ben(FixtureBeneficiary.BREITLING),
    createdById: CREATOR_ID,
    structureId: STRUCTURE_ID,
    status: 'InvestigationOngoing',
    date: new Date('2025-03-25'),
    socialSupportType: 'HelpRequestHousing',
    subtype: FileInstructionType.Housing,
    subjects: { connect: [{ id: fixturesSocialSupportSubjects[0].id }] },
    fileInstruction: {
      create: {
        type: FileInstructionType.Housing,
        externalStructure: true,
        housingHelpRequest: { create: { maxRent: 800, maxCharges: 120 } }
      }
    },
    socialSupportRedirections: {
      create: [
        { type: 'Intern', redirectionReasonId: RR3 },
        { type: 'Other', redirectionReasonId: RR4 },
        {
          type: 'PartnerOrganization',
          partnerOrganizationId: CAF26_ID,
          redirectionReasonId: RR1
        }
      ]
    }
  }
]

async function main() {
  console.log('Creating 20 social supports with redirections...')

  for (const { id, ...data } of socialSupports) {
    await prismaClient.socialSupport.upsert({
      create: { id, ...data },
      where: { id },
      update: {}
    })
  }

  const redirectionCount = await prismaClient.socialSupportRedirection.count({
    where: { socialSupportId: { in: socialSupports.map(s => s.id) } }
  })

  console.log(
    `Done. 20 social supports (7 Followup, 7 HelpRequest, 6 HelpRequestHousing) with ${redirectionCount} redirections.`
  )
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prismaClient.$disconnect())
