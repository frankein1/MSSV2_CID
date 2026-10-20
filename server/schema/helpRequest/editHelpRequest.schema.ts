import { z } from 'zod'
import { createHelpRequestSchemaBase } from './createHelpRequest.schema'

export const editHelpRequestSchema = createHelpRequestSchemaBase
  .extend({
    id: z.string().uuid()
  })
  .omit({
    financialSupport: true
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

export type EditHelpRequestInput = z.infer<typeof editHelpRequestSchema>
