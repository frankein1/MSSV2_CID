import type { Prisma } from '@prisma/client'
import type { SnakeCase } from './utils'

/** The following tables are excluded from the export
- Comment
- DataInclusionStructure (will be added for API v1)
- Email
- ApiToken
 */

const configUser: Record<
  SnakeCase<keyof typeof Prisma.UserScalarFieldEnum>,
  boolean
> = {
  id: true,
  created: true,
  updated: true,
  role: true,
  first_access: true,
  last_access: true,
  status: true,
  structure_id: true,
  external_rdvsp_id: true,
  aidant_connect_authorisation: true,
  // -- BEGIN ANONYMIZED
  // first_name: false,
  // last_name: false,
  // email: false,
  account_reminder_email: true
  // authorization_code: false,
  // authorization_code_validity: false
}

const configStructure: Record<
  SnakeCase<keyof typeof Prisma.StructureScalarFieldEnum>,
  boolean
> = {
  id: true,
  created: true,
  updated: true,
  type: true,
  disabled: true,
  name: true,
  siret: true,
  city: true,
  address: true,
  zipcode: true,
  insee_code: true,
  inhabitants_number: true,
  last_access: true,
  last_activity: true,
  external_rdvsp_active: true,
  external_rdvsp_id: true,
  deactivation_alert_email: true,
  deactivation_alert_email_date: true,
  phone: true
  // -- BEGIN ANONYMIZED
  // email: false,
  // dpo_email: false,
  // dpo_first_name: false,
  // dpo_last_name: false
}

const configStructureTypeSurvey: Record<
  SnakeCase<keyof typeof Prisma.StructureTypeSurveyScalarFieldEnum>,
  boolean
> = {
  id: true,
  structure_id: true,
  structure_type: true,
  structure_type_other: true,
  social_support_types: true,
  filled_by_id: true,
  created: true
}

// Adaptation needed because of typo in column name
type SocialSupportSubjectColumnName =
  | Exclude<
      SnakeCase<keyof typeof Prisma.SocialSupportSubjectScalarFieldEnum>,
      'owned_by_structure_id'
    >
  | 'owned_by_structured_id'

const configSubject: Record<SocialSupportSubjectColumnName, boolean> = {
  id: true,
  created: true,
  name: true,
  default: true,
  used: true,
  inactive: true,
  created_by_id: true,
  owned_by_structured_id: true
}

const configFamilyFile: Record<
  SnakeCase<keyof typeof Prisma.FamilyFileScalarFieldEnum>,
  boolean
> = {
  id: true,
  structure_id: true
}

type BeneficiaryColumnName = SnakeCase<
  keyof typeof Prisma.BeneficiaryScalarFieldEnum
>

const configBeneficiary: Record<BeneficiaryColumnName, boolean> = {
  id: true,
  created: true,
  updated: true,
  structure_id: true,
  family_file_id: true,
  created_by_id: true,
  split_from_file_by_id: true,
  previous_family_file_id: true,
  disabled_by_id: true,
  external_rdvsp_id: true,
  title: true,
  gender: true,
  nationality: true,
  birth_date: true,
  death_date: true,
  city: true,
  zipcode: true,
  department: true,
  region: true,
  qpv: true,
  district: true,
  status: true,
  insurance: true,
  occupation: true,
  pension_organisations: true,
  orientation_type: true,
  other_pension_organisations: true,
  bank: true,
  funeral_contract: true,
  protection_measure: true,
  prescribing_structure: true,
  involved_partners: true,
  accommodation_additional_information: true,
  accommodation_mode: true,
  accommodation_name: true,
  accommodation_zone: true,
  aidant_connect_authorized: true,
  archive_due_date: true,
  archive_due_date_history: true,
  last_activity: true,
  service_providers: true,
  socio_professional_category: true,
  contract_type: true,
  study_level: true,
  school_class: true,
  school_uai: true,
  school_programs: true,
  family_situation: true,
  ministere_structure: true,
  ministere_departement_service_ac: true,
  orientation_structure: true,
  wedding_date: true,
  divorce_date: true,
  caregiver: true,
  major_children: true,
  minor_children: true,
  ministere_categorie: true,
  mobility: true,
  vulnerable_person: true,
  relationship: true,
  employer: true,
  activity_status: true,
  prescribing_organization_id: true,
  prescribing_organization_contact_id: true
  // -- BEGIN ANONYMIZED
  // employer_siret: false,
  // first_name: false,
  // usual_name: false,
  // birth_name: false,
  // usual_name_normalized: false,
  // first_name_normalized: false,
  // birth_name_normalized: false,
  // social_security_number: false,
  // birth_place: false,
  // email: false,
  // street: false,
  // file_number: false,
  // address_complement: false,
  // phone1: false,
  // phone2: false,
  // no_phone: false,
  // gir: false,
  // doctor: false,
  // additional_information: false,
  // unemployment_number: false,
  // caf_number: false,
  // health_additional_information: false,
  // numero_pegase: false,
  // representative: false
}

const configBeneficiaryContributingPartner: Record<
  SnakeCase<keyof typeof Prisma.BeneficiaryContributingPartnerScalarFieldEnum>,
  boolean
> = {
  id: true,
  beneficiary_id: true,
  partner_organization_id: true,
  partner_organization_contact_id: true,
  created_at: true
  // -- BEGIN ANONYMIZED
  // precisions: false
}

const configDocument: Record<
  SnakeCase<keyof typeof Prisma.DocumentScalarFieldEnum>,
  boolean
> = {
  key: true,
  mime_type: true,
  size: true,
  type: true,
  migrated: true,
  created: true,
  created_by_id: true,
  family_file_id: true,
  beneficiary_id: true,
  tags: true,
  confidential: true,
  expiration_date: true
  // -- BEGIN ANONYMIZED
  // name: false,
  // filename_disk: false,
  // filename_download: false,
  // encrypted_data_key: false
}

const configFamilyFileToReferent = {
  A: true,
  B: true
} as Record<'A' | 'B', boolean>

const configSocialSupport: Record<
  SnakeCase<keyof typeof Prisma.SocialSupportScalarFieldEnum>,
  boolean
> = {
  id: true,
  created: true,
  updated: true,
  structure_id: true,
  family_file_id: true,
  beneficiary_id: true,
  created_by_id: true,
  last_updated_by_id: true,
  minister_id: true,
  date: true,
  social_support_type: true,
  status: true,
  due_date: true,
  subtype: true,
  end_of_social_support: true,
  // -- BEGIN ANONYMIZED
  // synthesis: false,
  // synthesis_rich_text: false,
  // private_synthesis: false,
  // private_synthesis_rich_text: false,
  // numero_pegase: false,
  support_program_id: true
}

const configDocumentToSocialSupport = {
  A: true,
  B: true
} as Record<'A' | 'B', boolean>

const configSocialSupportToFollowupType = {
  A: true,
  B: true
} as Record<'A' | 'B', boolean>

const configPartnerOrganization: Record<
  SnakeCase<keyof typeof Prisma.PartnerOrganizationScalarFieldEnum>,
  boolean
> = {
  id: true,
  created: true,
  name: true,
  created_by_id: true,
  structure_id: true,
  data_inclusion_id: true,
  data_inclusion_id_v1: true,
  data_source: true,
  inactive: true,
  siret: true,
  address: true,
  city: true,
  zipcode: true,
  phone1: true,
  phone2: true,
  working_hours: true,
  website: true
  // -- BEGIN ANONYMIZED
  // email: false
}

const configPartnerOrganizationContact: Record<
  SnakeCase<keyof typeof Prisma.PartnerOrganizationContactScalarFieldEnum>,
  boolean
> = {
  id: true,
  name: true,
  phone: true,
  email: true,
  partner_id: true
}

const configFollowup: Record<
  SnakeCase<keyof typeof Prisma.FollowupScalarFieldEnum>,
  boolean
> = {
  id: true,
  updated: true,
  prescribing_organization_id: true,
  prescribing_organization_contact_id: true,
  medium: true,
  help_requested: true,
  place: true,
  classified: true,
  first_followup: true,
  forwarded_to_justice: true,
  is_during_walk_in_session: true,
  duration: true,
  social_support_id: true
  // -- BEGIN ANONYMIZED
  // third_person_name: false
}

const configFileInstruction: Record<
  SnakeCase<keyof typeof Prisma.FileInstructionScalarFieldEnum>,
  boolean
> = {
  id: true,
  updated: true,
  type: true,
  instructor_organization_id: true,
  instructor_organization_contact_id: true,
  external_structure: true,
  examination_date: true,
  decision_date: true,
  refusal_reason: true,
  refusal_reason_other: true,
  dispatch_date: true,
  full_file: true,
  social_support_id: true
}

// Adaptation needed historic name in DB has not been updated
type HelpRequestColumnName =
  | Exclude<
      SnakeCase<keyof typeof Prisma.HelpRequestScalarFieldEnum>,
      'subject_id'
    >
  | 'type_id'

const configHelpRequest: Record<HelpRequestColumnName, boolean> = {
  id: true,
  type_id: true,
  prescribing_organization_id: true,
  prescribing_organization_contact_id: true,
  file_instruction_id: true,
  financial_support: true,
  is_refundable: true,
  asked_amount: true,
  allocated_amount: true,
  payment_date: true,
  payment_method: true,
  handling_date: true
}

const configHousingHelpRequest: Record<
  SnakeCase<keyof typeof Prisma.HousingHelpRequestScalarFieldEnum>,
  boolean
> = {
  id: true,
  prescribing_organization_id: true,
  prescribing_organization_contact_id: true,
  is_first: true,
  first_opening_date: true,
  asked_housing: true,
  unique_id: true,
  tax_household_additional_information: true,
  max_charges: true,
  max_rent: true,
  housing_type: true,
  room_count: true,
  is_pmr: true,
  reason: true,
  low_income_housing_type: true,
  file_instruction_id: true,
  handling_date: true
}

const configAccount: Record<
  SnakeCase<keyof typeof Prisma.AccountScalarFieldEnum>,
  boolean
> = {
  id: true,
  created: true,
  updated: true,
  user_id: true,
  provider: true
  // -- BEGIN ANONYMIZED
  // provider_account_id: false,
  // id_token: false,
  // session_state: false
}

const configBeneficiaryRelative: Record<
  | Exclude<
      SnakeCase<keyof typeof Prisma.BeneficiaryRelativeScalarFieldEnum>,
      'linked_beneficiary_id'
    >
  | 'beneficiary_link_id',
  boolean
> = {
  id: true,
  created: true,
  updated: true,
  relationship: true,
  hosted: true,
  caregiver: true,
  beneficiary_id: true,
  beneficiary_link_id: true
  // -- BEGIN ANONYMIZED
  // last_name: false,
  // first_name: false,
  // birth_date: false,
  // email: false,
  // phone: false,
  // city: false,
  // additional_information: false
}

const configArchivedBeneficiary: Record<
  | Exclude<
      SnakeCase<keyof typeof Prisma.ArchivedBeneficiaryScalarFieldEnum>,
      'social_support_subjects' | 'fille_instruction_count'
    >
  | 'socialSupportSubjects'
  | 'file_instruction_count',
  boolean
> = {
  id: true,
  created: true,
  updated: true,
  structure_id: true,
  reason: true,
  clarification: true,
  socialSupportSubjects: true,
  file_instruction_count: true,
  followup_count: true,
  file_creation_date: true,
  archived_by_id: true,
  event_date_reason: true,
  structure_type: true,
  // -- BEGIN ANONYMIZED
  // title: false,
  // first_name: false,
  // usual_name: false,
  // birth_name: false,
  old_beneficiary_id: true
}

const configCGUHistory: Record<
  SnakeCase<keyof typeof Prisma.CGUHistoryScalarFieldEnum>,
  boolean
> = {
  id: true,
  user_id: true,
  date: true,
  version: true
}

const configWorkshop: Record<
  | Exclude<
      SnakeCase<keyof typeof Prisma.WorkshopScalarFieldEnum>,
      'age_limit' | 'age_limit_condition'
    >
  | 'ageLimit'
  | 'ageLimitCondition',
  boolean
> = {
  id: true,
  created_at: true,
  created_by_id: true,
  structure_id: true,
  partner_organization_id: true,
  support_program_name_id: true,
  chargeable: true,
  workshop_name_id: true,
  location: true,
  attendee_limit: true,
  ageLimit: true,
  ageLimitCondition: true,
  date: true,
  start_time: true,
  end_time: true,
  session_name: true
  // -- BEGIN ANONYMIZED
  // host: false,
  // description: false
}

const configWorkshopName: Record<
  SnakeCase<keyof typeof Prisma.WorkshopNameScalarFieldEnum>,
  boolean
> = {
  id: true,
  name: true,
  structure_id: true,
  created_by_id: true,
  created_at: true
}

const configWorkshopAttendee: Record<
  SnakeCase<keyof typeof Prisma.WorkshopAttendeeScalarFieldEnum>,
  boolean
> = {
  id: true,
  created: true,
  updated: true,
  beneficiary_id: true,
  type: true,
  attendance: true,
  workshop_external_attendee_id: true,
  workshop_id: true,
  list_type: true,
  payment_amount: true,
  payment_received: true,
  // -- BEGIN ANONYMIZED
  comment: false
}

const configWorkshopExternalAttendee: Record<
  SnakeCase<keyof typeof Prisma.WorkshopExternalAttendeeScalarFieldEnum>,
  boolean
> = {
  id: true,
  created: true,
  updated: true,
  is_anonymized: true,
  city: true,
  gender: true
  // -- BEGIN ANONYMIZED
  // first_name: false,
  // last_name: false,
  // email: false,
  // phone: false,
  // birth_date: false
}

const configUserActivity: Record<
  SnakeCase<keyof typeof Prisma.UserActivityScalarFieldEnum>,
  boolean
> = {
  id: true,
  user_id: true,
  structure_id: true,
  date: true,
  key: true,
  object: true,
  object_id: true,
  activity: true
  // -- BEGIN ANONYMIZED
  // content: false,
  // diff: false
}

const configNotification: Record<
  SnakeCase<keyof typeof Prisma.NotificationScalarFieldEnum>,
  boolean
> = {
  id: true,
  created: true,
  recipient_id: true,
  structure_id: true,
  beneficiary_id: true,
  social_support_id: true,
  support_program_id: true,
  item_created_by_id: true,
  document_id: true,
  comment_id: true,
  archive_date: true,
  read: true,
  read_at: true,
  type: true,
  // -- BEGIN ANONYMIZED
  // detail: false
}

const configBudgetIncome: Record<
  SnakeCase<keyof typeof Prisma.BudgetIncomeScalarFieldEnum>,
  boolean
> = {
  id: true,
  created: true,
  updated: true,
  salary: true,
  prime_activite: true,
  retirement: true,
  alimony: true,
  disability: true,
  unemployment: true,
  ass: true,
  rsa: true,
  apl: true,
  family: true,
  aah: true,
  aspa: true,
  daily_allowance: true,
  annuity: true,
  other: true,
  type: true,
  beneficiary_id: true,
  relationship: true,
  budget_id: true
  // -- BEGIN ANONYMIZED
  // first_name: false,
  // last_name: false
}

const configBudgetIncomeCustom: Record<
  SnakeCase<keyof typeof Prisma.BudgetIncomeCustomScalarFieldEnum>,
  boolean
> = {
  id: true,
  created: true,
  updated: true,
  type: true,
  amount: true,
  income_id: true
}

const configBudgetExpenses: Record<
  SnakeCase<keyof typeof Prisma.BudgetExpensesScalarFieldEnum>,
  boolean
> = {
  id: true,
  created: true,
  updated: true,
  rent: true,
  expenses: true,
  water: true,
  electricity: true,
  gas: true,
  fuel_or_other: true,
  housing_tax: true,
  property_tax: true,
  income_tax: true,
  car_insurance: true,
  home_insurance: true,
  death_insurance: true,
  retirement_insurance: true,
  other_insurance: true,
  remitted_alimony: true,
  health_insurance: true,
  phone_internet: true,
  school_fees: true,
  school_canteen: true,
  other: true,
  budget_id: true
}

const configBudgetExpensesLoan: Record<
  SnakeCase<keyof typeof Prisma.BudgetExpensesLoanScalarFieldEnum>,
  boolean
> = {
  id: true,
  created: true,
  updated: true,
  type: true,
  amount_total: true,
  amount_per_month: true,
  due_date: true,
  expenses_id: true
}

const configBudgetExpensesDebt: Record<
  SnakeCase<keyof typeof Prisma.BudgetExpensesDebtScalarFieldEnum>,
  boolean
> = {
  id: true,
  created: true,
  updated: true,
  type: true,
  amount_total: true,
  amount_per_month: true,
  due_date: true,
  expenses_id: true
}

const configBudgetExpensesCustom: Record<
  SnakeCase<keyof typeof Prisma.BudgetExpensesCustomScalarFieldEnum>,
  boolean
> = {
  id: true,
  created: true,
  updated: true,
  type: true,
  amount: true,
  expenses_id: true
}

const configBudget: Record<
  SnakeCase<keyof typeof Prisma.BudgetScalarFieldEnum>,
  boolean
> = {
  id: true,
  created: true,
  updated: true,
  legacy_main_income_source: true,
  legacy_main_income_amount: true,
  legacy_partner_main_income_source: true,
  legacy_partner_main_income_amount: true,
  legacy_major_children_main_income_source: true,
  legacy_major_children_main_income_amount: true,
  legacy_other_members_main_income_source: true,
  legacy_other_members_main_income_amount: true,
  legacy_remaining_after_expenses: true,
  number_household_members: true,
  savings: true,
  overdraft: true,
  family_quotient: true,
  banque_de_france: true,
  family_file_id: true
}

const configExternalAccount: Record<
  SnakeCase<keyof typeof Prisma.ExternalAccountScalarFieldEnum>,
  boolean
> = {
  id: true,
  created: true,
  updated: true,
  user_id: true,
  provider: true
  // -- BEGIN ANONYMIZED
  // provider_account_id: false,
  // refresh_token: false,
  // access_token: false,
  // expires_at: false,
  // scope: false,
  // id_token: false,
  // session_state: false
}

const configRedirection: Record<
  SnakeCase<keyof typeof Prisma.SocialSupportRedirectionScalarFieldEnum>,
  boolean
> = {
  id: true,
  type: true,
  created_at: true,
  social_support_id: true,
  external_structure_name: true,
  partner_organization_id: true,
  partner_organization_contact_id: true,
  redirection_reason_id: true
}

const configRedirectionReason: Record<
  SnakeCase<keyof typeof Prisma.RedirectionReasonScalarFieldEnum>,
  boolean
> = {
  id: true,
  name: true,
  structure_id: true,
  created_by_id: true,
  created_at: true
}

const configMinister: Record<
  SnakeCase<keyof typeof Prisma.MinisterEntityScalarFieldEnum>,
  boolean
> = {
  id: true,
  first_name: true,
  last_name: true,
  function: true,
  government: true,
  status: true,
  created: true,
  updated: true
}

const configSupportProgramName: Record<
  SnakeCase<keyof typeof Prisma.SupportProgramNameScalarFieldEnum>,
  boolean
> = {
  id: true,
  name: true,
  has_lifecycle: true,
  structure_id: true,
  created_by_id: true,
  updated_at: true,
  created_at: true
}

const configSupportProgram: Record<
  SnakeCase<keyof typeof Prisma.SupportProgramScalarFieldEnum>,
  boolean
> = {
  id: true,
  beneficiary_id: true,
  support_program_name_id: true,
  start_date: true,
  end_date: true,
  exit_reason_id: true,
  created_at: true,
  updated_at: true,
  outcome: true
}

const configSupportProgramExitReason: Record<
  SnakeCase<keyof typeof Prisma.SupportProgramExitReasonScalarFieldEnum>,
  boolean
> = {
  id: true,
  name: true,
  structure_id: true,
  created_by_id: true,
  created_at: true
}

const configPartnerOrganizationToSupportProgram = {
  A: true,
  B: true
} as Record<'A' | 'B', boolean>

const configDataEducationSchool: Record<
  SnakeCase<keyof typeof Prisma.DataEducationSchoolScalarFieldEnum>,
  boolean
> = {
  uai: true,
  name: true,
  type: true,
  nature: true,
  address: true,
  zipcode: true,
  city: true,
  citycode: true,
  department: true,
  region: true,
  academy: true,
  status: true,
  latitude: true,
  longitude: true,
  rep_classification: true,
  qpv_code: true,
  qpv_name: true,
  qpv_revised: true,
  created: true,
  updated: true,
  last_imported_at: true
}

export const CONFIG = {
  user: configUser,
  structure: configStructure,
  structure_type_survey: configStructureTypeSurvey,
  family_file: configFamilyFile,
  followup_type: configSubject,
  beneficiary: configBeneficiary,
  beneficiary_contributing_partner: configBeneficiaryContributingPartner,
  document: configDocument,
  _family_file_referents: configFamilyFileToReferent,
  social_support: configSocialSupport,
  _document_to_social_support: configDocumentToSocialSupport,
  _social_support_to_followup_type: configSocialSupportToFollowupType,
  partner_organization: configPartnerOrganization,
  partner_organization_contact: configPartnerOrganizationContact,
  followup: configFollowup,
  file_instruction: configFileInstruction,
  help_request: configHelpRequest,
  housing_help_request: configHousingHelpRequest,
  account: configAccount,
  beneficiary_relative: configBeneficiaryRelative,
  archived_beneficiary: configArchivedBeneficiary,
  cgu_history: configCGUHistory,
  workshop: configWorkshop,
  workshop_name: configWorkshopName,
  workshop_attendee: configWorkshopAttendee,
  workshop_external_attendee: configWorkshopExternalAttendee,
  user_activity: configUserActivity,
  notification: configNotification,
  budget: configBudget,
  budget_income: configBudgetIncome,
  budget_income_custom: configBudgetIncomeCustom,
  budget_expenses: configBudgetExpenses,
  budget_expenses_loan: configBudgetExpensesLoan,
  budget_expenses_debt: configBudgetExpensesDebt,
  budget_expenses_custom: configBudgetExpensesCustom,
  external_account: configExternalAccount,
  social_support_redirection: configRedirection,
  redirection_reason: configRedirectionReason,
  minister: configMinister,
  support_program_name: configSupportProgramName,
  support_program_exit_reason: configSupportProgramExitReason,
  support_program: configSupportProgram,
  _partner_organization_to_support_program:
    configPartnerOrganizationToSupportProgram,
  data_education_school: configDataEducationSchool
}

export type TableName = keyof typeof CONFIG

export const TABLE_NAMES = Object.keys(CONFIG) as TableName[]
