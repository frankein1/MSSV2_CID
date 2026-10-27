import { routes } from '~/utils/routes'

/**
 * Propose the structure type survey when the app is loaded on the dashboard
 * (e.g. right after login). Unlike the CGU, the survey does not block the app:
 * client-side navigations are never redirected, so the user can skip it.
 */
export default defineNuxtRouteMiddleware(to => {
  const nuxtApp = useNuxtApp()
  const isAppLoad = import.meta.server || nuxtApp.isHydrating
  const isHomePage =
    to.path === routes.user.App.path() ||
    to.path === routes.user.AppOverview.path()
  if (!isAppLoad || !isHomePage) {
    return
  }

  const { application } = usePermissions()
  const { user } = useAuthState()
  if (
    application.value.edit.structureTypeSurvey &&
    !user.value?.structureTypeSurveyFilled
  ) {
    return navigateTo(routes.structure.AppStructureTypeSurvey.path())
  }
})
