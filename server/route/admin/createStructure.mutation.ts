import { DefaultSocialSupportSubject, UserActivityType } from '@prisma/client'
import { createMutation } from '~~/server/route'
import type { CreateStructureInput } from '~~/server/schema'
import { createStructureSchema } from '~~/server/schema'
import type { AdminContext } from '~~/server/trpc'
import { StructureRepo } from '~~/server/database'
import { createEmail } from '~~/server/query'
import { getStructureCreationEmailContent } from '~~/server/email'
import { socialSupportSubjectKeys } from '~~/client/options'
import { createEmailSubject } from '~~/server/email/createEmailSubject'
import { createOrUpdateStructure } from '~~/server/integrations/brevo/service'

const adminHandler = async ({
  ctx,
  input
}: {
  ctx: AdminContext
  input: CreateStructureInput
}) => {
  const keys = Object.keys(DefaultSocialSupportSubject)
  const { typeSurvey, ...structure } = input

  const createdStructure = await StructureRepo.prisma.create({
    data: {
      ...structure,
      typeSurvey: {
        create: {
          ...typeSurvey,
          filledById: ctx.user.id
        }
      },
      socialSupportSubjects: {
        createMany: {
          data: keys.map(key => ({
            default: key as DefaultSocialSupportSubject,
            name: socialSupportSubjectKeys.value(key) || key,
            inactive: true
          }))
        }
      }
    },
    select: {
      id: true
    }
  })

  const config = useRuntimeConfig()
  await createEmail({
    config,
    to: input.email,
    subject: createEmailSubject(
      'Mon Suivi Social - Votre espace a été créé',
      config
    ),
    ...getStructureCreationEmailContent()
  })
  createOrUpdateStructure(createdStructure.id).catch(error => {
    console.error(error)
  })

  return createdStructure
}

export const createStructure = createMutation({
  inputValidation: createStructureSchema,
  adminHandler,
  auditLog: {
    key: 'admin.structure.create',
    target: 'Structure',
    targetId: ({ routeResult }) => {
      return routeResult.id
    },
    action: UserActivityType.CREATE
  }
})
