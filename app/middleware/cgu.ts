import { routes } from '~/utils/routes'
import { isDefaultRedirect } from '~/utils/isDefaultRedirect'

export default defineNuxtRouteMiddleware(to => {
  const authState = useAuthState()
  if (!authState.isAuthenticated()) {
    const redirectUrl = isDefaultRedirect(to.fullPath) ? undefined : to.fullPath
    return navigateTo({
      path: routes.auth.AuthLogin.path(),
      query: { redirectUrl }
    })
  }
  // const {
  //   public: { cguVersion }
  // } = useRuntimeConfig()
  // const { status, latestVersionAccepted } = authState.hasAcceptedCgu(cguVersion)
  // if (!status) {
  //   const showSummary = latestVersionAccepted !== null
  //   if (authState.isStructureManager()) {
  //     return navigateTo(routes.cgu.CGUManager.path({ showSummary }))
  //   }
  //   return navigateTo(routes.cgu.CGUUser.path({ showSummary }))
  // }
})
