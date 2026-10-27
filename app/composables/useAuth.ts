import { headerAllowlist } from '~/utils/api/header-allowlist'
import { useAuthState } from './useAuthState'

export function useAuth() {
  const state = useAuthState()
  const { application, reset } = usePermissions()
  const {
    public: {
      auth: { cookieKey }
    }
  } = useRuntimeConfig()

  function logout() {
    state.user.value = null
    reset()
  }

  function refreshToken() {
    return $fetch('/api/auth/refresh-token')
  }

  async function getSession() {
    // During SSR, no need to call /api/auth/get-session if no session cookie
    if (useRequestEvent() && !useCookie(cookieKey).value) {
      return
    }
    // The in-process SSR call bypasses nginx: forward x-real-ip so the rate
    // limiter keys it on the client instead of a bucket shared by every render
    const session = await $fetch('/api/auth/get-session', {
      headers: headerAllowlist()
    })
    if (session) {
      state.user.value = session.user
      application.value = session.permissions
    }
  }

  function setCGUVersion(version: string) {
    if (!state.user.value) {
      return
    }
    state.user.value.CGUHistoryVersion = version
  }

  function setStructureTypeSurveyFilled() {
    if (!state.user.value) {
      return
    }
    state.user.value.structureTypeSurveyFilled = true
  }

  return {
    logout,
    refreshToken,
    getSession,
    setCGUVersion,
    setStructureTypeSurveyFilled
  }
}
