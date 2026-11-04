<template>
  <div>
    <!-- Filters -->
    <StatsFilters
      v-model:filters="filters"
      :social-support-subject-options="socialSupportSubjectOptions"
      :beneficiaries-cities-options="beneficiariesCitiesOptions"
      :beneficiaries-employers-options="beneficiariesEmployersOptions"
      :beneficiaries-schools-options="beneficiariesSchoolsOptions"
      :agent-options="agentOptions"
      :support-program-name-options="supportProgramNameOptions"
      :is-help-request="true"
      :is-history="true"
    />

    <section>
      <h3 class="fr-sr-only">Résultats</h3>
      <StatsHeader
        :menus="menus"
        :is-exporting="isExporting"
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
            v-if="displayed.instructionType"
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="instructionTypeConfig.instructionType.id"
            :card-name="instructionTypeConfig.instructionType.name"
          >
            <StatsFileInstructionType
              :total-count="helpRequestCount"
              :filters="filters"
            />
          </StatsCard>

          <StatsCard
            v-if="displayed.socialSupportSubjects"
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="subjectConfig.subjects.id"
            :card-name="subjectConfig.subjects.name"
          >
            <StatsHelpRequestSubject
              :total-count="helpRequestCount"
              :filters="filters"
            />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="baseConfig.status.id"
            :card-name="baseConfig.status.name"
          >
            <StatsHelpRequestStatus
              :total-count="helpRequestCount"
              :filters="filters"
            />
          </StatsCard>

          <StatsCard
            v-if="displayed.ministere"
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="ministereConfig.minister.id"
            :card-name="ministereConfig.minister.name"
          >
            <StatsHelpRequestMinistre
              :total-count="helpRequestCount"
              :filters="filters"
            />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="baseConfig.prescribingOrganizations.id"
            :card-name="baseConfig.prescribingOrganizations.name"
          >
            <StatsHelpRequestPrescribingOrganizations
              :total-count="helpRequestCount"
              :filters="filters"
            />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="baseConfig.instructions.id"
            :card-name="baseConfig.instructions.name"
          >
            <StatsHelpRequestInstructions
              :total-count="helpRequestCount"
              :filters="filters"
            />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="baseConfig.redirections.id"
            :card-name="baseConfig.redirections.name"
          >
            <StatsHelpRequestRedirections
              :total-count="helpRequestCount"
              :beneficiary-total-count="helpRequestBeneficiaryCount"
              :filters="filters"
            />
          </StatsCard>

          <StatsCard
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="baseConfig.redirectionReasons.id"
            :card-name="baseConfig.redirectionReasons.name"
          >
            <StatsHelpRequestRedirectionReasons
              :total-count="helpRequestCount"
              :filters="filters"
            />
          </StatsCard>

          <template v-if="displayed.financial">
            <StatsCard
              class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
              :card-id="financialConfig.amountAllocated.id"
              :card-name="financialConfig.amountAllocated.name"
            >
              <StatsHelpRequestAmountsAllocated :filters />
            </StatsCard>

            <StatsCard
              class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
              :card-id="financialConfig.amountsBySubject.id"
              :card-name="financialConfig.amountsBySubject.name"
            >
              <StatsHelpRequestAmountsBySubject :filters="filters" />
            </StatsCard>

            <StatsCard
              class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
              :card-id="financialConfig.amountByInstructorOrganization.id"
              :card-name="financialConfig.amountByInstructorOrganization.name"
            >
              <StatsHelpRequestAmountsByInstructorOrganization :filters />
            </StatsCard>
          </template>

          <StatsCard
            v-if="displayed.housing"
            class="fr-col-12 fr-col-lg-6 fr-col-xl-4"
            :card-id="housingConfig.housingHelpRequest.id"
            :card-name="housingConfig.housingHelpRequest.name"
          >
            <StatsHousingHelpRequests :filters="filters" />
          </StatsCard>
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
  import { FileInstructionType } from '@prisma/client'
  import { AlertType } from '~/utils/constants/alert'
  import type { StatFilterInput } from '~~/server/schema'
  import type { Options } from '~/utils/options'
  import { ExportEventAction } from '~~/types/matomo'

  const trpcClient = useTrpcClient()
  const { application } = usePermissions()

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

  const filters = ref<StatFilterInput>({})

  const {
    data: historyCounts,
    error,
    status
  } = await trpcClient.stat.getHelpRequestCountStats.useQuery(filters)

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

  const displayed = computed(() => ({
    instructionType: !filters.value.helpRequestSubject,
    socialSupportSubjects:
      filters.value.helpRequestSubject !== FileInstructionType.Housing,
    housing:
      !filters.value.socialSupportSubjects &&
      (!filters.value.helpRequestSubject ||
        filters.value.helpRequestSubject === FileInstructionType.Housing),
    financial:
      !filters.value.helpRequestSubject ||
      filters.value.helpRequestSubject === FileInstructionType.Financial,
    ministere: application.value.module.ministere
  }))

  const baseConfig = {
    status: {
      id: 'stats-helprequest-status',
      name: 'Statuts'
    },
    prescribingOrganizations: {
      id: 'stats-helprequest-prescribing-organization',
      name: 'Organismes prescripteurs'
    },
    instructions: {
      id: 'stats-helprequest-instructions',
      name: 'Instructions'
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

  const instructionTypeConfig = {
    instructionType: {
      id: 'stats-helprequest-instruction-type',
      name: "Thématique d'instruction"
    }
  }

  const housingConfig = {
    housingHelpRequest: {
      id: 'stats-helprequest-housing-helprequest',
      name: 'Demandes de logement'
    }
  }

  const subjectConfig = {
    subjects: {
      id: 'stats-helprequest-subjects',
      name: "Objets d'accompagnement"
    }
  }

  const ministereConfig = {
    minister: {
      id: 'stats-helprequest-minister',
      name: 'Ministres'
    }
  }

  const financialConfig = {
    amountAllocated: {
      id: 'stats-helprequest-amount-allocated',
      name: 'Montants des aides délivrées'
    },
    amountByInstructorOrganization: {
      id: 'stats-helprequest-amount-by-instructor-organization',
      name: 'Répartition des montants accordés par organisme instructeur'
    },
    amountsBySubject: {
      id: 'stats-helprequest-amounts-by-subject',
      name: 'Répartition des montants accordés par objet d’accompagnement'
    }
  }

  const { menus, isExporting } = useStatsExportMenus({
    hasData: () => helpRequestCount.value !== 0,
    cardConfig: () => ({
      ...baseConfig,
      ...(displayed.value.instructionType && instructionTypeConfig),
      ...(displayed.value.socialSupportSubjects && subjectConfig),
      ...(displayed.value.housing && housingConfig),
      ...(displayed.value.ministere && ministereConfig),
      ...(displayed.value.financial && financialConfig)
    }),
    mutation: () =>
      trpcClient.stat.exportHelpRequestStats.mutate(filters.value),
    fileName: 'stats_instructions_dossier',
    matomoEvents: {
      images: ExportEventAction.DownloadHelpRequestStatsImages,
      excel: ExportEventAction.DownloadHelpRequestStatsExcel
    }
  })
</script>
