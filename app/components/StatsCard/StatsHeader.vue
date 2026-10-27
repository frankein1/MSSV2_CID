<template>
  <div class="header">
    <div class="header-title">
      <slot name="icon"></slot>
      <slot name="header"></slot>
      <div class="color--primary">
        <slot name="title"></slot>
      </div>
    </div>
    <AtomDropdownDisclosure
      v-if="menus.length > 0"
      label="Exporter les statistiques"
      :menus="menus"
      dropdown-btn-class="fr-btn--tertiary-no-outline"
      :align-right="true"
    />
  </div>
</template>
<script lang="ts" setup>
  import type { MenuItem } from '~~/types/menu'

  defineProps<{
    menus: MenuItem[]
  }>()
</script>

<style lang="scss" scoped>
  @use '@gouvfr/dsfr/src/module/media-query' as dsfr-media-query;

  .header {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    .header-title {
      display: flex;
      flex-direction: row;
      align-items: center;
    }

    .color--primary {
      color: var(--primary);
    }

    .stats-dropdown {
      margin-left: 0;
    }
  }

  @include dsfr-media-query.respond-from('lg') {
    .header {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }

    .stats-dropdown {
      margin-left: auto;
    }
  }
</style>
