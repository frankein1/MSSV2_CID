import { StructureType } from '@prisma/client'
import { z } from 'zod'
import {
  requiredNativeEnum,
  stringConstraint,
  siretConstraint,
  stringOrEmpty,
  phoneConstraint,
  validationCodeConstraint
} from '../helpers.schema'
import {
  errorMessages,
  minStringLengthMessage,
  maxStringLengthMessage,
  validZipcode,
  validEmailMessage
} from '~/utils/zod'
import { submitStructureTypeSurveySchema } from './structureTypeSurvey.schema'

const structureAdminInfoBaseSchema = z.object({
  type: requiredNativeEnum(StructureType),
  inhabitantsNumber: stringConstraint
    .max(50, maxStringLengthMessage(50))
    .nullish(),
  inseeCode: stringConstraint.max(50, maxStringLengthMessage(50)).nullish(),
  siret: stringOrEmpty(siretConstraint),
  name: stringConstraint
    .max(50, maxStringLengthMessage(50))
    .min(2, minStringLengthMessage(2)),
  zipcode: stringConstraint
    .max(10, maxStringLengthMessage(10))
    .min(5, validZipcode),
  city: stringConstraint
    .max(50, maxStringLengthMessage(50))
    .min(2, minStringLengthMessage(2)),
  address: stringConstraint
    .max(100, maxStringLengthMessage(100))
    .min(2, minStringLengthMessage(2)),
  phone: phoneConstraint,
  email: z.string(errorMessages).email(validEmailMessage),
  dpoFirstName: stringConstraint
    .max(50, maxStringLengthMessage(50))
    .min(2, minStringLengthMessage(2)),
  dpoLastName: stringConstraint
    .min(2, minStringLengthMessage(2))
    .max(50, maxStringLengthMessage(50))
    .toUpperCase(),
  dpoEmail: z.string(errorMessages).email(validEmailMessage)
})

// The type survey is mandatory when an administrator creates a structure
export const createStructureSchema = structureAdminInfoBaseSchema.extend({
  typeSurvey: submitStructureTypeSurveySchema
})

export type CreateStructureInput = z.infer<typeof createStructureSchema>

type TypeSurveyFormValues = {
  structureType?: string | null
  structureTypeOther?: string | null
  socialSupportTypes?: string[] | null
}

const isEmptyTypeSurvey = (value: unknown) => {
  if (!value) {
    return true
  }
  const survey = value as TypeSurveyFormValues
  return (
    !survey.structureType &&
    !survey.structureTypeOther &&
    !survey.socialSupportTypes?.length
  )
}

// The type survey is optional when editing a structure, but must be complete once started.
// The form always sends a survey object, so an empty one is treated as missing.
export const structureAdminInfoSchema = structureAdminInfoBaseSchema.extend({
  typeSurvey: z.preprocess(
    value => (isEmptyTypeSurvey(value) ? undefined : value),
    submitStructureTypeSurveySchema.optional()
  )
})

export type StructureAdminInfoInput = z.infer<typeof structureAdminInfoSchema>

export const editStructureAdminInfoSchema = structureAdminInfoSchema.extend({
  id: z.string().uuid()
})

export type EditStructureAdminInfoInput = z.infer<
  typeof editStructureAdminInfoSchema
>

export const adminGetStructuresSchema = z
  .object({
    search: stringConstraint.max(50, maxStringLengthMessage(50)).nullish()
  })
  .optional()

export type AdminGetStructuresInput = z.infer<typeof adminGetStructuresSchema>

export const disableStructureSchema = z.object({
  id: z.string().uuid(),
  code: validationCodeConstraint
})

export type DisableStructureInput = z.infer<typeof disableStructureSchema>
