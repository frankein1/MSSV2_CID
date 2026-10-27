<template>
  <div>
    <!-- Filters -->
    <!-- TODO: help request filters must be disabled -->

    <StatsFilters
      v-model:filters="filters"
      :social-support-subject-options="socialSupportSubjectOptions"
      :beneficiaries-cities-options="beneficiariesCitiesOptions"
      :beneficiaries-employers-options="beneficiariesEmployersOptions"
      :beneficiaries-schools-options="beneficiariesSchoolsOptions"
      :agent-options="agentOptions"
      :support-program-name-options="supportProgramNameOptions"
      :is-help-request="false"
      :is-history="true"
    />

    <section>
      <h3 class="fr-sr-only">Résultats</h3>
      <StatsHeader
        :menus="menus"
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
            v-if="firstFollowupCount > 0 || walkInSessionFollowupCount > 0"
            class="fr-mb-0"
          >
            <span class="fr-text--sm">Dont </span>
            <span
              v-if="firstFollowupCount > 0"
              class="fr-text--sm"
            >
              {{ firstFollowupCountLabel }}
            </span>
            <template
              v-if="
                historyCounts?.firstFollowups &&
                historyCounts?.firstFollowups > 0 &&
                walkInSessionFollowupCount
              "
            >
              <span class="fr-text--sm"> et </span>
            </template>
            <template v-if="walkInSessionFollowupCount > 0">
              <span class="fr-text--sm">
                {{ walkInSessionFollowupCountLabel }}
              </span>
            </template>
            <span class="fr-text--sm">.</span>
          </p>
        </template>
      </StatsHeader>
      <StatsExportAlert v-if="!alertClose" />

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
              :filters="filters"
            />
          </StatsCard>
          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="followupCardsConfig.medium.id"
            :card-name="followupCardsConfig.medium.name"
          >
            <StatsFollowupMedium
              :total-count="followupCount"
              :filters="filters"
          /></StatsCard>

          <StatsCard
            v-if="application.module.ministere"
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="ministereConfig.minister.id"
            :card-name="ministereConfig.minister.name"
          >
            <StatsFollowupMinistre
              :total-count="followupCount"
              :filters="filters"
          /></StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="followupCardsConfig.status.id"
            :card-name="followupCardsConfig.status.name"
          >
            <StatsFollowupStatus
              :total-count="followupCount"
              :filters="filters"
            />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="followupCardsConfig.actions.id"
            :card-name="followupCardsConfig.actions.name"
          >
            <StatsFollowupActionsEntreprises
              :total-count="followupCount"
              :filters="filters"
            />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="followupCardsConfig.redirections.id"
            :card-name="followupCardsConfig.redirections.name"
          >
            <StatsFollowupRedirections
              :total-count="followupCount"
              :beneficiary-total-count="followupBeneficiaryCount"
              :filters="filters"
            />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="followupCardsConfig.redirectionReasons.id"
            :card-name="followupCardsConfig.redirectionReasons.name"
          >
            <StatsFollowupRedirectionReasons
              :total-count="followupCount"
              :filters="filters"
            />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="followupCardsConfig.prescribingOrganizations.id"
            :card-name="followupCardsConfig.prescribingOrganizations.name"
          >
            <StatsFollowupPrescribingOrganizations
              :total-count="followupCount"
              :filters="filters"
            />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="followupCardsConfig.followupDuration.id"
            :card-name="followupCardsConfig.followupDuration.name"
          >
            <StatsFollowupDuration
              :total-count="followupCount"
              :filters="filters"
            />
          </StatsCard>
          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="followupCardsConfig.followupMeanTime.id"
            :card-name="followupCardsConfig.followupMeanTime.name"
          >
            <StatsFollowupMeanTime
              :total-count="followupCount"
              :filters="filters"
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
  import type { MenuItem } from '~~/types/menu'
  import { exportStats, zipAndDownloadImages } from '~/utils/stats/exportStats'
  import { EventCategory, ExportEventAction } from '~~/types/matomo'

  const trpcClient = useTrpcClient()
  const { application } = usePermissions()
  const matomo = useMatomo()

  const alertClose = ref<boolean>(true)

  withDefaults(
    defineProps<{
      socialSupportSubjectOptions?: Options
      beneficiariesCitiesOptions?: Options
      beneficiariesEmployersOptions?: Options
      beneficiariesSchoolsOptions?: Options
      agentOptions?: Options
      supportProgramNameOptions?: Options
    }>(),
    {
      socialSupportSubjectOptions: () => [],
      beneficiariesCitiesOptions: () => [],
      beneficiariesEmployersOptions: () => [],
      beneficiariesSchoolsOptions: () => [],
      agentOptions: () => [],
      supportProgramNameOptions: () => []
    }
  )

  const isDownloading = ref(false)
  const filters = ref<StatFilterInput>({})

  const {
    data: historyCounts,
    error,
    status
  } = await trpcClient.stat.getHistoryCounts.useQuery(filters)

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

  const walkInSessionFollowupCount = computed(
    () => historyCounts.value?.walkInSessionFollowups || 0
  )

  const walkInSessionFollowupCountLabel = computed(
    () =>
      `${walkInSessionFollowupCount.value} ${
        walkInSessionFollowupCount.value > 1
          ? 'entretiens réalisés en permanence'
          : 'entretien réalisé en permanence'
      }`
  )

  const followupCardsConfig = {
    subject: {
      id: 'stats-followup-subject',
      name: "Objets d'accompagnement"
    },
    medium: {
      id: 'stats-followup-medium',
      name: "Types d'entretien"
    },
    status: {
      id: 'stats-followup-status',
      name: 'Statuts'
    },
    redirections: {
      id: 'stats-followup-redirections',
      name: 'Réorientations'
    },
    redirectionReasons: {
      id: 'stats-followup-redirection-reasons',
      name: 'Motifs de réorientation'
    },
    actions: {
      id: 'stats-followup-actions',
      name: 'Actions entreprises'
    },
    prescribingOrganizations: {
      id: 'stats-followup-prescribing-organizations',
      name: 'Organismes prescripteurs'
    },
    followupDuration: {
      id: 'stats-followup-time-duration',
      name: 'Durée des entretiens'
    },
    followupMeanTime: {
      id: 'stats-followup-mean-time',
      name: 'Durée moyenne d’un entretien par objet d’accompagnement'
    }
  }

  const ministereConfig = {
    minister: {
      id: 'stats-followup-minister',
      name: 'Ministres'
    }
  }

  const menus: ComputedRef<MenuItem[]> = computed(() => {
    const menus: MenuItem[] = []

    if (followupCount.value != 0) {
      menus.push({
        label: 'En images (.zip)',
        icon: 'fr-icon-folder-image-line',
        onClick: async () => {
          matomo.trackEvent(
            EventCategory.ExportStats,
            ExportEventAction.DownloadFolloupStatsImages
          )
          alertClose.value = false
          const date = new Date()
          setTimeout(() => {
            zipAndDownloadImages(
              "Statistiques - Synthèses d'entretiens - " +
                date.toLocaleDateString(),
              {
                ...followupCardsConfig,
                ...(application.value.module.ministere && ministereConfig)
              },
              buttonFilter,
              closeAlert
            )
          }, 200)
        }
      })
    }

    if (followupCount.value != 0) {
      menus.push({
        label: 'En tableur (.xlsx)',
        icon: 'fr-icon-file-excel-line',
        onClick: () => {
          matomo.trackEvent(
            EventCategory.ExportStats,
            ExportEventAction.DownloadFolloupStatsExcel
          )
          handleExportExcel()
        }
      })
    }
    return menus
  })

  const excelIsDownloading = (downloading: boolean) => {
    isDownloading.value = downloading
  }
  const handleExportExcel = () => {
    exportStats(
      filters.value,
      'stats_entretiens',
      trpcClient,
      excelIsDownloading
    )
  }

  const buttonFilter = (node: HTMLElement | Node) => {
    return (node as HTMLElement).tagName !== 'BUTTON'
  }
  const closeAlert = () => {
    alertClose.value = true
  }
</script>
