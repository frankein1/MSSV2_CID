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
          <h4 class="fr-sr-only">Nombre d'entretiens</h4>
        </template>
        <template #icon>
          <AtomIconFollowup :is-big="true" />
        </template>
        <template #title>
          <p class="fr-mb-0 fr-h3 title-blue">
            {{ followupCountLabel }}
          </p>
          <p
            v-if="firstFollowupCount > 0"
            class="fr-mb-0"
          >
            <span class="fr-text--sm">
              Dont {{ firstFollowupCountLabel }}.
            </span>
          </p>
        </template>
      </StatsHeader>

      <AtomAlert
        v-if="error"
        :alert-type="AlertType.Error"
        message="Le nombre total d'entretiens n'a pas pu être chargé."
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
            <StatsFollowupBeneficiaryNumber
              :beneficiary-total-count="followupBeneficiaryCount"
            />
          </div>

          <!-- ROW -->
          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="followupCardsConfig.subject.id"
            :card-name="followupCardsConfig.subject.name"
          >
            <StatsFollowupSubject
              :total-count="followupCount"
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
  } = await trpcClient.crossStructureStat.getFollowupCountStats.useQuery(
    queryFilters
  )

  const followupCount = computed(() => historyCounts.value?.followups || 0)

  const followupBeneficiaryCount = computed(
    () => historyCounts.value?.followupBeneficiaries || 0
  )

  const followupCountLabel = computed(
    () =>
      `${followupCount.value} ${
        followupCount.value > 1 ? 'Entretiens' : 'Entretien'
      }`
  )

  const firstFollowupCount = computed(
    () => historyCounts.value?.firstFollowups || 0
  )
  const firstFollowupCountLabel = computed(
    () =>
      `${firstFollowupCount.value} ${
        firstFollowupCount.value > 1
          ? 'premiers entretiens'
          : 'premier entretien'
      }`
  )

  const followupCardsConfig = {
    subject: {
      id: 'stats-followup-subject',
      name: "Objets d'accompagnement"
    }
  }
</script>
