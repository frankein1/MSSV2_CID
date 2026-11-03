import type {
  Beneficiary,
  SupportProgram,
  BeneficiaryRelative,
  Prisma,
  RepClassification,
  SchoolStatus,
  SchoolType,
  User,
  UserStatus
} from '@prisma/client'
import type { RouterOutput } from '~~/server/trpc/routers'
import type { contributingPartnerSelect } from '~~/server/services/beneficiary/queries'

export type BeneficiaryReferent = {
  id: string
  name: string
  status: UserStatus
}

export type BeneficiaryNames = Partial<
  Pick<Beneficiary, 'id'> & {
    // ANONYMIZED firstName, usualName, birthName
    firstName?: string | null
    usualName?: string | null
    birthName?: string | null
  }
>

export type BeneficiaryIdentification = Pick<
  Beneficiary,
  'id' | 'birthDate'
> & {
  // ANONYMIZED firstName, usualName, birthName
  firstName?: string | null
  usualName?: string | null
  birthName?: string | null
}

export type BeneficiaryFileIdentification = Pick<
  Beneficiary,
  'id' | 'birthDate' | 'relationship'
> & {
  // ANONYMIZED firstName, usualName, birthName
  firstName?: string | null
  usualName?: string | null
  birthName?: string | null
}

export type GetBeneficiaryHealth = Pick<Beneficiary, 'insurance'> & {
  // ANONYMIZED gir, doctor, healthAdditionalInformation, socialSecurityNumber
  gir?: unknown
  doctor?: string | null
  healthAdditionalInformation?: string | null
  socialSecurityNumber?: string | null
}

export type GetBeneficiaryGeneral = Pick<
  Beneficiary,
  | 'title'
  | 'birthDate'
  | 'deathDate'
  | 'gender'
  | 'status'
  | 'nationality'
  | 'accommodationMode'
  | 'accommodationName'
  | 'accommodationZone'
  | 'accommodationAdditionalInformation'
  | 'zipcode'
  | 'city'
  | 'region'
  | 'department'
  | 'qpv'
  | 'district'
  | 'mobility'
> & {
  // ANONYMIZED fields
  usualName?: string | null
  birthName?: string | null
  firstName?: string | null
  birthPlace?: string | null
  numeroPegase?: string | null
  street?: string | null
  addressComplement?: string | null
  noPhone?: boolean
  phone1?: string | null
  phone2?: string | null
  email?: string | null
  additionalInformation?: string | null
}

export type ContributingPartnerOutput =
  Prisma.BeneficiaryContributingPartnerGetPayload<{
    select: typeof contributingPartnerSelect
  }>

export type GetSupportProgramItem = Pick<
  SupportProgram,
  'id' | 'startDate' | 'endDate' | 'outcome'
> & {
  exitReason: string | null
  supportProgramName: { id: string; name: string; hasLifecycle: boolean }
  partnerOrganisations: { id: string; name: string }[]
}

export type GetBeneficiaryExternalOrganisations = Pick<
  Beneficiary,
  | 'protectionMeasure'
  | 'prescribingStructure'
  | 'orientationType'
  | 'orientationStructure'
  | 'serviceProviders'
  | 'involvedPartners'
> & {
  // ANONYMIZED representative
  representative?: string | null
} & {
  prescribingOrganization: { id: string; name: string } | null
  prescribingOrganizationContact: { id: string; name: string } | null
  contributingPartners: ContributingPartnerOutput[]
}

export type GetBeneficiarySupportPrograms = GetSupportProgramItem[]

export type GetBeneficiaryOccupationIncome = Pick<
  Beneficiary,
  | 'socioProfessionalCategory'
  | 'activityStatus'
  | 'contractType'
  | 'schoolClass'
  | 'schoolPrograms'
  | 'schoolUai'
  | 'occupation'
  | 'studyLevel'
  | 'employer'
  | 'pensionOrganisations'
  | 'otherPensionOrganisations'
  | 'ministereCategorie'
  | 'ministereDepartementServiceAc'
  | 'ministereStructure'
> & {
  // ANONYMIZED employerSiret, unemploymentNumber, cafNumber
  employerSiret?: string | null
  unemploymentNumber?: string | null
  cafNumber?: string | null
} & {
  school: {
    uai: string
    name: string
    type: SchoolType
    address: string | null
    city: string
    zipcode: string
    citycode: string
    academy: string
    status: SchoolStatus
    repClassification: RepClassification | null
    qpvCode: string | null
    qpvName: string | null
  } | null
}

export type GetBeneficiaryRelative = Pick<
  BeneficiaryRelative,
  'id' | 'relationship' | 'hosted' | 'caregiver' | 'beneficiaryId'
> & {
  // ANONYMIZED lastName, firstName, city, email, phone, additionalInformation, birthDate
  lastName?: string | null
  firstName?: string | null
  city?: string | null
  email?: string | null
  phone?: string | null
  additionalInformation?: string | null
  birthDate?: Date | null
}

export type GetBeneficiaryTaxHousehold = Pick<
  Beneficiary,
  | 'familySituation'
  | 'weddingDate'
  | 'divorceDate'
  | 'minorChildren'
  | 'majorChildren'
  | 'caregiver'
>

export type BeneficiaryFileInformation = Pick<
  Beneficiary,
  'status' | 'aidantConnectAuthorized' | 'vulnerablePerson'
> & {
  referents: (Pick<User, 'id' | 'role' | 'status'> & {
    // ANONYMIZED firstName, lastName, email
    firstName?: string | null
    lastName?: string | null
    email?: string | null
  })[]
}

type BeneficiaryDetails = RouterOutput['beneficiary']['getBeneficiaryDetails']
type BeneficiaryHistory = BeneficiaryDetails['beneficiary']['history']
export type BeneficiarySearchResult = RouterOutput['beneficiary']['search'][0]

export type GetBeneficiaryOutput = Pick<
  Beneficiary,
  | 'id'
  | 'familyFileId'
  | 'structureId'
  | 'createdById'
  | 'created'
  | 'updated'
  | 'lastActivity'
  | 'status'
  | 'relationship'
> & {
  // ANONYMIZED fileNumber, additionalInformation
  fileNumber?: string | null
  additionalInformation?: string | null
} & BeneficiaryFileInformation & {
    general: GetBeneficiaryGeneral
    health: GetBeneficiaryHealth | undefined
    externalOrganisations: GetBeneficiaryExternalOrganisations | undefined
    supportPrograms: GetBeneficiarySupportPrograms | undefined
    occupationIncome: GetBeneficiaryOccupationIncome | undefined
    entourages: GetBeneficiaryRelative[] | undefined
    taxHouseholds: GetBeneficiaryTaxHousehold | undefined
    history: BeneficiaryHistory | undefined
  }

export type BeneficiaryDetailsOutput =
  RouterOutput['beneficiary']['getBeneficiaryDetails']['beneficiary']
