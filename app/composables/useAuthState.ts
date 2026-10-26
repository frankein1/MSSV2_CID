import { UserRole, UserStatus } from '@prisma/client'
import type { StructureType } from '@prisma/client'
import { formatUserDisplayName } from '~/utils/user'

export type UserProfile = {
  id: string
  lastName: string
  firstName: string
  email: string
  role: UserRole
  status: UserStatus
  structureId: string | null
  structureType: StructureType | null
  CGUHistoryVersion: string | null
  structureTypeSurveyFilled: boolean
}

export function useAuthState() {
  const user = useState<UserProfile | undefined | null>(
    'auth:state',
    () => undefined
  )

  const role = computed(() => {
    return user.value ? user.value.role : null
  })

  const status = computed(() => {
    return user.value ? user.value.status : null
  })

  function getUserName() {
    return user.value ? formatUserDisplayName(user.value) : ''
  }

  const getUserId = computed(() => (user.value ? user.value.id : undefined))

  function isAuthenticated() {
    return !!user.value
  }
  function isReferent(): boolean {
    return role.value === UserRole.Referent
  }
  function isAdmin(): boolean {
    return role.value === UserRole.Administrator
  }
  function isStructureManager(): boolean {
    return role.value === UserRole.StructureManager
  }
  function isReceptionAgent(): boolean {
    return role.value === UserRole.ReceptionAgent
  }
  function isActive() {
    return status.value === UserStatus.Active
  }

  function hasAcceptedCgu(cguVersion: string) {
    if (!user.value) {
      return { status: false, latestVersionAccepted: null }
    }
    return {
      status: user.value.CGUHistoryVersion === cguVersion,
      latestVersionAccepted: user.value.CGUHistoryVersion
    }
  }

  /** Structure managers must fill the structure type survey before accessing the app */
  function mustFillStructureTypeSurvey() {
    return isStructureManager() && !user.value?.structureTypeSurveyFilled
  }

  return {
    user,
    isAuthenticated,
    isReferent,
    isAdmin,
    isActive,
    isStructureManager,
    isReceptionAgent,
    getUserName,
    getUserId,
    hasAcceptedCgu,
    mustFillStructureTypeSurvey
  }
}
