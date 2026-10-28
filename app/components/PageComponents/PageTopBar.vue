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
  </nav>
</template>

<script lang="ts" setup>
  import { routes } from '~/utils/routes'
  import type { MenuItem } from '~~/types/menu'

  const { getUserName } = useAuthState()

  // Review app (Pilotage territorial): no logout entry and no
  // DisconnectHandler, since ProConnect logout is broken without an Account
  const menus: MenuItem[] = [
    {
      label: 'Configuration',
      to: routes.structure.AppStructureUsers.path(),
      icon: 'fr-icon-settings-4-line'
    }
  ]
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
