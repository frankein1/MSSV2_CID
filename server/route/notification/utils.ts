import type { Notification, Prisma, SocialSupport } from '@prisma/client'
import { SocialSupportType } from '@prisma/client'
import dayjs from 'dayjs'
import { formatUTCTimestamp } from '~~/server/utils/formatUTCTimestamp'

export const notificationSelect = {
  id: true,
  type: true,
  created: true,
  readAt: true,
  detail: true,
  archiveDate: true,
  documentId: true,
  socialSupportId: true,
  supportProgramId: true,
  beneficiary: {
    select: {
      id: true,
      // ANONYMIZED firstName, usualName, birthName
      archiveDueDate: true,
      familyFile: {
        select: {
          id: true
        }
      }
    }
  },
  socialSupport: {
    select: {
      socialSupportType: true
    }
  },
  itemCreatedBy: {
    select: {
      id: true
      // ANONYMIZED firstName, lastName
    }
  }
  // comment: {
  //   select: {
  //     id: true
  //     // ANONYMIZED content
  //   }
  // }
} satisfies Prisma.NotificationSelect

export function getDescription(
  notification: Pick<Notification, 'type' | 'created'>
) {
  const created = dayjs(notification.created)
  const dateInAMonth = dayjs(notification.created).add(1, 'month')
  const dateInTwoMonths = dayjs(notification.created).add(2, 'month')

  switch (notification.type) {
    case 'DueDateOneMonth':
      return getDateNotificationDescription(
        dateInAMonth,
        'Échéance dans un mois',
        'Échéance'
      )
    case 'DueDateToday':
      return getDateNotificationDescription(created, 'Échéance')
    case 'EndOfSupport':
      return getDateNotificationDescription(created, 'Fin de prise en charge')
    case 'EndOfSupportOneMonth':
      return getDateNotificationDescription(
        dateInAMonth,
        'Fin de prise en charge'
      )
    case 'NewComment':
      return 'Nouveau commentaire'
    case 'NewDocument':
      return 'Nouveau document'
    case 'NewFileInstructionElement':
      return "Nouveau dossier d'instruction"
    case 'UpdateFileInstructionElement':
      return "Mise à jour dossier d'instruction"
    case 'NewFollowupElement':
      return 'Nouvelle synthèse'
    case 'UpdateFollowupElement':
      return 'Mise à jour synthèse'
    case 'NewSocialSupportSubject':
      return "Ajout d'objet(s) d'accompagnement"
    case 'ArchiveDueToday':
    case 'ArchiveDueOneMonth':
    case 'ArchiveDueSevenDays':
      return 'Gérer le dossier'
    case 'DocumentExpirationToday':
      return getDateNotificationDescription(created, 'Expiration')
    case 'DocumentExpirationOneMonth':
      return getDateNotificationDescription(
        dateInAMonth,
        'Expiration dans un mois',
        'Expiration'
      )
    case 'SupportProgramEndToday':
      return getDateNotificationDescription(created, 'Fin de dispositif')
    case 'SupportProgramEndTwoMonths':
      return getDateNotificationDescription(
        dateInTwoMonths,
        'Fin de dispositif'
      )

    default:
      return ''
  }
}

export function getDescriptionHint(
  notification: Pick<Notification, 'type' | 'created' | 'archiveDate'> & {
    itemCreatedBy: { id: string } | null
    socialSupport: Pick<SocialSupport, 'socialSupportType'> | null
    beneficiary: {
      id: string
      archiveDueDate: Date | null
      familyFile: {
        id: string
      }
    } | null
  }
) {
  // ANONYMIZED: itemCreatedBy no longer has firstName/lastName
  const userName = notification.itemCreatedBy
    ? notification.itemCreatedBy.id.slice(0, 8)
    : ''

  const isFu =
    notification.socialSupport?.socialSupportType === SocialSupportType.Followup
  const archiveDatePassed =
    notification.archiveDate &&
    notification.created &&
    notification.archiveDate.getTime() < notification.created.getTime()
  if (
    (notification.type === 'ArchiveDueToday' ||
      notification.type === 'ArchiveDueOneMonth' ||
      notification.type === 'ArchiveDueSevenDays') &&
    dayjs(notification.beneficiary?.archiveDueDate).isSame(
      dayjs(notification.archiveDate)
    )
  ) {
    return "Ce dossier a été conservé un an supplémentaire après une période d'inactivité."
  }

  switch (notification.type) {
    case 'DueDateOneMonth':
    case 'DueDateToday':
    case 'EndOfSupport':
      return isFu
        ? "sur la synthèse d'entretien"
        : "sur le dossier d'instruction."
    case 'EndOfSupportOneMonth':
      return isFu
        ? "sur la synthèse d'entretien"
        : "sur le dossier d'instruction."
    case 'NewComment':
    case 'NewDocument':
    case 'NewFileInstructionElement':
      return `ajouté par ${userName}`
    case 'UpdateFileInstructionElement':
      return `modifiée par ${userName}`
    case 'NewFollowupElement':
      return `ajoutée par ${userName}`
    case 'UpdateFollowupElement':
      return `modifiée par ${userName}`
    case 'NewSocialSupportSubject':
      return `ajouté(s) par ${userName}`
    case 'ArchiveDueToday':
      return "Dossier sans activité depuis 2 ans\u00A0: suppression prévue aujourd'hui."
    // The planned job for archives due in 1 month can also create notifications
    // for beneficiaries that have already passed their archive date (for example during its first execution)
    case 'ArchiveDueOneMonth':
      return archiveDatePassed
        ? 'Dossier sans activité depuis 2 ans\u00A0: date de supression dépassée.'
        : 'Dossier sans activité depuis 2 ans\u00A0: suppression prévue dans un mois.'
    case 'ArchiveDueSevenDays':
      return 'Dossier sans activité depuis 2 ans\u00A0: suppression prévue dans une semaine.'
    case 'DocumentExpirationToday':
    case 'DocumentExpirationOneMonth':
      return 'sur le document'
    case 'SupportProgramEndToday':
    case 'SupportProgramEndTwoMonths':
      return 'sur le dispositif'
    default:
      return ''
  }
}

export function getDateNotificationDescription(
  date: dayjs.Dayjs,
  label: string,
  pastLabel?: string
) {
  if (date.isSame(dayjs(), 'date')) {
    return `${label} aujourd'hui`
  }
  if (date.isSame(dayjs().subtract(1, 'day'), 'date')) {
    return `${label} hier`
  }
  if (date.isAfter(dayjs(), 'date')) {
    return `${label} le ${formatUTCTimestamp(date.toDate())}`
  }
  return `${pastLabel || label} passée le ${formatUTCTimestamp(date.toDate())}`
}
