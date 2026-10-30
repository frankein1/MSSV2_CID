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
      :validation-schema="statFilterSchema"
    />

    <section>
      <h3 class="fr-sr-only">Résultats</h3>
      <StatsHeader
        class="fr-my-2w"
        :menus="[]"
      >
        <template #header>
          <h4 class="fr-sr-only">Nombre de bénéficiaires</h4>
        </template>
        <template #icon>
          <img
            class="fr-mr-1w"
            src="~/assets/img/avatar.svg"
            alt=""
          />
        </template>
        <template #title>
          <p class="fr-mb-0 fr-h3 title-blue">
            {{ beneficiaryCountLabel[0] }}
            <template v-if="hasDateFilter">
              <button
                aria-describedby="tooltip-beneficiary-count"
                type="button"
                class="fr-btn--tooltip fr-btn"
              >
                infobulle
              </button>
              <span
                id="tooltip-beneficiary-count"
                class="fr-tooltip fr-placement"
                role="tooltip"
                >Bénéficiaires ayant reçu au moins un accompagnement dans la
                période concernée.
              </span>
            </template>
          </p>
          <p
            v-if="beneficiaryCountLabel[1] && beneficiaryCount?.count"
            class="fr-text--lg fr-mb-0"
          >
            {{ beneficiaryCountLabel[1] }}
          </p>
        </template>
      </StatsHeader>
      <AtomAlert
        v-if="error"
        :alert-type="AlertType.Error"
        message="Le nombre total de bénéficiaires n'a pas pu être chargé."
      />
      <AtomLoader
        v-if="status === 'pending'"
        class="fr-mx-auto"
      />

      <!-- Cards -->
      <div class="fr-container--no-max">
        <div class="fr-grid-row fr-grid-row--gutters">
          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="beneficiariesCardConfig.gender.id"
            :card-name="beneficiariesCardConfig.gender.name"
          >
            <StatsBeneficiariesGender
              :beneficiary-count="beneficiaryCount?.count || 0"
              :filters="queryFilters"
            />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="beneficiariesCardConfig.schoolClass.id"
            :card-name="beneficiariesCardConfig.schoolClass.name"
          >
            <StatsBeneficiariesSchoolClass
              :beneficiary-count="beneficiaryCount?.count || 0"
              :filters="queryFilters"
            />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="beneficiariesCardConfig.repClassification.id"
            :card-name="beneficiariesCardConfig.repClassification.name"
          >
            <StatsBeneficiariesRepClassification
              :beneficiary-count="beneficiaryCount?.count || 0"
              :filters="queryFilters"
            />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="beneficiariesCardConfig.socialSupportCount.id"
            :card-name="beneficiariesCardConfig.socialSupportCount.name"
          >
            <StatsBeneficiariesSocialSupportCount
              :beneficiary-count="beneficiaryCount?.count || 0"
              :filters="queryFilters"
          /></StatsCard>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
  import { AlertType } from '~/utils/constants/alert'
  import type { Options } from '~/utils/options'
  import { statFilterSchema, type StatFilterInput } from '~~/server/schema'
  import { StatPeriodFilter } from '~~/types/stat'
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
    data: beneficiaryCount,
    error,
    status
  } = await trpcClient.crossStructureStat.getBeneficiaryCount.useQuery(
    queryFilters
  )

  const plural = (word: string, q: number, end = 's') =>
    q > 1 ? `${word}${end}` : `${word}`

  const hasDateFilter = computed(
    () =>
      (filters.value.period &&
        filters.value.period !== StatPeriodFilter.Custom) ||
      (filters.value.period === StatPeriodFilter.Custom &&
        (filters.value.fromDate || filters.value.toDate))
  )

  const beneficiaryCountLabel = computed(() => {
    const count = beneficiaryCount.value?.count || 0
    const countNew = beneficiaryCount.value?.new || 0

    if (hasDateFilter.value) {
      return [
        `${count} ${plural('Bénéficiaire', count)} ${plural('accompagné', count)}`,
        `${countNew} ${plural('bénéficiaire', countNew)} ${plural('créé', countNew)} dans la période`
      ]
    }
    return [`${count} ${plural('Bénéficiaire', count)}`]
  })

  const beneficiariesCardConfig = {
    gender: {
      id: 'stats-beneficiaries-gender',
      name: 'Genres'
    },
    schoolClass: {
      id: 'stats-beneficiaries-school-class',
      name: 'Classes fréquentées'
    },
    repClassification: {
      id: 'stats-beneficiaries-rep-classification',
      name: 'Établissements REP fréquentés'
    },
    socialSupportCount: {
      id: 'stats-beneficiaries-social-support-count',
      name: 'Nombre de suivis par bénéficiaire'
    }
  }
</script>
