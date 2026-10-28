<template>
  <PageContainer no-max-width>
    <PageTitle :title="title" />
    <div class="fr-grid-row fr-grid-row--gutters">
      <div class="fr-col-12">
        <AtomAlert
          v-if="fetchError"
          :alert-type="AlertType.Error"
          :message="fetchError"
          class="fr-mb-4v"
        />
        <AtomTabs
          v-if="
            structureOptions &&
            socialSupportSubjects &&
            supportProgramNames &&
            beneficiariesCitiesOptions &&
            beneficiariesSchoolsOptions
          "
          class="stats-filters"
          :tab-titles="tabTitles"
          :heading-level="2"
        >
          <template #[panelId(Tab.Beneficiaries)]>
            <StatsBeneficiaries
              :structure-options="structureOptions"
              :merged-ids="mergedIds"
              :social-support-subject-options="socialSupportSubjectOptions"
              :beneficiaries-cities-options="beneficiariesCitiesOptions"
              :beneficiaries-schools-options="beneficiariesSchoolsOptions"
              :support-program-name-options="supportProgramNameOptions"
            />
          </template>
          <template #[panelId(Tab.FileInstructions)]>
            <StatsHelpRequest
              :structure-options="structureOptions"
              :merged-ids="mergedIds"
              :social-support-subject-options="socialSupportSubjectOptions"
              :beneficiaries-cities-options="beneficiariesCitiesOptions"
              :beneficiaries-schools-options="beneficiariesSchoolsOptions"
              :support-program-name-options="supportProgramNameOptions"
            />
          </template>
          <template #[panelId(Tab.Followups)]>
            <StatsFollowup
              :structure-options="structureOptions"
              :merged-ids="mergedIds"
              :social-support-subject-options="socialSupportSubjectOptions"
              :beneficiaries-cities-options="beneficiariesCitiesOptions"
              :beneficiaries-schools-options="beneficiariesSchoolsOptions"
              :support-program-name-options="supportProgramNameOptions"
            />
          </template>
          <template #[panelId(Tab.SupportPrograms)]>
            <StatsSupportPrograms
              :structure-options="structureOptions"
              :merged-ids="mergedIds"
              :support-program-name-options="supportProgramNameOptions"
            />
          </template>
        </AtomTabs>
      </div>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
  import { routes } from '~/utils/routes'
  import { toOptions } from '~/utils/options'
  import { AlertType } from '~/utils/constants/alert'
  import { hasDefinedCity } from '~/utils/beneficiary/hasDefinedCity'
  import { toMergedIds, toMergedOptions } from '~/utils/crossStructureStats'

  const title = routes.crossStructure.PilotageTerritorial.title
  useHead({ title })

  definePageMeta({
    middleware: ['auth', 'cgu']
  })

  enum Tab {
    Beneficiaries = 'Beneficiaires',
    FileInstructions = 'Instructions',
    Followups = 'Entretiens',
    SupportPrograms = 'Dispositifs'
  }

  const tabTitles = [
    {
      tabId: Tab.Beneficiaries,
      panelId: panelId(Tab.Beneficiaries),
      title: 'Bénéficiaires',
      icon: 'fr-icon-user-line'
    },
    {
      tabId: Tab.FileInstructions,
      panelId: panelId(Tab.FileInstructions),
      title: 'Instructions de dossier',
      icon: 'fr-icon-questionnaire-line'
    },
    {
      tabId: Tab.Followups,
      panelId: panelId(Tab.Followups),
      title: 'Entretiens',
      icon: 'fr-icon-draft-line'
    },
    {
      tabId: Tab.SupportPrograms,
      panelId: panelId(Tab.SupportPrograms),
      title: 'Dispositifs',
      icon: 'fr-icon-file-user-line'
    }
  ]

  const trpcClient = useTrpcClient()

  const { data: structureOptions, error: structureOptionsError } =
    await trpcClient.crossStructureStat.getStructureList.useQuery(undefined, {
      transform: structures => toOptions(structures, 'id', 'name')
    })

  const { data: socialSupportSubjects, error: socialSupportSubjectsError } =
    await trpcClient.crossStructureStat.getSocialSupportSubjectNameList.useQuery()

  const { data: supportProgramNames, error: supportProgramNamesError } =
    await trpcClient.crossStructureStat.getSupportProgramNameList.useQuery()

  const socialSupportSubjectOptions = computed(() =>
    toMergedOptions(socialSupportSubjects.value ?? [])
  )
  const supportProgramNameOptions = computed(() =>
    toMergedOptions(supportProgramNames.value ?? [])
  )
  const mergedIds = computed(() => ({
    ...toMergedIds(socialSupportSubjects.value ?? []),
    ...toMergedIds(supportProgramNames.value ?? [])
  }))

  const {
    data: beneficiariesCitiesOptions,
    error: beneficiariesCitiesOptionsError
  } = await trpcClient.crossStructureStat.getBeneficiariesCities.useQuery(
    undefined,
    {
      transform: beneficiariesCities => {
        const definedCities = beneficiariesCities.filter(hasDefinedCity)
        return toOptions(definedCities, 'city', 'city')
      }
    }
  )

  const {
    data: beneficiariesSchoolsOptions,
    error: beneficiariesSchoolsOptionsError
  } = await trpcClient.crossStructureStat.getBeneficiariesSchools.useQuery(
    undefined,
    {
      transform: beneficiariesSchools => {
        const renamedSchools = beneficiariesSchools.map(school => ({
          name: `${school.name}, ${school.zipcode} ${school.city}`,
          uai: school.uai
        }))
        return toOptions(renamedSchools, 'uai', 'name')
      }
    }
  )

  const fetchError = computed(() => {
    if (structureOptionsError.value) {
      return "La liste des structures n'a pas pu être chargée."
    }
    if (socialSupportSubjectsError.value) {
      return "La liste des objets d'accompagnement n'a pas pu être chargée."
    }
    if (supportProgramNamesError.value) {
      return "La liste des dispositifs ou axes d'intervention n'a pas pu être chargée."
    }
    if (beneficiariesCitiesOptionsError.value) {
      return "La liste des villes n'a pas pu être chargée."
    }
    if (beneficiariesSchoolsOptionsError.value) {
      return "La liste des établissements scolaires n'a pas pu être chargée."
    }
    return ''
  })
</script>

<style scoped lang="scss">
  /* Same as the structure-side statistics: room for the multiselect dropdown */
  :deep(.fr-tabs__panel) {
    min-height: 36.5rem;
  }

  /* stylelint-disable selector-class-pattern */
  .stats-filters {
    :deep(.fromAge),
    :deep(.toAge) {
      .fr-input-wrap::before {
        bottom: 0.75rem;
        margin: auto;
        pointer-events: none;
        position: absolute;
        right: 1.75rem;
        top: 0.75rem;
        content: 'an(s)';
        line-height: 1rem;
      }

      .fr-input {
        padding-right: 4rem;
      }
    }
  }
  /* stylelint-enable selector-class-pattern */
</style>
