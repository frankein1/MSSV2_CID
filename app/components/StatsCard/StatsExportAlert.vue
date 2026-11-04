<template>
  <div class="export-alert">
    <AtomAlert
      :alert-type="AlertType.Success"
      :message="alertContent"
    />
  </div>
</template>

<script lang="ts" setup>
  import { AlertType } from '~/utils/constants/alert'

  const alertContent = ref<string>(
    'Export en cours... Le téléchargement peut prendre plusieurs secondes avant de démarrer.'
  )
</script>

<style lang="scss" scoped>
  .export-alert {
    z-index: 1500;
    position: fixed;
    right: 0;
    bottom: 0;
    margin: 2rem;
  }
</style>
