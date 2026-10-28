<template>
  <PageContainer no-max-width>
    <PageTitle :title="title" />
  </PageContainer>
</template>

<script setup lang="ts">
  import { routes } from '~/utils/routes'

  const title = routes.crossStructure.PilotageTerritorial.title
  useHead({ title })

  definePageMeta({
    middleware: ['auth', 'cgu']
  })
</script>
