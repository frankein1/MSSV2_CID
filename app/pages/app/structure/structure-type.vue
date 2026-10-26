<template>
  <div class="landing-main-container fr-container fr-mt-5w">
    <NuxtLink
      :to="routes.user.AppOverview.path()"
      class="fr-link fr-icon-arrow-left-line fr-link--icon-left"
    >
      Tableau de bord
    </NuxtLink>
    <h1 class="fr-mt-3w">{{ title }}</h1>
    <DsfrCallout
      title="Demande d’information sur votre structure"
      title-tag="h2"
      content="Afin de permettre à Mon Suivi Social de vous proposer les fonctionnalités les plus adaptées à vos besoins, nous souhaitons mieux identifier votre structure et vos usages. Merci de remplir ces informations pour accéder à votre tableau de bord."
    />
    <StructureTypeSurveyForm />
  </div>
</template>

<script setup lang="ts">
  import { routes } from '~/utils/routes'

  const title = routes.structure.AppStructureTypeSurvey.title
  useHead({ title })

  definePageMeta({
    layout: 'landing',
    hideLandingMenu: true,
    dsfrDefault: true,
    middleware: [
      function () {
        // Only structure managers whose structure has not answered yet can access the survey
        if (!useAuthState().mustFillStructureTypeSurvey()) {
          return navigateTo(useHomePage(), { replace: true })
        }
      }
    ]
  })
</script>
