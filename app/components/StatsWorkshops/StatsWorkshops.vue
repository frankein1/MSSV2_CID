<template>
  <div>
    <!-- Filters -->

    <StatsWorkshopFilters v-model:filters="filters" />

    <section>
      <h3 class="fr-sr-only">Résultats</h3>
      <StatsHeader
        class="fr-my-2w"
        :menus="menus"
        :is-exporting="isExporting"
      >
        <template #header>
          <h4 class="fr-sr-only">Nombre d’ateliers</h4>
        </template>
        <template #icon>
          <img
            class="fr-mr-1w"
            src="/pictograms/calendar-blue.svg"
            alt=""
          />
        </template>
        <template #title>
          <p class="fr-mb-0 fr-h3 title-blue">
            {{ totalWorkshopCountLabel }}
            <span class="fr-text--sm">{{ detailedWorkshopCountLabel }}</span>
          </p>
        </template>
      </StatsHeader>
      <AtomAlert
        v-if="error"
        :alert-type="AlertType.Error"
        message="Le nombre total de bénéficiaires n'a pas pu être chargé."
      />

      <div class="fr-container--no-max">
        <div class="fr-grid-row fr-grid-row--gutters">
          <div class="fr-col-12">
            <StatsWorkshopAttendeeCount :filters="filters" />
          </div>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="workshopCardConfig.workshopName.id"
            :card-name="workshopCardConfig.workshopName.name"
          >
            <StatsWorkshopName :filters="filters" />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="workshopCardConfig.attendance.id"
            :card-name="workshopCardConfig.attendance.name"
            :card-subtitle="workshopCardConfig.attendance.subtitle"
          >
            <StatsWorkshopAttendance :filters="filters" />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="workshopCardConfig.gender.id"
            :card-name="workshopCardConfig.gender.name"
          >
            <StatsWorkshopAttendeeGender :filters="filters" />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="workshopCardConfig.ages.id"
            :card-name="workshopCardConfig.ages.name"
          >
            <StatsWorkshopAttendeeAgeGroups :filters="filters" />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="workshopCardConfig.partners.id"
            :card-name="workshopCardConfig.partners.name"
          >
            <StatsWorkshopPartners :filters="filters" />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="workshopCardConfig.cities.id"
            :card-name="workshopCardConfig.cities.name"
            :card-subtitle="workshopCardConfig.cities.subtitle"
          >
            <StatsWorkshopAttendeeCities :filters="filters" />
          </StatsCard>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
  import { AlertType } from '~/utils/constants/alert'
  import type { WorkshopStatFilterInput } from '~~/server/schema'
  import { ExportEventAction } from '~~/types/matomo'

  const trpcClient = useTrpcClient()

  const filters = ref<WorkshopStatFilterInput>({})

  const { data: workshopCount, error } =
    await trpcClient.stat.getWorkshopCountStats.useQuery(filters)

  const plural = (word: string, q: number, end = 's') =>
    q > 1 ? `${word}${end}` : `${word}`

  const totalWorkshopCountLabel = computed(() => {
    const count = workshopCount.value?.total ?? 0
    return `${count} ${plural('atelier', count)}`
  })

  const detailedWorkshopCountLabel = computed(() => {
    const futureCount = workshopCount.value?.future ?? 0
    const pastCount = workshopCount.value?.past ?? 0

    return `(${pastCount} ${plural('passé', pastCount)} et ${futureCount} à venir)`
  })

  const workshopCardConfig = {
    workshopName: {
      id: 'stats-workshop-name',
      name: 'Nombre d’ateliers'
    },
    partners: {
      id: 'stats-workshop-partners',
      name: 'Partenaires'
    },
    attendance: {
      id: 'stats-attendance',
      name: 'Présences',
      subtitle: 'Seuls les ateliers passés sont pris en compte.'
    },
    gender: {
      id: 'stats-attendees-gender',
      name: 'Genres'
    },
    ages: {
      id: 'stats-attendees-age',
      name: 'Tranches d’âge'
    },
    cities: {
      id: 'stats-attendees-cities',
      name: 'Villes',
      subtitle: 'Ville renseignée dans l’adresse du bénéficiaire.'
    }
  }

  const { menus, isExporting } = useStatsExportMenus({
    hasData: () => workshopCount.value?.total != 0,
    cardConfig: () => workshopCardConfig,
    mutation: () => trpcClient.stat.exportWorkshopStats.mutate(filters.value),
    fileName: 'stats_ateliers',
    matomoEvents: {
      images: ExportEventAction.DownloadWorkshopStatsImages,
      excel: ExportEventAction.DownloadWorkshopStatsExcel
    }
  })
</script>
