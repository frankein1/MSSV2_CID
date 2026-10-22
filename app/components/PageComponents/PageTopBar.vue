<template>
  <nav
    id="topbar"
    role="navigation"
    class="topbar__container"
    tabindex="-1"
  >
    <AtomDropdownDisclosure
      :label="getUserName()"
      :menus="menus"
      align-right
      class="topbar__menu"
      dropdown-btn-class="fr-btn--sm fr-btn--tertiary-no-outline"
    />
    <client-only>
      <DisconnectHandler />
    </client-only>
  </nav>
</template>

<script lang="ts" setup>
  import { routes, apiRoutes } from '~/utils/routes'
  import type { MenuItem } from '~~/types/menu'

  const { isAuthenticated, getUserName } = useAuthState()

  const menus = computed(() => {
    const menus: MenuItem[] = [
      {
        label: 'Configuration',
        to: routes.structure.AppStructureUsers.path(),
        icon: 'fr-icon-settings-4-line'
      }
    ]

    if (isAuthenticated()) {
      menus.push({
        label: 'Déconnexion',
        href: apiRoutes.proConnect.ApiLogout.path(),
        icon: 'fr-icon-logout-box-r-line'
      })
    }

    return menus
  })
</script>

<style lang="scss" scoped>
  .topbar__container {
    background-color: #fff;
    padding-top: 0.5em;
    padding-bottom: 0.5em;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .topbar__menu {
    margin-right: 2em;
  }
</style>
