import type { Prisma } from '@prisma/client'
import { createQuery } from '~~/server/route'
import type { GetNotificationsInput } from '~~/server/schema'
import { getNotificationsSchema } from '~~/server/schema'
import type { ProtectedAppContext } from '~~/server/trpc'
import { AllowSecurityCheck } from '~~/server/security/rules/types'
import { NotificationRepo } from '~~/server/database'
import { takeAndSkipFromPagination } from '~/utils/table'
import { notificationTypeKeys } from '~~/client/options'
import { getDescription, getDescriptionHint, notificationSelect } from './utils'

const handler = async ({
  ctx: { user },
  input: { onlyUnread, types, perPage, page }
}: {
  ctx: ProtectedAppContext
  input: GetNotificationsInput
}) => {
  const { take, skip } = takeAndSkipFromPagination({ perPage, page })

  const where: Prisma.NotificationWhereInput = {}

  if (onlyUnread) {
    where.readAt = null
  }
  if (types?.length) {
    where.type = { in: types }
  }

  const [notifications, totalCount] = await Promise.all([
    NotificationRepo.findMany(user, {
      where,
      select: notificationSelect,
      orderBy: {
        created: 'desc'
      },
      take,
      skip
    }),
    NotificationRepo.count(user, { where })
  ])

  const formatNotifications = notifications.map(n => ({
    id: n.id,
    documentId: n.documentId,
    socialSupportId: n.socialSupportId,
    supportProgramId: n.supportProgramId,
    type: n.type,
    beneficiary: n.beneficiary,
    created: n.created,
    readAt: n.readAt,
    title: notificationTypeKeys.byKey[n.type],
    description: getDescription(n),
    descriptionHint: getDescriptionHint(n),
    detail: null // ANONYMIZED: detail and comment.content removed
  }))

  return { notifications: formatNotifications, totalCount }
}

export const getNotificationsQuery = createQuery({
  handler,
  inputValidation: getNotificationsSchema,
  securityCheck: AllowSecurityCheck
})

type GetNotificationOutput = Prisma.PromiseReturnType<typeof handler>
export type NotificationItem = GetNotificationOutput['notifications'][number]
