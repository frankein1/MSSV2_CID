<template>
  <NuxtPage />
</template>

<script setup lang="ts">
  import { routes } from '~/utils/routes'

  const route = useRoute()

  useHead({
    title: routes.user.App.title
  })

  definePageMeta({
    middleware: ['auth', 'cgu', 'structure-type-survey']
  })

  onMounted(() => {
    if (route.path === routes.user.App.path()) {
      navigateTo(routes.user.AppOverview.path())
    }
  })
</script>
