import type { NotificationType, SocialSupportType } from '@prisma/client'

export type NotificationItemType = {
  id: string
  title: string
  type: NotificationType
  description: string
  descriptionHint: string
  readAt?: Date | null
  documentId?: string | null
  socialSupportId?: string | null
  supportProgramId?: string | null
  beneficiary?: {
    id: string
    // ANONYMIZED: firstName, usualName, birthName removed
    archiveDueDate?: Date | null
    familyFile: {
      id: string
    }
  } | null
  socialSupport?: {
    socialSupportType: SocialSupportType
  } | null
  detail?: string | null
  created?: Date | null
  archiveDate?: Date | null
  onClick?: (() => void) | null
}
