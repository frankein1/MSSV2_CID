import type { Prisma, SocialSupportSubject } from '@prisma/client'
import { BeneficiaryRepo } from '~~/server/database'
import type {
  AppContextPermissions,
  FamilyFilePermissions,
  SecurityRuleContext,
  SecurityRuleGrantee
} from '~~/server/security'
import {
  getAppContextPermissions,
  getFamilyFilePermissions
} from '~~/server/security'
import { isObjectEmpty } from '~~/server/utils/isObjectEmpty'

export const contributingPartnerSelect = {
  id: true,
  partnerOrganization: { select: { id: true, name: true } },
  partnerOrganizationContact: { select: { id: true, name: true } }
  // precisions: true
} satisfies Prisma.BeneficiaryContributingPartnerSelect

const select = {
  id: true,
  familyFileId: true,
  // fileNumber: true,
  status: true,
  structureId: true,
  createdById: true,
  created: true,
  updated: true,
  lastActivity: true,
  archiveDueDate: true,
  archiveDueDateHistory: true,
  aidantConnectAuthorized: true,
  vulnerablePerson: true,
  // additionalInformation: true,
  qpv: true,
  relationship: true,

  // general
  title: true,
  // usualName: true,
  // birthName: true,
  // firstName: true,
  // birthDate: true,
  // birthPlace: true,
  deathDate: true,
  gender: true,
  nationality: true,
  // numeroPegase: true,
  accommodationMode: true,
  accommodationName: true,
  accommodationZone: true,
  accommodationAdditionalInformation: true,
  // street: true,
  // addressComplement: true,
  // zipcode: true,
  city: true,
  region: true,
  department: true,
  district: true,
  // noPhone: true,
  // phone1: true,
  // phone2: true,
  // email: true,
  mobility: true,

  // tax households
  divorceDate: true,
  weddingDate: true,
  familySituation: true,
  minorChildren: true,
  majorChildren: true,
  caregiver: true,

  // health
  // gir: true,
  // doctor: true,
  // healthAdditionalInformation: true,
  // socialSecurityNumber: true,
  // insurance: true,

  // occupation & income
  socioProfessionalCategory: true,
  activityStatus: true,
  contractType: true,
  occupation: true,
  studyLevel: true,
  employer: true,
  // employerSiret: true,
  // unemploymentNumber: true,
  pensionOrganisations: true,
  otherPensionOrganisations: true,
  // cafNumber: true,
  schoolClass: true,
  schoolPrograms: true,
  schoolUai: true,
  ministereCategorie: true,
  ministereDepartementServiceAc: true,
  ministereStructure: true,

  // external organisations
  protectionMeasure: true,
  // representative: true,
  prescribingStructure: true,
  orientationType: true,
  orientationStructure: true,
  serviceProviders: true,
  involvedPartners: true,
  prescribingOrganization: {
    select: { id: true, name: true }
  },
  prescribingOrganizationContact: {
    select: { id: true, name: true }
  },
  contributingPartners: {
    select: contributingPartnerSelect,
    orderBy: { partnerOrganization: { name: 'asc' } }
  },

  // relations
  socialSupports: {
    select: {
      subjects: {
        select: {
          id: true,
          name: true
        }
      }
    }
  },
  familyFile: {
    select: {
      structureId: true,
      referents: {
        select: {
          id: true,
          // firstName: true,
          // lastName: true,
          // email: true,
          role: true,
          status: true
        }
      }
    }
  },
  relatives: {
    select: {
      id: true,
      // lastName: true,
      // firstName: true,
      relationship: true,
      // city: true,
      // email: true,
      // phone: true,
      hosted: true,
      caregiver: true,
      beneficiaryId: true
      // additionalInformation: true,
      // birthDate: true
    }
  },
  school: {
    select: {
      uai: true,
      name: true,
      type: true,
      address: true,
      zipcode: true,
      citycode: true,
      city: true,
      academy: true,
      status: true,
      repClassification: true,
      qpvCode: true,
      qpvName: true
    }
  },
  _count: {
    select: { socialSupports: true }
  },
  supportPrograms: {
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      exitReason: { select: { name: true } },
      outcome: true,
      supportProgramName: {
        select: { id: true, name: true, hasLifecycle: true }
      },
      partnerOrganisations: { select: { id: true, name: true } }
    }
  }
} satisfies Prisma.BeneficiarySelect

function findOne(user: SecurityRuleGrantee, id: string) {
  return BeneficiaryRepo.findUniqueOrThrow(user, {
    where: { id },
    select
  })
}

type BeneficiaryOutput = Prisma.PromiseReturnType<typeof findOne>

export async function getOne(ctx: SecurityRuleContext, id: string) {
  const beneficiary = await findOne(ctx.user, id)
  const permissions = getFamilyFilePermissions({
    ctx,
    familyFile: beneficiary.familyFile
  })
  const appPermissions = getAppContextPermissions(ctx)
  return {
    beneficiary: filter(permissions, appPermissions, beneficiary),
    permissions
  }
}

export async function getPage(
  ctx: SecurityRuleContext,
  args: Omit<Prisma.BeneficiaryFindManyArgs, 'select' | 'include'>
) {
  const beneficiaries = await BeneficiaryRepo.findMany(ctx.user, {
    where: args.where,
    select,
    take: args.take,
    skip: args.skip,
    orderBy: args.orderBy
  })
  const appPermissions = getAppContextPermissions(ctx)
  return beneficiaries.map(beneficiary => {
    const permissions = getFamilyFilePermissions({
      ctx,
      familyFile: beneficiary.familyFile
    })
    return {
      beneficiary: filter(permissions, appPermissions, beneficiary),
      permissions
    }
  })
}

const filter = (
  permissions: FamilyFilePermissions,
  appPermissions: AppContextPermissions,
  beneficiary: BeneficiaryOutput
) => {
  const general = getGeneral(beneficiary, appPermissions)

  const { view } = permissions

  const externalOrganisations = view.externalOrganisations
    ? getExternalOrganisations(beneficiary)
    : undefined
  const supportPrograms = view.supportPrograms
    ? getSupportPrograms(beneficiary)
    : undefined
  const health =
    appPermissions.module.health && view.health
      ? getHealth(beneficiary, appPermissions.edit.health.nir)
      : undefined
  const occupationIncome = view.occupationIncome
    ? getOccupationIncome(beneficiary, appPermissions)
    : undefined

  const entourages = view.relatives ? beneficiary.relatives : undefined

  const taxHouseholds = getTaxHouseholds(beneficiary)

  const history = getHistory(beneficiary)

  return {
    id: beneficiary.id,
    familyFileId: beneficiary.familyFileId,
    fileNumber: beneficiary.fileNumber,
    status: beneficiary.status,
    referents: beneficiary.familyFile.referents,
    structureId: beneficiary.structureId,
    additionalInformation: beneficiary.additionalInformation,
    createdById: beneficiary.createdById,
    created: beneficiary.created,
    updated: beneficiary.updated,
    lastActivity: beneficiary.lastActivity,
    archiveDueDate: beneficiary.archiveDueDate,
    archiveDueDateHistory: beneficiary.archiveDueDateHistory,
    aidantConnectAuthorized: beneficiary.aidantConnectAuthorized,
    vulnerablePerson: beneficiary.vulnerablePerson,
    general,
    externalOrganisations: !isObjectEmpty(externalOrganisations)
      ? externalOrganisations
      : undefined,
    supportPrograms: supportPrograms?.length ? supportPrograms : undefined,
    health: !isObjectEmpty(health) ? health : undefined,
    occupationIncome: !isObjectEmpty(occupationIncome)
      ? occupationIncome
      : undefined,
    taxHouseholds: !isObjectEmpty(taxHouseholds) ? taxHouseholds : undefined,
    entourages: !isObjectEmpty(entourages) ? entourages : undefined,
    qpv: beneficiary.qpv,
    history,
    relationship: beneficiary.relationship
  }
}

function getHistory(beneficiary: BeneficiaryOutput) {
  return {
    historyTotal: beneficiary._count.socialSupports,
    subjects: getUniqueSubjects(beneficiary)
  }
}

function getUniqueSubjects(beneficiary: BeneficiaryOutput) {
  return beneficiary.socialSupports.reduce(
    (subjects, ss) => {
      if (!ss.subjects.length) {
        return subjects
      }

      const notCollectedSubjects: Pick<SocialSupportSubject, 'id' | 'name'>[] =
        []

      ss.subjects.forEach(subject => {
        const isNotInSubjects = subjects.every(t => t.id !== subject.id)
        const isNotInNotCollectedSubjects = notCollectedSubjects.every(
          t => t.id !== subject.id
        )

        if (isNotInSubjects && isNotInNotCollectedSubjects) {
          notCollectedSubjects.push(subject)
        }
      })

      return [...subjects, ...notCollectedSubjects]
    },
    [] as Pick<SocialSupportSubject, 'id' | 'name'>[]
  )
}

function getGeneral(
  beneficiary: BeneficiaryOutput,
  permissions: AppContextPermissions
) {
  const { module } = permissions
  return {
    title: beneficiary.title,
    // usualName: beneficiary.usualName,
    // birthName: beneficiary.birthName,
    // firstName: beneficiary.firstName,
    // birthDate: beneficiary.birthDate,
    // birthPlace: beneficiary.birthPlace,
    deathDate: beneficiary.deathDate,
    gender: beneficiary.gender,
    nationality: beneficiary.nationality,
    numeroPegase: module.ministere ? beneficiary.numeroPegase : null,
    accommodationMode: beneficiary.accommodationMode,
    accommodationName: beneficiary.accommodationName,
    accommodationZone: module.ministere ? beneficiary.accommodationZone : null,
    accommodationAdditionalInformation:
      beneficiary.accommodationAdditionalInformation,
    street: beneficiary.street,
    addressComplement: beneficiary.addressComplement,
    zipcode: beneficiary.zipcode,
    city: beneficiary.city,
    region: beneficiary.region,
    department: beneficiary.department,
    qpv: beneficiary.qpv,
    district: beneficiary.district,
    noPhone: beneficiary.noPhone,
    phone1: beneficiary.phone1,
    phone2: beneficiary.phone2,
    email: beneficiary.email,
    mobility: beneficiary.mobility,
    status: beneficiary.status,
    additionalInformation: beneficiary.additionalInformation
  }
}

function getTaxHouseholds(beneficiary: BeneficiaryOutput) {
  const {
    divorceDate,
    weddingDate,
    familySituation,
    minorChildren,
    majorChildren,
    caregiver
  } = beneficiary

  return {
    familySituation,
    divorceDate,
    weddingDate,
    minorChildren,
    majorChildren,
    caregiver
  }
}

function getHealth(beneficiary: BeneficiaryOutput, canGetNir = false) {
  return {
    // gir: beneficiary.gir,
    // doctor: beneficiary.doctor,
    // healthAdditionalInformation: beneficiary.healthAdditionalInformation,
    // socialSecurityNumber: canGetNir ? beneficiary.socialSecurityNumber : null,
    // insurance: beneficiary.insurance
  }
}

function getOccupationIncome(
  beneficiary: BeneficiaryOutput,
  permissions: AppContextPermissions
) {
  const { module } = permissions
  return {
    socioProfessionalCategory: beneficiary.socioProfessionalCategory,
    activityStatus: beneficiary.activityStatus,
    contractType: beneficiary.contractType,
    occupation: beneficiary.occupation,
    studyLevel: beneficiary.studyLevel,
    employer: beneficiary.employer,
    employerSiret: beneficiary.employerSiret,
    unemploymentNumber: beneficiary.unemploymentNumber,
    pensionOrganisations: beneficiary.pensionOrganisations,
    otherPensionOrganisations: beneficiary.otherPensionOrganisations,
    cafNumber: beneficiary.cafNumber,
    schoolClass: beneficiary.schoolClass,
    schoolPrograms: beneficiary.schoolPrograms,
    schoolUai: beneficiary.schoolUai,
    school: beneficiary.school,
    // funeralContract: beneficiary.funeralContract,
    ministereCategorie: module.ministere
      ? beneficiary.ministereCategorie
      : null,
    ministereDepartementServiceAc: module.ministere
      ? beneficiary.ministereDepartementServiceAc
      : null,
    ministereStructure: module.ministere ? beneficiary.ministereStructure : null
  }
}

function getExternalOrganisations(beneficiary: BeneficiaryOutput) {
  return {
    protectionMeasure: beneficiary.protectionMeasure,
    representative: beneficiary.representative,
    prescribingStructure: beneficiary.prescribingStructure,
    orientationType: beneficiary.orientationType,
    orientationStructure: beneficiary.orientationStructure,
    serviceProviders: beneficiary.serviceProviders,
    involvedPartners: beneficiary.involvedPartners,
    prescribingOrganization: beneficiary.prescribingOrganization,
    prescribingOrganizationContact: beneficiary.prescribingOrganizationContact,
    contributingPartners: beneficiary.contributingPartners
  }
}

function getSupportPrograms(beneficiary: BeneficiaryOutput) {
  return beneficiary.supportPrograms.map(d => {
    const hasLifecycle = d.supportProgramName.hasLifecycle
    return {
      id: d.id,
      startDate: hasLifecycle ? d.startDate : null,
      endDate: hasLifecycle ? d.endDate : null,
      exitReason: hasLifecycle ? (d.exitReason?.name ?? null) : null,
      outcome: d.outcome,
      supportProgramName: {
        id: d.supportProgramName.id,
        name: d.supportProgramName.name,
        hasLifecycle: d.supportProgramName.hasLifecycle
      },
      partnerOrganisations: d.partnerOrganisations
    }
  })
}
