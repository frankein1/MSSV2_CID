import { z } from 'zod'
import dayjs from 'dayjs'
import {
  BeneficiaryStatus,
  SocialSupportStatus,
  FollowupMedium,
  UserRole,
  DocumentType,
  EmailStatus,
  FileInstructionType,
  BeneficiaryMinistereDepartementServiceAc,
  BeneficiaryMinistereStructure
} from '@prisma/client'
import {
  kindOfBooleanSchema,
  stringConstraint,
  withEmptyValueOptionalNativeEnum
} from './helpers.schema'
import { maxStringLengthMessage, validIntNumber } from '~/utils/zod'
import { TypeSuivi, AgeGroup } from '~~/client/options'
import { StatPeriodFilter } from '~~/types/stat'
import { FollowupPeriodFilter } from '~~/types/followup'
import {
  FilterBeneficiaryNotFilled,
  FilterFollowupNotFilled,
  FilterWorkshopTimeDirection
} from '~/utils/constants/filters'
import { WorkshopPeriodFilter } from '~~/types/workshop'

const statFilterOptionsInputSchema = z
  .object({
    structureIds: z.array(z.string().uuid()).nullish()
  })
  .optional()
  .default({})

type StatFilterOptionsInput = z.infer<typeof statFilterOptionsInputSchema>

const statFilterSchema = z
  .object({
    structureIds: z.array(z.string().uuid()).nullish(),
    helpRequestSubject: withEmptyValueOptionalNativeEnum(FileInstructionType),
    period: withEmptyValueOptionalNativeEnum(StatPeriodFilter),
    fromDate: z.coerce.date().nullish(),
    toDate: z.coerce
      .date()
      .nullish()
      .transform(v => {
        if (v === undefined || v === null) {
          return v
        }
        return dayjs(v).hour(23).minute(59).second(59).toDate()
      }),
    socialSupportSubjects: z.array(z.string().uuid()).nullish(),
    cities: z
      .array(stringConstraint.max(50, maxStringLengthMessage(50)))
      .nullish(),
    employers: z
      .array(stringConstraint.max(50, maxStringLengthMessage(50)))
      .nullish(),
    schoolUai: z
      .array(stringConstraint.max(50, maxStringLengthMessage(50)))
      .nullish(),
    referent: stringConstraint.max(100, maxStringLengthMessage(100)).nullish(),
    ministerId: z.array(z.string().uuid()).nullish(),
    ministereDepartementServiceAc: z
      .nativeEnum(BeneficiaryMinistereDepartementServiceAc)
      .nullish(),
    ministereStructure: z.nativeEnum(BeneficiaryMinistereStructure).nullish(),
    createdById: z.array(z.string().uuid()).nullish(),
    supportProgramNameIds: z.array(z.string().uuid()).nullish(),
    beneficiaryStatus: z.nativeEnum(BeneficiaryStatus).nullish(),
    qpv: kindOfBooleanSchema(),
    ageGroup: z.nativeEnum(AgeGroup).nullish(),
    fromAge: z.coerce
      .number()
      .int(validIntNumber)
      .gte(0, 'Veuillez entrer un nombre supérieur ou égal à 0.')
      .nullish(),
    toAge: z.coerce
      .number()
      .int(validIntNumber)
      .gte(0, 'Veuillez entrer un nombre supérieur ou égal à 0.')
      .nullish()
  })
  .superRefine((data, ctx) => {
    if (
      data.fromAge != null &&
      data.toAge != null &&
      data.fromAge > data.toAge
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'âge maximum doit être supérieur ou égal à l'âge minimum.",
        path: ['toAge']
      })
    }
  })
  .superRefine((data, ctx) => {
    if (data.fromAge === 0 && data.toAge === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Veuillez entrer un nombre supérieur à 0.',
        path: ['toAge']
      })
    }
  })
  .superRefine((data, ctx) => {
    if (data.toAge && data.toAge >= dayjs().year()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Âge maximum invalide.',
        path: ['toAge']
      })
    }
  })

const workshopStatFilterSchema = z.object({
  period: withEmptyValueOptionalNativeEnum(StatPeriodFilter),
  fromDate: z.coerce.date().nullish(),
  toDate: z.coerce
    .date()
    .nullish()
    .transform(v => {
      if (v === undefined || v === null) {
        return v
      }
      return dayjs(v).hour(23).minute(59).second(59).toDate()
    }),
  workshopNameIds: z.array(z.string().uuid()).optional(),
  partnerOrganizationIds: z.array(z.string().uuid()).optional()
})

type WorkshopStatFilterInput = z.infer<typeof workshopStatFilterSchema>

const supportProgramStatFilterSchema = z.object({
  period: withEmptyValueOptionalNativeEnum(StatPeriodFilter),
  fromDate: z.coerce.date().nullish(),
  toDate: z.coerce
    .date()
    .nullish()
    .transform(v => {
      if (v === undefined || v === null) {
        return v
      }
      return dayjs(v).hour(23).minute(59).second(59).toDate()
    }),
  supportProgramNameIds: z.array(z.string().uuid()).nullish()
})

type SupportProgramStatFilterInput = z.infer<
  typeof supportProgramStatFilterSchema
>

type StatFilterInput = Omit<
  z.infer<typeof statFilterSchema>,
  'helpRequestSubject'
> & {
  helpRequestSubject?:
    z.infer<typeof statFilterSchema>['helpRequestSubject'] | ''
}

const beneficiaryFilterSchema = z
  .object({
    search: stringConstraint.max(50, maxStringLengthMessage(50)).nullish(),
    socialSupportSubjects: z.array(z.string().uuid()).nullish(),
    referents: z.array(z.string().uuid()).nullish(),
    status: z.nativeEnum(BeneficiaryStatus).nullish(),
    ageGroup: z.nativeEnum(AgeGroup).nullish(),
    fromAge: z.coerce
      .number()
      .int(validIntNumber)
      .gte(0, 'Veuillez entrer un nombre supérieur ou égal à 0.')
      .nullish(),
    toAge: z.coerce
      .number()
      .int(validIntNumber)
      .gte(0, 'Veuillez entrer un nombre supérieur ou égal à 0.')
      .nullish(),
    ministereDepartementServiceAc: z
      .nativeEnum(BeneficiaryMinistereDepartementServiceAc)
      .nullish(),
    ministereStructure: z.nativeEnum(BeneficiaryMinistereStructure).nullish(),
    vulnerablePerson: z
      .string()
      .nullish()
      .transform(val => (val ? val === 'true' : undefined)),
    qpv: z
      .string()
      .nullish()
      .transform(val => (val ? val === 'true' : undefined)),
    notFilled: z.nativeEnum(FilterBeneficiaryNotFilled).nullish(),
    supportProgramNameIds: z.array(z.string().uuid()).nullish()
  })
  .superRefine((data, ctx) => {
    if (
      data.fromAge != null &&
      data.toAge != null &&
      data.fromAge > data.toAge
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'âge maximum doit être supérieur ou égal à l'âge minimum.",
        path: ['toAge']
      })
    }
  })
  .superRefine((data, ctx) => {
    if (data.fromAge === 0 && data.toAge === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Veuillez entrer un nombre supérieur à 0.',
        path: ['toAge']
      })
    }
  })
  .superRefine((data, ctx) => {
    if (data.toAge && data.toAge >= dayjs().year()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Âge maximum invalide.',
        path: ['toAge']
      })
    }
  })

type BeneficiaryFilterInput = z.input<typeof beneficiaryFilterSchema>
type BeneficiaryFilterServerInput = z.output<typeof beneficiaryFilterSchema>

const beneficiaryDocumentFilterSchema = z.object({
  type: z.nativeEnum(DocumentType).nullish(),
  tags: stringConstraint.max(100, maxStringLengthMessage(100)).nullish(),
  beneficiaryId: z.string().uuid().nullish()
})

type BeneficiaryDocumentFilterInput = z.infer<
  typeof beneficiaryDocumentFilterSchema
>

const followupFilterSchema = z.object({
  status: z.nativeEnum(SocialSupportStatus).nullish(),
  medium: z.array(z.nativeEnum(FollowupMedium)).nullish(),
  socialSupportSubjects: z.array(z.string().uuid()).nullish(),
  createdById: z.array(z.string().uuid()).nullish(),
  period: withEmptyValueOptionalNativeEnum(FollowupPeriodFilter),
  fromDate: z.coerce.date().nullish(),
  toDate: z.coerce
    .date()
    .nullish()
    .transform(v => {
      if (v === undefined || v === null) {
        return v
      }
      return dayjs(v).hour(23).minute(59).second(59).toDate()
    }),
  ministerId: z.array(z.string().uuid()).nullish(),
  ministereDepartementServiceAc: z
    .nativeEnum(BeneficiaryMinistereDepartementServiceAc)
    .nullish(),
  ministereStructure: z.nativeEnum(BeneficiaryMinistereStructure).nullish(),
  notFilled: z.nativeEnum(FilterFollowupNotFilled).nullish()
})

type FollowupFilterInput = z.infer<typeof followupFilterSchema>

const familyFileHistoryFilterSchema = z.object({
  status: z.nativeEnum(SocialSupportStatus).nullish(),
  typeSuivi: z.nativeEnum(TypeSuivi).nullish(),
  medium: z.array(z.nativeEnum(FollowupMedium)).nullish(),
  socialSupportSubjects: z.array(z.string().uuid()).nullish(),
  examinationDate: z.coerce.date().nullish(),
  handlingDate: kindOfBooleanSchema(),
  externalStructure: kindOfBooleanSchema(),
  referents: z.array(z.string().uuid()).nullish(),
  beneficiaryId: z.string().uuid().nullish() // exemple
})

const socialSupportFilterSchema = z.object({
  medium: z.array(z.nativeEnum(FollowupMedium)).optional(),
  socialSupportSubjects: z.array(z.string().uuid()).optional(),
  status: z.nativeEnum(SocialSupportStatus).optional(),
  typeSuivi: z.nativeEnum(TypeSuivi).optional(),
  beneficiaryId: z.string().uuid().optional(),
  supportProgramNameIds: z.array(z.string().uuid()).optional()
})

type SocialSupportFilterInput = z.infer<typeof socialSupportFilterSchema>

type FamilyFileHistoryFilterInput = z.infer<
  typeof familyFileHistoryFilterSchema
>

const userAdminFilterSchema = z.object({
  role: z.nativeEnum(UserRole).nullish()
})

type UserAdminFilterInput = z.infer<typeof userAdminFilterSchema>

const emailAdminFilterSchema = z.object({
  status: z.nativeEnum(EmailStatus).nullish()
})

type EmailAdminFilterInput = z.infer<typeof emailAdminFilterSchema>

const workshopFilterSchema = z.object({
  timeDirection: z.nativeEnum(FilterWorkshopTimeDirection).optional(),
  workshopNameIds: z.array(z.string().uuid()).optional(),
  period: withEmptyValueOptionalNativeEnum(WorkshopPeriodFilter),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional()
})

type WorkshopFilterInput = z.infer<typeof workshopFilterSchema>

export {
  statFilterOptionsInputSchema,
  statFilterSchema,
  beneficiaryFilterSchema,
  followupFilterSchema,
  familyFileHistoryFilterSchema,
  userAdminFilterSchema,
  beneficiaryDocumentFilterSchema,
  emailAdminFilterSchema,
  workshopFilterSchema,
  workshopStatFilterSchema,
  supportProgramStatFilterSchema,
  socialSupportFilterSchema
}

export type {
  StatFilterOptionsInput,
  StatFilterInput,
  BeneficiaryFilterInput,
  BeneficiaryFilterServerInput,
  FollowupFilterInput,
  FamilyFileHistoryFilterInput,
  UserAdminFilterInput,
  BeneficiaryDocumentFilterInput,
  EmailAdminFilterInput,
  WorkshopFilterInput,
  WorkshopStatFilterInput,
  SupportProgramStatFilterInput,
  SocialSupportFilterInput
}
