import { z } from 'zod'
import { createHousingHelpRequestSchemaBase } from './createHousingHelpRequest.schema'

export const editHousingHelpRequestSchema = createHousingHelpRequestSchemaBase
  .extend({
    id: z.string().uuid()
  })
  .superRefine((data, ctx) => {
    if (data.isMinistry && !data.ministerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Veuillez renseigner ce champ.',
        path: ['ministerId']
      })
    }
  })

export type EditHousingHelpRequestInput = z.infer<
  typeof editHousingHelpRequestSchema
>
