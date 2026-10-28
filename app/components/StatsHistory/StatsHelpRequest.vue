<template>
  <div>
    <!-- Filters -->
    <StatsFilters
      v-model:filters="filters"
      :structure-options="structureOptions"
      :social-support-subject-options="socialSupportSubjectOptions"
      :beneficiaries-cities-options="beneficiariesCitiesOptions"
      :beneficiaries-schools-options="beneficiariesSchoolsOptions"
      :support-program-name-options="supportProgramNameOptions"
    />

    <section>
      <h3 class="fr-sr-only">Résultats</h3>
      <StatsHeader
        :menus="[]"
        class="fr-my-2w"
      >
        <template #header>
          <h4 class="fr-sr-only">Nombre d'instructions de dossiers</h4>
        </template>
        <template #icon>
          <AtomicIconHelpRequest :is-big="true" />
        </template>
        <template #title>
          <p class="fr-mb-0 fr-h3 title-blue">
            {{ helpRequestCountLabel }}
          </p>
        </template>
      </StatsHeader>

      <!-- Alert + Loader -->
      <AtomAlert
        v-if="error"
        :alert-type="AlertType.Error"
        message="Le nombre total d'instructions de dossier n'a pas pu être chargé."
      />
      <AtomLoader
        v-if="status === 'pending'"
        class="fr-mx-auto"
      />

      <!-- Cards -->
      <div class="fr-container--no-max">
        <div class="fr-grid-row fr-grid-row--gutters">
          <!-- ROW -->
          <div class="fr-col-12">
            <StatsHelpRequestBeneficiaryNumber
              :beneficiary-total-count="helpRequestBeneficiaryCount"
            />
          </div>

          <!-- ROW -->
          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="cardConfig.subjects.id"
            :card-name="cardConfig.subjects.name"
          >
            <StatsHelpRequestSubject
              :total-count="helpRequestCount"
              :filters="queryFilters"
            />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="cardConfig.redirections.id"
            :card-name="cardConfig.redirections.name"
          >
            <StatsHelpRequestRedirections
              :total-count="helpRequestCount"
              :beneficiary-total-count="helpRequestBeneficiaryCount"
              :filters="queryFilters"
            />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="cardConfig.redirectionReasons.id"
            :card-name="cardConfig.redirectionReasons.name"
          >
            <StatsHelpRequestRedirectionReasons
              :total-count="helpRequestCount"
              :filters="queryFilters"
            />
          </StatsCard>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
  import { AlertType } from '~/utils/constants/alert'
  import type { StatFilterInput } from '~~/server/schema'
  import type { Options } from '~/utils/options'
  import { expandMergedIds, type MergedIds } from '~/utils/crossStructureStats'

  const trpcClient = useTrpcClient()

  const props = withDefaults(
    defineProps<{
      structureOptions?: Options
      mergedIds?: MergedIds
      socialSupportSubjectOptions?: Options
      beneficiariesCitiesOptions?: Options
      beneficiariesSchoolsOptions?: Options
      supportProgramNameOptions?: Options
    }>(),
    {
      structureOptions: () => [],
      mergedIds: () => ({}),
      socialSupportSubjectOptions: () => [],
      beneficiariesCitiesOptions: () => [],
      beneficiariesSchoolsOptions: () => [],
      supportProgramNameOptions: () => []
    }
  )

  const filters = ref<StatFilterInput>({})
  const queryFilters = computed(() =>
    expandMergedIds(filters.value, props.mergedIds)
  )

  const {
    data: historyCounts,
    error,
    status
  } = await trpcClient.crossStructureStat.getHelpRequestCountStats.useQuery(
    queryFilters
  )

  const helpRequestCount = computed(
    () => historyCounts.value?.helpRequests || 0
  )

  const helpRequestBeneficiaryCount = computed(
    () => historyCounts.value?.helpRequestBeneficiaries || 0
  )

  const helpRequestCountLabel = computed(
    () =>
      `${helpRequestCount.value} ${
        helpRequestCount.value > 1
          ? 'Instructions de dossiers'
          : 'Instruction de dossiers'
      }`
  )

  const cardConfig = {
    subjects: {
      id: 'stats-helprequest-subjects',
      name: "Objets d'accompagnement"
    },
    redirections: {
      id: 'stats-helprequest-redirections',
      name: 'Réorientations'
    },
    redirectionReasons: {
      id: 'stats-helprequest-redirection-reasons',
      name: 'Motifs de réorientation'
    }
  }
</script>
