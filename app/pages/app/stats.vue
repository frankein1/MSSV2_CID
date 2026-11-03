<template>
  <PageContainer no-max-width>
    <AtomBreadcrumb :links="breadcrumbs.stats.AppStats()" />
    <PageTitle :title="title" />
    <div class="fr-grid-row fr-grid-row--gutters">
      <div class="fr-col-12">
        <AtomAlert
          v-if="fetchError"
          :alert-type="AlertType.Error"
          :message="fetchError"
          class="fr-mb-4v"
        />
        <AtomRouteTabs
          :model-value="activeTab"
          class="stats-tabs"
          tab-list-name="Statistiques de la structure"
          :tab-titles="tabTitles"
          :heading-level="2"
          @update:model-value="onTabChange"
        >
          <NuxtPage
            v-if="
              socialSupportSubjectOptions &&
              beneficiariesCitiesOptions &&
              agentsOptions &&
              supportProgramNameOptions
            "
            :key="route.path"
            :social-support-subject-options="socialSupportSubjectOptions"
            :beneficiaries-cities-options="beneficiariesCitiesOptions"
            :beneficiaries-employers-options="beneficiariesEmployersOptions"
            :agent-options="agentsOptions"
            :support-program-name-options="supportProgramNameOptions"
          />
        </AtomRouteTabs>
      </div>
    </div>
  </PageContainer>
</template>

<script lang="ts" setup>
  import type { MultiStructureConfig } from '~/composables/useMultiStructureStats'
  import { toOptions } from '~/utils/options'
  import { AlertType } from '~/utils/constants/alert'
  import { hasDefinedCity } from '~/utils/beneficiary/hasDefinedCity'
  import { hasDefinedEmployer } from '~/utils/beneficiary/hasDefinedEmployer'
  import { routes } from '~/utils/routes'
  import { breadcrumbs } from '~/utils/breadcrumbs'

  const title = routes.stats.AppStats.title

  useHead({ title })

  const route = useRoute()

  const tabTitles = [
    {
      tabId: 'Beneficiaires',
      panelId: panelId('Beneficiaires'),
      title: 'Bénéficiaires',
      icon: 'fr-icon-user-line',
      to: routes.stats.AppStatsBeneficiaries.path()
    },
    {
      tabId: 'Entretiens',
      panelId: panelId('Entretiens'),
      title: "Synthèses d'entretiens",
      icon: 'fr-icon-draft-line',
      to: routes.stats.AppStatsFollowups.path()
    },
    {
      tabId: 'Instructions',
      panelId: panelId('Instructions'),
      title: 'Instructions de dossiers',
      icon: 'fr-icon-questionnaire-line',
      to: routes.stats.AppStatsFileInstructions.path()
    },
    {
      tabId: 'Ateliers',
      panelId: panelId('Ateliers'),
      title: 'Ateliers',
      icon: 'fr-icon-calendar-line',
      to: routes.stats.AppStatsWorkshops.path()
    },
    {
      tabId: 'ParcoursEtDispositifs',
      panelId: panelId('ParcoursEtDispositifs'),
      title: 'Parcours et dispositifs',
      icon: 'fr-icon-file-user-line',
      to: routes.stats.AppStatsSupportPrograms.path()
    }
  ]

  const activeTab = computed(() =>
    Math.max(
      0,
      tabTitles.findIndex(tab => route.path === tab.to)
    )
  )

  async function onTabChange(index: number) {
    if (!tabTitles[index]) {
      return
    }
    await navigateTo(tabTitles[index].to ?? tabTitles?.[0]?.to)
    await nextTick()
    document.getElementById(tabTitles[index].tabId)?.focus()
  }

  const trpcClient = useTrpcClient()

  // Multi-structure support
  const { data: multiStructureList } =
    await trpcClient.config.getMultiStructureList.useQuery()

  const isMultiStructure = computed(
    () => (multiStructureList.value?.length ?? 0) > 1
  )

  const selectedStructureIds = ref<string[]>(
    multiStructureList.value?.map(s => s.id) ?? []
  )

  const structureOptions = computed(() =>
    toOptions(multiStructureList.value ?? [], 'id', 'name')
  )

  provide<MultiStructureConfig>(multiStructureConfigKey, {
    structureOptions,
    selectedStructureIds,
    isMultiStructure
  })

  const filterOptionsInput = computed(() =>
    isMultiStructure.value && selectedStructureIds.value.length
      ? { structureIds: selectedStructureIds.value }
      : undefined
  )

  const {
    data: socialSupportSubjectOptions,
    error: socialSupportSubjectOptionsError
  } = await trpcClient.structure.getActiveOrUsedSocialSupportSubjects.useQuery(
    filterOptionsInput,
    {
      transform: socialSupportSubject =>
        toOptions(socialSupportSubject, 'id', 'name'),
      queryKey: 'structure.getActiveOrUsedSocialSupportSubjects.options'
    }
  )

  const {
    data: beneficiariesCitiesOptions,
    error: beneficiariesCitiesOptionsError
  } = await trpcClient.config.getBeneficiariesCities.useQuery(
    filterOptionsInput,
    {
      transform: beneficiariesCities => {
        const definedCities = beneficiariesCities.filter(hasDefinedCity)
        return toOptions(definedCities, 'city', 'city')
      }
    }
  )

  const {
    data: beneficiariesEmployersOptions,
    error: beneficiariesEmployersOptionsError
  } = await trpcClient.config.getBeneficiariesEmployers.useQuery(
    filterOptionsInput,
    {
      transform: beneficiariesEmployers => {
        const definedEmployers =
          beneficiariesEmployers.filter(hasDefinedEmployer)
        return toOptions(definedEmployers, 'employer', 'employer')
      }
    }
  )

  // const {
  //   data: beneficiariesSchoolsOptions,
  //   error: beneficiariesSchoolsOptionsError
  // } = await trpcClient.config.getBeneficiariesSchools.useQuery(undefined, {
  //   transform: beneficiariesSchools => {
  //     const renamedSchools = beneficiariesSchools.map(school => ({
  //       name: `${school.name}, ${school.zipcode} ${school.city}`,
  //       uai: school.uai
  //     }))
  //     return toOptions(renamedSchools, 'uai', 'name')
  //   }
  // })

  const { data: agentsOptions, error: agentsOptionsError } =
    await trpcClient.config.getAgents.useQuery(undefined, {
      transform: agents => toOptions(agents, 'id', 'name'),
      queryKey: 'config.getAgents.options'
    })

  const {
    data: supportProgramNameOptions,
    error: supportProgramNameOptionsError
  } = await trpcClient.supportProgram.getActiveNameList.useQuery(
    filterOptionsInput,
    {
      transform: programNames => toOptions(programNames, 'id', 'name'),
      queryKey: 'config.getActiveSupportProgramNameList.options'
    }
  )

  const fetchError = computed(() => {
    if (socialSupportSubjectOptionsError.value) {
      return "La liste des objets d'accompagnement n'a pas pu être chargée."
    }
    if (beneficiariesCitiesOptionsError.value) {
      return "La liste des villes n'a pas pu être chargée."
    }
    if (beneficiariesEmployersOptionsError.value) {
      return "La liste des employeurs n'a pas pu être chargée."
    }
    // if (beneficiariesSchoolsOptionsError.value) {
    //   return "La liste des établissements scolaires n'a pas pu être chargée."
    // }
    if (agentsOptionsError.value) {
      return "La liste des référents n'a pas pu être chargée."
    }
    if (supportProgramNameOptionsError.value) {
      return "La liste des dispositifs ou axes d'intervention n'a pas pu être chargée."
    }
    return ''
  })
</script>

<style scoped lang="scss">
  :deep(.main-container) {
    min-height: 100%;
  }

  /* Tab height computing does not take into account multiselect dropdown height
  A min height is necessary to fully display the multiselect in all cases.
  This is overloaded from tab.scss to take into account the position of the multiselect in
  the stat panel */
  :deep(.fr-tabs__panel) {
    min-height: 36.5rem;
  }

  .stats-tabs {
    height: calc(var(--tabs-height) + 30px);
  }
</style>
