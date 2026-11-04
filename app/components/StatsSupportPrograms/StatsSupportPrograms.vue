<template>
  <div>
    <!-- Filters -->
    <StatsSupportProgramFilters
      v-model:filters="filters"
      :support-program-name-options="supportProgramNameOptions"
    />

    <AtomLazyComponent
      :pending="status === 'pending'"
      :error="error != null"
      message="Impossible de charger les statistiques parcours et dispositifs."
    >
      <section>
        <h3 class="fr-sr-only">Résultats</h3>
        <StatsHeader
          class="fr-my-2w"
          :menus="menus"
          :is-exporting="isExporting"
        >
          <template #header>
            <h4 class="fr-sr-only">Nombre de bénéficiaires concernés</h4>
          </template>
          <template #icon>
            <AtomPictogram :path="userPictogram" />
          </template>
          <template #title>
            <p class="fr-mb-0 fr-h3 title-blue">
              {{ beneficiaryCountLabel }}
              <template v-if="isSupportProgramPeriodFiltered(filters)">
                <button
                  aria-describedby="tooltip-beneficiary-count-label"
                  type="button"
                  class="fr-btn--tooltip fr-btn"
                >
                  infobulle
                </button>
                <span
                  id="tooltip-beneficiary-count-label"
                  class="fr-tooltip fr-placement"
                  role="tooltip"
                  >Seuls sont concernés les bénéficiaires ayant au moins un
                  dispositif en cours pendant la période sélectionnée.</span
                ></template
              >
            </p>
          </template>
        </StatsHeader>

        <div class="fr-container--no-max">
          <div class="fr-grid-row fr-grid-row--gutters">
            <div class="fr-col-12">
              <StatsSupportProgramMeanDuration :filters="filters" />
            </div>

            <!-- Nombre d’entrées et sorties -->
            <StatsCard
              class="fr-col-12"
              :card-id="supportProgramCardConfig.entriesExits.id"
              :card-name="supportProgramCardConfig.entriesExits.name"
            >
              <StatsSupportProgramPeriodMention :filters="filters" />
              <StatsSupportProgramEntriesExits :filters="filters" />
            </StatsCard>

            <!-- Atteinte des objectifs -->
            <StatsCard
              class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
              :card-id="supportProgramCardConfig.outcome.id"
              :card-name="supportProgramCardConfig.outcome.name"
            >
              <StatsSupportProgramPeriodMention :filters="filters" />
              <StatsSupportProgramOutcome :filters="filters" />
            </StatsCard>

            <!-- Nombre de bénéficiaires par dispositif -->
            <StatsCard
              class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
              :card-id="supportProgramCardConfig.supportProgramNames.id"
              :card-name="supportProgramCardConfig.supportProgramNames.name"
              :card-subtitle="
                supportProgramCardConfig.supportProgramNames.subtitle
              "
            >
              <StatsSupportProgramPeriodMention :filters="filters" />
              <StatsSupportProgramNames :filters="filters" />
            </StatsCard>

            <!-- Nombre de bénéficiaires par partenaire -->
            <StatsCard
              class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
              :card-id="supportProgramCardConfig.partners.id"
              :card-name="supportProgramCardConfig.partners.name"
              :card-subtitle="supportProgramCardConfig.partners.subtitle"
            >
              <StatsSupportProgramPeriodMention :filters="filters" />
              <StatsSupportProgramPartners :filters="filters" />
            </StatsCard>

            <!-- Motif de sortie -->
            <StatsCard
              class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
              :card-id="supportProgramCardConfig.exitReasons.id"
              :card-name="supportProgramCardConfig.exitReasons.name"
              :card-subtitle="supportProgramCardConfig.exitReasons.subtitle"
            >
              <StatsSupportProgramPeriodMention :filters="filters" />
              <StatsSupportProgramExitReasons :filters="filters" />
            </StatsCard>
          </div>
        </div>
      </section>
    </AtomLazyComponent>
  </div>
</template>

<script lang="ts" setup>
  import type { SupportProgramStatFilterInput } from '~~/server/schema'
  import { isSupportProgramPeriodFiltered } from '~/utils/stats'
  import type { Options } from '~/utils/options'
  import { ExportEventAction } from '~~/types/matomo'
  import userPictogram from '@gouvfr/dsfr/dist/artwork/pictograms/digital/avatar.svg?url&no-inline'

  defineProps<{
    supportProgramNameOptions?: Options
  }>()

  const trpcClient = useTrpcClient()

  const filters = ref<SupportProgramStatFilterInput>({})

  const {
    data: count,
    error,
    status
  } = await trpcClient.stat.getSupportProgramCountStats.useQuery(filters)

  const plural = (word: string, q: number, end = 's') =>
    q > 1 ? `${word}${end}` : word

  const beneficiaryCountLabel = computed(() => {
    const beneficiaryCount = count?.value?.beneficiary ?? 0
    return `${beneficiaryCount} ${plural('bénéficiaire', beneficiaryCount)} ${plural('concerné', beneficiaryCount)}`
  })

  const supportProgramCardConfig = {
    outcome: {
      id: 'stats-support-program-outcome',
      name: 'Atteinte des objectifs'
    },
    partners: {
      id: 'stats-support-program-partners',
      name: 'Nombre de bénéficiaires par partenaire',
      subtitle: 'Un bénéficiaire peut être compté pour plusieurs partenaires.'
    },
    entriesExits: {
      id: 'stats-support-program-entries-exits',
      name: 'Nombre d’entrées et sorties'
    },
    supportProgramNames: {
      id: 'stats-support-program-names',
      name: 'Nombre de bénéficiaires par dispositif',
      subtitle: 'Un bénéficiaire peut être compté dans plusieurs dispositifs.'
    },
    exitReasons: {
      id: 'stats-support-program-exit-reasons',
      name: 'Motif de sortie',
      subtitle: 'Seuls les dispositifs avec dates sont comptés.'
    }
  }

  const { menus, isExporting } = useStatsExportMenus({
    hasData: () => !!count.value?.beneficiary,
    cardConfig: () => supportProgramCardConfig,
    mutation: () =>
      trpcClient.stat.exportSupportProgramStats.mutate(filters.value),
    fileName: 'stats_parcours_dispositifs',
    matomoEvents: {
      images: ExportEventAction.DownloadSupportProgramStatsImages,
      excel: ExportEventAction.DownloadSupportProgramStatsExcel
    }
  })
</script>
