import { z } from 'zod'
import { addFollowupSchemaBase } from './addFollowup.schema'

export const editFollowupSchema = addFollowupSchemaBase
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

export type EditFollowupInput = z.infer<typeof editFollowupSchema>
