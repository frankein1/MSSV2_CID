import { createQuery } from '~~/server/route'
import { emptySchema } from '~~/server/schema'
import type { ProtectedAppContext } from '~~/server/trpc'
import { AllowSecurityCheck } from '~~/server/security/rules/types'
import { NotificationRepo } from '~~/server/database'
import { notificationTypeKeys } from '~~/client/options'
import { getDescription, getDescriptionHint, notificationSelect } from './utils'
import { NotificationType } from '@prisma/client'

const handler = async ({ ctx: { user } }: { ctx: ProtectedAppContext }) => {
  const res = await NotificationRepo.findMany(user, {
    where: {
      recipientId: user.id,
      type: {
        in: [
          NotificationType.ArchiveDueToday,
          NotificationType.ArchiveDueOneMonth,
          NotificationType.ArchiveDueSevenDays
        ]
      }
    },
    select: notificationSelect,
    orderBy: {
      created: 'desc'
    }
  })

  const formatNotifications = res.map(notif => ({
    ...notif,
    title: notificationTypeKeys.byKey[notif.type],
    description: getDescription(notif),
    descriptionHint: getDescriptionHint(notif),
    detail: null // ANONYMIZED: detail and comment.content removed
  }))
  return formatNotifications
}

export const getArchiveNotificationsQuery = createQuery({
  handler,
  inputValidation: emptySchema,
  securityCheck: AllowSecurityCheck
})
