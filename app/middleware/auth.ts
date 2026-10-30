import { routes } from '~/utils/routes'
import { isDefaultRedirect } from '~/utils/isDefaultRedirect'

export default defineNuxtRouteMiddleware(to => {
  const authState = useAuthState()

  if (import.meta.client) {
    const { $sentry } = useNuxtApp()
    const user = authState.user.value?.id
      ? { id: authState.user.value.id }
      : null
    $sentry?.setUser(user)
  }

  if (!authState.isAuthenticated()) {
    const redirectUrl = isDefaultRedirect(to.fullPath) ? undefined : to.fullPath
    return navigateTo({
      path: routes.auth.AuthLogin.path(),
      query: { redirectUrl }
    })
  }

  if (!authState.isActive()) {
    throw createError({
      statusCode: 403,
      message: 'deactivated user'
    })
  }
  // Review app (Pilotage territorial): every route lands on the panel. CGU
  // pages stay reachable, otherwise the cgu middleware and this one redirect
  // to each other forever.
  const allowedPaths = [
    routes.crossStructure.PilotageTerritorial.path(),
    routes.cgu.CGUUser.path(),
    routes.cgu.CGUManager.path()
  ]
  if (!allowedPaths.includes(to.path)) {
    return navigateTo(useHomePage())
  }
})
