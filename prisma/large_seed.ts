// Seed of the cross-structure statistics review app (branch review/pilotage-territorial).
//
// Always run on a freshly reset database: the base seed (prisma/seed.ts: Jeanne
// Responsable, CGU version, education schools...) must run first, and a second
// run on the same database fails on the Cross-Structure Observer's fixed id.
// The defaults are the review app volumes, so no flag is needed.
//
// Run / reset (local)
//   pnpm prisma migrate reset --force       # migrations + base seed
//   pnpm tsx --tsconfig prisma/tsconfig.json prisma/large_seed.ts

import { parseArgs } from 'node:util'
import type {
  BeneficiaryMobility,
  BeneficiarySchoolClass,
  BeneficiaryStatus,
  FileInstructionType,
  FollowupMedium,
  Gender,
  SocialSupportRedirectionType,
  SocialSupportStatus,
  SocialSupportType,
  StructureType
} from '@prisma/client'
import { Prisma, SupportProgramOutcome } from '@prisma/client'
import { faker as baseFaker, fakerFR as faker } from '@faker-js/faker'
import { equiRandomEnum } from './fixtures/utils'
import { prismaClient } from '~~/server/prisma'
import { ID_CROSS_STRUCTURE_OBSERVER } from '~~/server/lib/crossStructureObserver'

// One structure per entry of structurePlan (15).
type Config = {
  // null => do not create users, link Jeanne Responsable to the first structure.
  usersPerStructure: number | null
  familyFilesPerStructure: number
  // null => do not create social supports.
  socialSupportsPerBeneficiary: number | null
  // null => do not create support programs. Otherwise each beneficiary gets a
  // random count in [0, supportProgramsPerBeneficiary].
  supportProgramsPerBeneficiary: number | null
  // Share of support programs linked to one or two partner organizations.
  supportProgramPartnerLinkRate: number
  // Share of lifecycle support programs that have ended (end date + outcome).
  supportProgramEndedRate: number
}

const DEFAULTS = {
  usersPerStructure: null,
  familyFilesPerStructure: 400,
  socialSupportsPerBeneficiary: 5,
  supportProgramsPerBeneficiary: 4,
  supportProgramPartnerLinkRate: 0.2,
  supportProgramEndedRate: 0.6
} satisfies Config

const ID_JEANNE_RESPONSABLE = '7e5c1734-35cb-4047-9035-a944961a67a4'

// Must match runtimeConfig.public.cguVersion in nuxt.config.ts
const CGU_VERSION = '1.2'

// Fixed faker seed: two runs on a reset DB produce the same data (dates stay
// relative to today).
const FAKER_SEED = 20261028

// Review app (Pilotage territorial): one fictional territory in Saône-et-Loire.
// qpv follows the commune.
const communes = [
  { city: 'Mâcon', zipcode: '71000', qpv: true },
  { city: 'Chalon-sur-Saône', zipcode: '71100', qpv: true },
  { city: 'Le Creusot', zipcode: '71200', qpv: true },
  { city: 'Montceau-les-Mines', zipcode: '71300', qpv: true },
  { city: 'Autun', zipcode: '71400', qpv: false },
  { city: 'Louhans', zipcode: '71500', qpv: false },
  { city: 'Paray-le-Monial', zipcode: '71600', qpv: false },
  { city: 'Digoin', zipcode: '71160', qpv: false },
  { city: 'Tournus', zipcode: '71700', qpv: false },
  { city: 'Charolles', zipcode: '71120', qpv: false },
  { city: 'Montchanin', zipcode: '71210', qpv: false },
  { city: 'Chagny', zipcode: '71150', qpv: false }
] as const

type Commune = (typeof communes)[number]

function commune(city: Commune['city']): Commune {
  return communes.find(c => c.city === city) as Commune
}

// 15 structures: 6 CCAS, 2 CIAS, 4 Communes, 3 PRE associations. PRE is not a
// StructureType: it is carried by the name and the data only.
const structurePlan: {
  type: StructureType
  name: string
  commune: Commune
  pre: boolean
}[] = [
  {
    type: 'Ccas',
    name: 'CCAS de Mâcon',
    commune: commune('Mâcon'),
    pre: false
  },
  {
    type: 'Ccas',
    name: 'CCAS de Chalon-sur-Saône',
    commune: commune('Chalon-sur-Saône'),
    pre: false
  },
  {
    type: 'Ccas',
    name: 'CCAS du Creusot',
    commune: commune('Le Creusot'),
    pre: false
  },
  {
    type: 'Ccas',
    name: 'CCAS de Montceau-les-Mines',
    commune: commune('Montceau-les-Mines'),
    pre: false
  },
  {
    type: 'Ccas',
    name: 'CCAS de Paray-le-Monial',
    commune: commune('Paray-le-Monial'),
    pre: false
  },
  {
    type: 'Ccas',
    name: 'CCAS de Digoin',
    commune: commune('Digoin'),
    pre: false
  },
  {
    type: 'Cias',
    name: 'CIAS de Louhans',
    commune: commune('Louhans'),
    pre: false
  },
  {
    type: 'Cias',
    name: 'CIAS de Charolles',
    commune: commune('Charolles'),
    pre: false
  },
  {
    type: 'Commune',
    name: 'Commune de Tournus',
    commune: commune('Tournus'),
    pre: false
  },
  {
    type: 'Commune',
    name: 'Commune de Montchanin',
    commune: commune('Montchanin'),
    pre: false
  },
  {
    type: 'Commune',
    name: 'Commune de Chagny',
    commune: commune('Chagny'),
    pre: false
  },
  {
    type: 'Commune',
    name: 'Commune d’Autun',
    commune: commune('Autun'),
    pre: false
  },
  {
    type: 'Association',
    name: 'Association PRE Mâcon',
    commune: commune('Mâcon'),
    pre: true
  },
  {
    type: 'Association',
    name: 'Association PRE Chalon-sur-Saône',
    commune: commune('Chalon-sur-Saône'),
    pre: true
  },
  {
    type: 'Association',
    name: 'Association PRE Le Creusot',
    commune: commune('Le Creusot'),
    pre: true
  }
]

// Catalogs: identical names across structures so the panel merges them by name.
// Each structure takes a random subset of about CATALOG_SUBSET_RATE.
const CATALOG_SUBSET_RATE = 0.7

const partnerOrganizationNames = [
  'CMP',
  'Centre social et socioculturel',
  'Education nationale',
  'CLAS',
  'CCAS',
  'MDS'
]

const socialSupportSubjectNames = [
  'médiation scolaire',
  'soutien administratif',
  'accès aux droits fondamentaux',
  'accompagnement vie quotidienne',
  'point famille',
  'passage en EPS'
]

// Every structure runs the Dispositif PRE (the only one with a lifecycle) and
// a subset of the Intervention Axes.
const preSupportProgramNameInput = {
  name: 'Dispositif PRE',
  hasLifecycle: true
}

const interventionAxisNameInputs = [
  { name: 'soutien à la parentalité', hasLifecycle: false },
  { name: 'accès aux soins', hasLifecycle: false },
  { name: 'accès aux loisirs', hasLifecycle: false }
]

const redirectionReasonNames = [
  'Hors compétence',
  'Besoin d’un suivi spécialisé',
  'Demande du bénéficiaire',
  'Délai de prise en charge trop long',
  'Orientation vers le droit commun'
]

function catalogSubset<T>(catalog: T[]): T[] {
  return faker.helpers.arrayElements(
    catalog,
    Math.round(catalog.length * CATALOG_SUBSET_RATE)
  )
}

// History spread over several years, including the current one.
const HISTORY_YEARS = 4
const historyStart = new Date(new Date().getFullYear() - HISTORY_YEARS, 0, 1)

function randomHistoryDate(): Date {
  return faker.date.between({ from: historyStart, to: new Date() })
}

// Share of minor beneficiaries: PRE associations follow mostly children.
const MINOR_RATE = { pre: 0.7, other: 0.15 }
// Share of followups flagged as first followup.
const FIRST_FOLLOWUP_RATE = 0.3

// School class by age (3..17).
const schoolClassesByAge: Record<number, BeneficiarySchoolClass[]> = {
  3: ['PetiteSection'],
  4: ['MoyenneSection'],
  5: ['GrandeSection'],
  6: ['CP'],
  7: ['CE1'],
  8: ['CE2'],
  9: ['CM1'],
  10: ['CM2'],
  11: ['Sixieme', 'SixiemeSegpa'],
  12: ['Cinquieme', 'CinquiemeSegpa'],
  13: ['Quatrieme', 'QuatriemeUlis'],
  14: ['Troisieme', 'TroisiemeSegpa'],
  15: ['SecondeGenerale', 'SecondePro'],
  16: ['PremiereGenerale', 'PremierePro'],
  17: ['TerminaleGenerale', 'TerminalePro']
}

function ageOf(birthDate: Date): number {
  const today = new Date()
  const age = today.getFullYear() - birthDate.getFullYear()
  const hadBirthday =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() >= birthDate.getDate())
  return hadBirthday ? age : age - 1
}

function randomBeneficiarySchooling(
  pre: boolean,
  repSchoolUais: string[]
): {
  birthDate: Date
  schoolClass?: BeneficiarySchoolClass
  schoolUai?: string
} {
  const minor = faker.datatype.boolean({
    probability: pre ? MINOR_RATE.pre : MINOR_RATE.other
  })
  if (!minor) {
    return {
      birthDate: faker.date.birthdate({ mode: 'age', min: 18, max: 85 })
    }
  }
  const birthDate = faker.date.birthdate({ mode: 'age', min: 3, max: 17 })
  const classes = schoolClassesByAge[ageOf(birthDate)]
  return {
    birthDate,
    schoolClass: classes ? faker.helpers.arrayElement(classes) : undefined,
    schoolUai: repSchoolUais.length
      ? faker.helpers.arrayElement(repSchoolUais)
      : undefined
  }
}

function randomStatus(): BeneficiaryStatus {
  return equiRandomEnum([
    'Archived',
    'Deceased',
    'Inactive',
    'Inactive',
    'Active'
  ])
}
function randomGender(): Gender {
  return equiRandomEnum(['Male', 'Female', 'Other'])
}
function randomMobility(): BeneficiaryMobility {
  return equiRandomEnum([
    'PermitWithVehicle',
    'PermitWithoutVehicle',
    'Code',
    'PermitPending',
    'OtherPermit',
    'PublicTransport',
    'BikeOrEquivalent',
    'InvalidPermit',
    'VehicleWithoutPermit',
    'None'
  ])
}
function randomSocialSupportType(): SocialSupportType {
  return equiRandomEnum(['Followup', 'HelpRequestHousing', 'HelpRequest'])
}
function randomMedium(): FollowupMedium {
  return equiRandomEnum([
    'PlannedInPerson',
    'UnplannedInPerson',
    'PhoneCall',
    'BeneficiaryHouseAppointment',
    'AdministrativeManagement',
    'ExternalAppointment',
    'PostalMail',
    'Email',
    'Videoconference',
    'ThirdParty',
    'Sms'
  ])
}
function randomFollowupStatus(): SocialSupportStatus {
  return equiRandomEnum(['Todo', 'InProgress', 'Done'])
}
function randomHelpRequestStatus(): SocialSupportStatus {
  return equiRandomEnum([
    'WaitingAdditionalInformation',
    'InvestigationOngoing',
    'Accepted',
    'Refused',
    'Adjourned',
    'ClosedByBeneficiary',
    'ClosedByAgent',
    'Dismissed'
  ])
}
function randomFileInstructionType(): FileInstructionType {
  return equiRandomEnum(['Financial', 'Housing', 'Other'])
}
function randomRedirection(): SocialSupportRedirectionType {
  return equiRandomEnum(['PartnerOrganization', 'Intern', 'Other'])
}

function randomSupportProgramOutcome(): SupportProgramOutcome {
  return equiRandomEnum(Object.values(SupportProgramOutcome))
}

const supportProgramExitReasonNames = [
  'Fin de prise en charge',
  'Déménagement',
  'Abandon',
  'Objectifs atteints',
  'Réorientation'
]

function randomSupportProgramLifecycle(
  hasLifecycle: boolean,
  endedRate: number,
  exitReasonIds: string[]
): {
  startDate: Date | null
  endDate: Date | null
  outcome: SupportProgramOutcome | null
  exitReasonId: string | null
} {
  if (!hasLifecycle) {
    return { startDate: null, endDate: null, outcome: null, exitReasonId: null }
  }
  const startDate = randomHistoryDate()
  if (!faker.datatype.boolean({ probability: endedRate })) {
    return { startDate, endDate: null, outcome: null, exitReasonId: null }
  }
  return {
    startDate,
    endDate: faker.date.between({ from: startDate, to: new Date() }),
    outcome: randomSupportProgramOutcome(),
    exitReasonId: faker.helpers.arrayElement(exitReasonIds)
  }
}

async function main(config: Config) {
  faker.seed(FAKER_SEED)
  // equiRandomEnum draws from the base faker instance
  baseFaker.seed(FAKER_SEED)

  console.log('Creating the Cross-Structure Observer...')
  await prismaClient.user.create({
    data: {
      id: ID_CROSS_STRUCTURE_OBSERVER,
      firstName: 'Responsable',
      lastName: 'Pilotage territorial',
      email: 'pilotage-territorial@monsuivisocial.local',
      // Meaningless: the persona has no structure, crossStructureProcedure
      // rewrites its ctx role.
      role: 'SocialWorker',
      status: 'Active',
      structureId: null,
      CGUHistory: { create: { version: CGU_VERSION } }
    }
  })

  // Schools from the base seed with a REP classification.
  const repSchoolUais = (
    await prismaClient.dataEducationSchool.findMany({
      select: { uai: true },
      where: { repClassification: { not: null } },
      orderBy: { uai: 'asc' }
    })
  ).map(school => school.uai)

  for (const [i, plan] of structurePlan.entries()) {
    console.log('starting seed', `${i}/${structurePlan.length}`)
    const structure = await prismaClient.structure.create({
      select: {
        id: true,
        socialSupportSubjects: { select: { id: true, name: true } }
      },
      data: {
        type: plan.type,
        name: plan.name,
        zipcode: plan.commune.zipcode,
        siret: '12345678901234',
        city: plan.commune.city,
        address: faker.location.streetAddress(),
        phone: faker.phone.number(),
        email: faker.internet.email(),
        socialSupportSubjects: {
          createMany: {
            data: catalogSubset(socialSupportSubjectNames).map(name => ({
              name,
              used: true
            }))
          }
        }
      }
    })
    const subjectIds = structure.socialSupportSubjects.map(s => s.id)

    const partners = await prismaClient.partnerOrganization.createManyAndReturn(
      {
        select: { id: true },
        data: catalogSubset(partnerOrganizationNames).map(name => ({
          structureId: structure.id,
          name
        }))
      }
    )

    const redirectionReasons =
      await prismaClient.redirectionReason.createManyAndReturn({
        select: { id: true },
        data: redirectionReasonNames.map(name => ({
          name,
          structureId: structure.id,
          createdById: ID_JEANNE_RESPONSABLE
        }))
      })

    let users: { id: string }[] = []

    if (config.usersPerStructure === null) {
      if (i === 0) {
        console.log('Linking Jeanne Responsable to a structure...')
        await prismaClient.user.update({
          data: { structureId: structure.id },
          where: { id: ID_JEANNE_RESPONSABLE }
        })
      }
    } else {
      const data = new Array(config.usersPerStructure).fill(null).map(() => {
        const firstName = faker.person.firstName()
        const lastName = faker.person.lastName()
        const email = `${faker.string.ulid()}${faker.internet.email({
          firstName,
          lastName,
          allowSpecialCharacters: true
        })}`
        return {
          structureId: structure.id,
          firstName,
          lastName,
          email,
          role: 'Referent' as const,
          status: 'Active' as const,
          lastAccess: randomHistoryDate()
        } satisfies Prisma.UserCreateManyInput
      })

      users = await prismaClient.user.createManyAndReturn({
        select: { id: true },
        data
      })
    }

    const families = await prismaClient.familyFile.createManyAndReturn({
      data: new Array(config.familyFilesPerStructure).fill(null).map(() => ({
        structureId: structure.id
      }))
    })

    const [_, beneficiaries, __] = await Promise.all([
      prismaClient.budget.createMany({
        data: families.map(({ id }) => ({
          familyFileId: id
        }))
      }),
      prismaClient.beneficiary.createManyAndReturn({
        select: { id: true, familyFileId: true },
        data: families.map(({ id }) => {
          // Most beneficiaries live in the structure's commune
          const beneficiaryCommune = faker.datatype.boolean({
            probability: 0.6
          })
            ? plan.commune
            : faker.helpers.arrayElement(communes)
          return {
            firstName: faker.person.firstName(),
            birthName: faker.person.lastName(),
            usualName: faker.person.lastName(),
            ...randomBeneficiarySchooling(plan.pre, repSchoolUais),
            gender: randomGender(),
            structureId: structure.id,
            fileNumber: faker.string.ulid(),
            status: randomStatus(),
            familyFileId: id,
            zipcode: beneficiaryCommune.zipcode,
            city: beneficiaryCommune.city,
            qpv: beneficiaryCommune.qpv,
            street: faker.location.streetAddress(),
            region: 'Bourgogne-Franche-Comté',
            phone1: faker.phone.number(),
            email: faker.internet.email(),
            mobility: randomMobility()
          }
        })
      }),
      prismaClient.user.update({
        where: { id: users[0]?.id || ID_JEANNE_RESPONSABLE },
        data: {
          referentFor: { connect: families }
        }
      })
    ])

    if (config.socialSupportsPerBeneficiary !== null) {
      // Ids are set here so each support keeps track of its random subjects
      const supportSubjectIds = new Map<string, string[]>()

      // data contains familyFilesPerStructure * socialSupportsPerBeneficiary items
      const data: Prisma.SocialSupportCreateManyInput[] = beneficiaries.flatMap(
        beneficiary =>
          new Array(config.socialSupportsPerBeneficiary).fill(null).map(() => {
            const id = faker.string.uuid()
            supportSubjectIds.set(
              id,
              faker.helpers.arrayElements(subjectIds, { min: 1, max: 2 })
            )
            const socialSupportType = randomSocialSupportType()
            const [status, subtype] =
              socialSupportType === 'Followup'
                ? [randomFollowupStatus(), randomMedium()]
                : [
                    randomHelpRequestStatus(),
                    socialSupportType === 'HelpRequestHousing'
                      ? 'Housing'
                      : undefined
                  ]
            return {
              id,
              createdById: users[0]?.id || ID_JEANNE_RESPONSABLE,
              lastUpdatedById: users[0]?.id || ID_JEANNE_RESPONSABLE,
              beneficiaryId: beneficiary.id,
              familyFileId: beneficiary.familyFileId,
              socialSupportType,
              structureId: structure.id,
              status,
              subtype,
              date: randomHistoryDate()
            }
          })
      )

      const supports = await prismaClient.socialSupport.createManyAndReturn({
        select: { id: true, socialSupportType: true },
        data
      })

      // The M2M relation cannot be set through createMany: connect per subject
      const supportIdsBySubject = new Map<string, { id: string }[]>()
      for (const [supportId, ids] of supportSubjectIds) {
        for (const subjectId of ids) {
          const list = supportIdsBySubject.get(subjectId) ?? []
          list.push({ id: supportId })
          supportIdsBySubject.set(subjectId, list)
        }
      }

      const [_, fi, __] = await Promise.all([
        prismaClient.followup.createMany({
          data: supports
            .filter(s => s.socialSupportType === 'Followup')
            .map(({ id }) => ({
              socialSupportId: id,
              medium: randomMedium(),
              firstFollowup: faker.datatype.boolean({
                probability: FIRST_FOLLOWUP_RATE
              })
            }))
        }),
        prismaClient.fileInstruction.createManyAndReturn({
          select: { id: true, type: true, socialSupportId: true },
          data: supports
            .filter(s => s.socialSupportType !== 'Followup')
            .map(({ id }) => ({
              socialSupportId: id,
              externalStructure: false,
              type: randomFileInstructionType()
            }))
        }),
        prismaClient.socialSupportRedirection.createMany({
          data: supports.map(({ id }) => {
            const type = randomRedirection()
            return {
              socialSupportId: id,
              type,
              redirectionReasonId:
                faker.helpers.arrayElement(redirectionReasons).id,
              ...(type === 'PartnerOrganization' && {
                partnerOrganizationId: faker.helpers.arrayElement(partners).id
              })
            }
          })
        }),
        ...[...supportIdsBySubject].map(([subjectId, connect]) =>
          prismaClient.socialSupportSubject.update({
            select: { id: true },
            where: { id: subjectId },
            data: { socialSupports: { connect } }
          })
        )
      ])

      await Promise.all([
        prismaClient.helpRequest.createMany({
          data: fi
            .filter(f => f.type !== 'Housing')
            .map(({ id, type, socialSupportId }) => ({
              subjectId: faker.helpers.arrayElement(
                supportSubjectIds.get(socialSupportId) as string[]
              ),
              financialSupport: type === 'Financial',
              fileInstructionId: id
            }))
        }),
        prismaClient.housingHelpRequest.createMany({
          data: fi
            .filter(f => f.type === 'Housing')
            .map(({ id }) => ({ fileInstructionId: id }))
        })
      ])
    }

    if (config.supportProgramsPerBeneficiary !== null) {
      const createdById = users[0]?.id || ID_JEANNE_RESPONSABLE

      const nameInputs = [
        preSupportProgramNameInput,
        ...catalogSubset(interventionAxisNameInputs)
      ]

      const supportProgramNames =
        await prismaClient.supportProgramName.createManyAndReturn({
          select: { id: true, hasLifecycle: true },
          data: nameInputs.map(input => ({
            ...input,
            structureId: structure.id,
            createdById
          }))
        })

      const exitReasons =
        await prismaClient.supportProgramExitReason.createManyAndReturn({
          select: { id: true },
          data: supportProgramExitReasonNames.map(name => ({
            name,
            structureId: structure.id,
            createdById
          }))
        })
      const exitReasonIds = exitReasons.map(r => r.id)

      // Build the support program rows, remembering which partners each should
      // be linked to (the M2M relation cannot be set through createMany).
      const programData: Prisma.SupportProgramCreateManyInput[] = []
      const programPartnerIds: string[][] = []

      for (const beneficiary of beneficiaries) {
        const programCount = faker.number.int({
          min: 0,
          max: config.supportProgramsPerBeneficiary
        })
        for (let p = 0; p < programCount; p++) {
          const name = faker.helpers.arrayElement(supportProgramNames)
          programData.push({
            beneficiaryId: beneficiary.id,
            supportProgramNameId: name.id,
            ...randomSupportProgramLifecycle(
              name.hasLifecycle,
              config.supportProgramEndedRate,
              exitReasonIds
            )
          })
          programPartnerIds.push(
            faker.datatype.boolean({
              probability: config.supportProgramPartnerLinkRate
            })
              ? faker.helpers
                  .arrayElements(partners, { min: 1, max: 2 })
                  .map(pp => pp.id)
              : []
          )
        }
      }

      if (programData.length) {
        const programs = await prismaClient.supportProgram.createManyAndReturn({
          select: { id: true },
          data: programData
        })

        // Bulk-insert the partner <-> support program join rows
        const links: { a: string; b: string }[] = []
        programs.forEach((program, idx) => {
          for (const partnerId of programPartnerIds[idx] ?? []) {
            links.push({ a: partnerId, b: program.id })
          }
        })

        const JOIN_CHUNK = 1000
        for (let c = 0; c < links.length; c += JOIN_CHUNK) {
          const values = Prisma.join(
            links
              .slice(c, c + JOIN_CHUNK)
              .map(l => Prisma.sql`(${l.a}::uuid, ${l.b}::uuid)`)
          )
          await prismaClient.$executeRaw`
            INSERT INTO "_partner_organization_to_support_program" ("A", "B")
            VALUES ${values}
          `
        }
      }
    }
  }
}

const HELP = `Usage: tsx --tsconfig prisma/tsconfig.json prisma/large_seed.ts [options]

Seeds the review app database: the Cross-Structure Observer and ${structurePlan.length} structures
of a fictional Saône-et-Loire territory, with a fixed faker seed.
Run it on a freshly reset database: see the comment at the top of prisma/large_seed.ts
for the run / reset steps.

Options (defaults in brackets; "none" skips the related entities):
  --users-per-structure <n|none>               Users per structure [none => link Jeanne Responsable]
  --families-per-structure <n>                 Family files per structure [${DEFAULTS.familyFilesPerStructure}]
  --social-supports-per-beneficiary <n|none>   Social supports per beneficiary [${DEFAULTS.socialSupportsPerBeneficiary}]
  --support-programs-per-beneficiary <n|none>  Max support programs per beneficiary [${DEFAULTS.supportProgramsPerBeneficiary}]
  --support-program-partner-link-rate <r>      Share of programs linked to partners, 0..1 [${DEFAULTS.supportProgramPartnerLinkRate}]
  --support-program-ended-rate <r>             Share of lifecycle programs ended, 0..1 [${DEFAULTS.supportProgramEndedRate}]
  -h, --help                                   Show this help and exit
`

const cliOptions = {
  'help': { type: 'boolean', short: 'h' },
  'users-per-structure': { type: 'string' },
  'families-per-structure': { type: 'string' },
  'social-supports-per-beneficiary': { type: 'string' },
  'support-programs-per-beneficiary': { type: 'string' },
  'support-program-partner-link-rate': { type: 'string' },
  'support-program-ended-rate': { type: 'string' }
} as const

// Shape of parseArgs values for cliOptions: every value flag is a string, help
// is a boolean, all optional.
type CliValues = { help?: boolean } & {
  [K in Exclude<keyof typeof cliOptions, 'help'>]?: string
}

// Parse an integer flag, throwing on anything that is not an integer >= min.
function parseIntFlag(flag: string, raw: string, min: number): number {
  const value = Number(raw)
  if (!Number.isInteger(value) || value < min) {
    throw new Error(`--${flag} must be an integer >= ${min}, got "${raw}"`)
  }
  return value
}

// Parse a nullable count flag: "none" => null, undefined => fallback, otherwise
// an integer >= 0.
function parseNullableIntFlag(
  flag: string,
  raw: string | undefined,
  fallback: number | null
): number | null {
  if (raw === undefined) {
    return fallback
  }
  if (raw === 'none') {
    return null
  }
  return parseIntFlag(flag, raw, 0)
}

// Parse a rate flag in [0, 1], throwing otherwise; undefined => fallback.
function parseRateFlag(
  flag: string,
  raw: string | undefined,
  fallback: number
): number {
  if (raw === undefined) {
    return fallback
  }
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`--${flag} must be a number between 0 and 1, got "${raw}"`)
  }
  return value
}

function buildConfig(values: CliValues): Config {
  return {
    usersPerStructure: parseNullableIntFlag(
      'users-per-structure',
      values['users-per-structure'],
      DEFAULTS.usersPerStructure
    ),
    familyFilesPerStructure:
      values['families-per-structure'] === undefined
        ? DEFAULTS.familyFilesPerStructure
        : parseIntFlag(
            'families-per-structure',
            values['families-per-structure'],
            0
          ),
    socialSupportsPerBeneficiary: parseNullableIntFlag(
      'social-supports-per-beneficiary',
      values['social-supports-per-beneficiary'],
      DEFAULTS.socialSupportsPerBeneficiary
    ),
    supportProgramsPerBeneficiary: parseNullableIntFlag(
      'support-programs-per-beneficiary',
      values['support-programs-per-beneficiary'],
      DEFAULTS.supportProgramsPerBeneficiary
    ),
    supportProgramPartnerLinkRate: parseRateFlag(
      'support-program-partner-link-rate',
      values['support-program-partner-link-rate'],
      DEFAULTS.supportProgramPartnerLinkRate
    ),
    supportProgramEndedRate: parseRateFlag(
      'support-program-ended-rate',
      values['support-program-ended-rate'],
      DEFAULTS.supportProgramEndedRate
    )
  }
}

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

async function bootstrap() {
  const argv = process.argv.slice(2)

  let values: CliValues
  try {
    ;({ values } = parseArgs({ args: argv, options: cliOptions }))
  } catch (error) {
    // Unknown/malformed flags from parseArgs itself.
    fail((error as Error).message)
  }

  if (values.help) {
    console.log(HELP)
    process.exit(0)
  }

  let config: Config
  try {
    config = buildConfig(values)
  } catch (error) {
    fail((error as Error).message)
  }

  await main(config)
}

bootstrap()
;['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(signal =>
  process.on(signal, async () => {
    await prismaClient.$disconnect()
    process.exit(1)
  })
)
