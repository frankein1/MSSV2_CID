import { z } from 'zod'
import { SurveySocialSupportType, SurveyStructureType } from '@prisma/client'
import { requiredNativeEnum, stringConstraint } from '../helpers.schema'
import { maxStringLengthMessage, requiredErrorMessage } from '~/utils/zod'

export const submitStructureTypeSurveySchema = z
  .object({
    structureType: requiredNativeEnum(SurveyStructureType),
    structureTypeOther: stringConstraint
      .max(255, maxStringLengthMessage(255))
      .nullish(),
    socialSupportTypes: z
      .array(z.nativeEnum(SurveySocialSupportType), {
        required_error: 'Veuillez sélectionner au moins un type de suivi.'
      })
      .min(1, 'Veuillez sélectionner au moins un type de suivi.')
  })
  .superRefine((data, ctx) => {
    if (
      data.structureType === SurveyStructureType.Autre &&
      !data.structureTypeOther
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: requiredErrorMessage,
        path: ['structureTypeOther']
      })
    }
  })
  .transform(data => ({
    ...data,
    structureTypeOther:
      data.structureType === SurveyStructureType.Autre
        ? data.structureTypeOther
        : null
  }))

export type SubmitStructureTypeSurveyInput = z.infer<
  typeof submitStructureTypeSurveySchema
>
