<template>
  <div>
    <!-- Filters -->
    <StatsSupportProgramFilters
      v-model:filters="filters"
      :structure-options="structureOptions"
      :support-program-name-options="supportProgramNameOptions"
    />

    <section>
      <h3 class="fr-sr-only">Résultats</h3>
      <div class="fr-container--no-max fr-mt-2w">
        <div class="fr-grid-row fr-grid-row--gutters">
          <div class="fr-col-12">
            <StatsSupportProgramMeanDuration :filters="queryFilters" />
          </div>

          <!-- Nombre d’entrées et sorties -->
          <StatsCard
            class="fr-col-12"
            :card-id="supportProgramCardConfig.entriesExits.id"
            :card-name="supportProgramCardConfig.entriesExits.name"
          >
            <StatsSupportProgramPeriodMention :filters="filters" />
            <StatsSupportProgramEntriesExits :filters="queryFilters" />
          </StatsCard>

          <!-- Nombre de bénéficiaires par partenaire -->
          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="supportProgramCardConfig.partners.id"
            :card-name="supportProgramCardConfig.partners.name"
            :card-subtitle="supportProgramCardConfig.partners.subtitle"
          >
            <StatsSupportProgramPeriodMention :filters="filters" />
            <StatsSupportProgramPartners :filters="queryFilters" />
          </StatsCard>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
  import type { SupportProgramStatFilterInput } from '~~/server/schema'
  import type { Options } from '~/utils/options'
  import { expandMergedIds, type MergedIds } from '~/utils/crossStructureStats'

  const props = withDefaults(
    defineProps<{
      structureOptions?: Options
      mergedIds?: MergedIds
      supportProgramNameOptions?: Options
    }>(),
    {
      structureOptions: () => [],
      mergedIds: () => ({}),
      supportProgramNameOptions: () => []
    }
  )

  const filters = ref<SupportProgramStatFilterInput>({})
  const queryFilters = computed(() =>
    expandMergedIds(filters.value, props.mergedIds)
  )

  const supportProgramCardConfig = {
    partners: {
      id: 'stats-support-program-partners',
      name: 'Nombre de bénéficiaires par partenaire',
      subtitle: 'Un bénéficiaire peut être compté pour plusieurs partenaires.'
    },
    entriesExits: {
      id: 'stats-support-program-entries-exits',
      name: 'Nombre d’entrées et sorties'
    }
  }
</script>
