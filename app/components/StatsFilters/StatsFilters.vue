<template>
  <section class="feature-section">
    <h3 class="fr-sr-only">Filtres</h3>
    <AtomLoader
      v-if="
        !socialSupportSubjectOptions ||
        !beneficiariesCitiesOptions ||
        !beneficiariesEmployersOptions ||
        !beneficiariesSchoolsOptions
      "
      class="fr-mx-auto"
    />
    <AtomAlert
      v-if="isMinistry && ministersError"
      :alert-type="AlertType.Error"
      message="La liste des ministres n'a pas pu être chargée."
    />
    <AtomFilters
      v-else
      :key="filterResetKey"
      :filters="statsFilters"
      :default-values="defaultValues"
      :initial-selected-values="initialSelectedValues"
      :expanded-by-default="true"
      :validation-schema="validationSchema"
      @filter="onFilter"
    />
  </section>
</template>

<script setup lang="ts">
  import {
    fileInstructionTypeFilterKeys,
    fileInstructionTypePictos,
    beneficiaryStatusKeys,
    periodKeys,
    ageGroupKeys,
    ministereDepartmentServiceAcKeys,
    ministereStructureKeys,
    yesNoOptions,
    AgeGroup
  } from '~~/client/options'
  import { FilterType } from '~/utils/constants/filters'
  import type { Options } from '~/utils/options'
  import { withEmptyValue } from '~/utils/options'
  import type { StatFilterInput } from '~~/server/schema'
  import type { FilterProp, FilterValues } from '~~/types/filter'
  import { StatPeriodFilter } from '~~/types/stat'
  import {
    beneficiaryFieldLabels,
    helpRequestFieldLabels
  } from '~~/client/labels'
  import { formatMinisterName } from '~/utils/minister'
  import { AlertType } from '~/utils/constants/alert'
  import { EventCategory, StatFilterEventAction } from '~~/types/matomo'

  const { application } = usePermissions()
  const trpcClient = useTrpcClient()
  const isMinistry = computed(() => application.value.module.ministere)

  const props = withDefaults(
    defineProps<{
      socialSupportSubjectOptions: Options
      beneficiariesCitiesOptions: Options
      beneficiariesEmployersOptions: Options
      beneficiariesSchoolsOptions?: Options
      agentOptions: Options
      supportProgramNameOptions?: Options
      filters: StatFilterInput
      validationSchema?: any
      isHelpRequest?: boolean
      isHistory?: boolean
    }>(),
    {
      isHelpRequest: false,
      isHistory: false,
      validationSchema: undefined,
      supportProgramNameOptions: () => [],
      beneficiariesSchoolsOptions: () => []
    }
  )

  const emit = defineEmits<{
    'update:filters': [filters: StatFilterInput]
  }>()

  // Multi-structure support
  const multiStructure = inject<{
    structureOptions: ComputedRef<Options>
    selectedStructureIds: Ref<string[]>
    isMultiStructure: ComputedRef<boolean>
  } | null>('multiStructureConfig', null)

  const isMultiStructureMode = computed(
    () => multiStructure?.isMultiStructure.value ?? false
  )

  const filterResetKey = ref(0)
  const previousStructureIds = ref<string[]>(
    multiStructure?.selectedStructureIds.value ?? []
  )

  const initialSelectedValues = computed(() => {
    if (!isMultiStructureMode.value) {
      return undefined
    }
    return {
      structureIds: multiStructure?.selectedStructureIds.value ?? []
    }
  })

  const defaultValues = computed<StatFilterInput | undefined>(() => {
    if (props.isHelpRequest) {
      return { helpRequestSubject: '' }
    }
    return undefined
  })

  const maxAlwaysExpandedNb = 4

  const agentOptionsWithEmptyValue = computed(() => [
    { value: '', label: '' },
    ...props.agentOptions
  ])

  // get Minister list from DB
  const { data: ministers, error: ministersError } = isMinistry.value
    ? await trpcClient.minister.getMinisters.useQuery()
    : { data: null, error: null }

  const ministerOptions = computed(() => {
    if (!ministers?.value) {
      return null
    }
    return ministers.value.map(minister => ({
      label: formatMinisterName(minister),
      value: minister.id
    }))
  })

  function onFilter(filterValues: FilterValues) {
    const newStructureIds = filterValues.structureIds as string[] | undefined

    if (isMultiStructureMode.value && newStructureIds) {
      const changed =
        JSON.stringify([...newStructureIds].sort()) !==
        JSON.stringify([...previousStructureIds.value].sort())

      if (changed) {
        previousStructureIds.value = [...newStructureIds]
        if (multiStructure) {
          multiStructure.selectedStructureIds.value = [...newStructureIds]
        }
        filterResetKey.value++
        emit('update:filters', { structureIds: newStructureIds })
        return
      }
    }

    emit('update:filters', filterValues as unknown as StatFilterInput)
  }

  const statsFilters = computed(() => {
    const statsFilters: FilterProp[] = []

    if (isMultiStructureMode.value && multiStructure) {
      statsFilters.push({
        name: 'structureIds',
        label: 'Structures',
        options: multiStructure.structureOptions.value,
        type: FilterType.SelectMultiple,
        alwaysExpanded: true
      })
    }

    statsFilters.push(
      {
        name: 'helpRequestSubject',
        label: "Thématique d'instruction",
        options: withEmptyValue(
          fileInstructionTypeFilterKeys.options,
          'Toutes'
        ),
        type: FilterType.Radio,
        alwaysExpanded: true,
        pictos: fileInstructionTypePictos,
        disabled: !props.isHelpRequest,
        matomoEventCategory: EventCategory.StatFilter,
        matomoEventAction: StatFilterEventAction.HelpRequestSubject
      },
      {
        name: 'period',
        label: 'Période',
        type: FilterType.SelectOne,
        options: withEmptyValue(periodKeys.options, ''),
        alwaysExpanded: true,
        matomoEventCategory: EventCategory.StatFilter,
        matomoEventAction: StatFilterEventAction.Period
      }
    )

    if (props.filters.period === StatPeriodFilter.Custom) {
      statsFilters.push(
        {
          name: 'fromDate',
          label: 'Du',
          type: FilterType.Date,
          alwaysExpanded: true
        },
        {
          name: 'toDate',
          label: 'Au',
          type: FilterType.Date,
          alwaysExpanded: statsFilters.length < maxAlwaysExpandedNb
        }
      )
    }

    if (props.socialSupportSubjectOptions.length) {
      statsFilters.push({
        name: 'socialSupportSubjects',
        label: "Objet de l'accompagnement",
        options: props.socialSupportSubjectOptions,
        type: FilterType.SelectMultiple,
        alwaysExpanded: statsFilters.length < maxAlwaysExpandedNb,
        disabled: props.filters.helpRequestSubject === 'Housing',
        matomoEventCategory: EventCategory.StatFilter,
        matomoEventAction: StatFilterEventAction.SocialSupportSubject
      })
    }
    if (props.beneficiariesCitiesOptions.length) {
      statsFilters.push({
        name: 'cities',
        label: beneficiaryFieldLabels.city,
        options: props.beneficiariesCitiesOptions,
        type: FilterType.SelectMultiple,
        alwaysExpanded: statsFilters.length < maxAlwaysExpandedNb,
        matomoEventCategory: EventCategory.StatFilter,
        matomoEventAction: StatFilterEventAction.City
      })
    }
    if (props.supportProgramNameOptions?.length) {
      statsFilters.push({
        name: 'supportProgramNameIds',
        label: "Dispositif ou axe d'intervention",
        options: props.supportProgramNameOptions,
        type: FilterType.SelectMultiple,
        alwaysExpanded: statsFilters.length < maxAlwaysExpandedNb,
        matomoEventCategory: EventCategory.StatFilter,
        matomoEventAction: StatFilterEventAction.SupportProgram
      })
    }
    if (
      !isMultiStructureMode.value &&
      application.value.module.statsByReferent &&
      !props.isHistory
    ) {
      statsFilters.push({
        name: 'referent',
        label: 'Référent',
        options: agentOptionsWithEmptyValue.value,
        type: FilterType.SelectOne,
        alwaysExpanded: statsFilters.length < maxAlwaysExpandedNb,
        matomoEventCategory: EventCategory.StatFilter,
        matomoEventAction: StatFilterEventAction.Referent
      })
    }
    if (!isMultiStructureMode.value && props.isHistory) {
      statsFilters.push({
        name: 'createdById',
        label: 'Agent',
        options: props.agentOptions,
        type: FilterType.SelectMultiple,
        alwaysExpanded: statsFilters.length < maxAlwaysExpandedNb,
        matomoEventCategory: EventCategory.StatFilter,
        matomoEventAction: StatFilterEventAction.Agent
      })
    }
    statsFilters.push({
      name: 'beneficiaryStatus',
      label: 'Statut du bénéficiaire',
      options: withEmptyValue(beneficiaryStatusKeys.options),
      type: FilterType.SelectOne,
      alwaysExpanded: statsFilters.length < maxAlwaysExpandedNb,
      matomoEventCategory: EventCategory.StatFilter,
      matomoEventAction: StatFilterEventAction.BeneficiaryStatus
    })
    if (application.value.module.ministere && ministerOptions.value != null) {
      if (ministerOptions.value != null) {
        statsFilters.push({
          name: 'ministerId',
          label: helpRequestFieldLabels.minister,
          options: ministerOptions.value,
          type: FilterType.SelectMultiple,
          alwaysExpanded: statsFilters.length < maxAlwaysExpandedNb,
          matomoEventCategory: EventCategory.StatFilter,
          matomoEventAction: StatFilterEventAction.Minister
        })
      }
      statsFilters.push({
        name: 'ministereDepartementServiceAc',
        label: beneficiaryFieldLabels.ministereDepartementServiceAc,
        options: withEmptyValue(ministereDepartmentServiceAcKeys.options),
        type: FilterType.SelectOne,
        alwaysExpanded: statsFilters.length < maxAlwaysExpandedNb,
        matomoEventCategory: EventCategory.StatFilter,
        matomoEventAction: StatFilterEventAction.MinistryDepartementServiceAc
      })
      statsFilters.push({
        name: 'ministereStructure',
        label: beneficiaryFieldLabels.ministereStructure,
        options: withEmptyValue(ministereStructureKeys.options),
        type: FilterType.SelectOne,
        alwaysExpanded: statsFilters.length < maxAlwaysExpandedNb,
        matomoEventCategory: EventCategory.StatFilter,
        matomoEventAction: StatFilterEventAction.MinistryStructure
      })
    }
    statsFilters.push({
      name: 'ageGroup',
      label: "Tranche d'âge",
      options: withEmptyValue(
        ageGroupKeys.options,
        "Toutes les tranches d'âge"
      ),
      type: FilterType.SelectOne,
      alwaysExpanded: statsFilters.length < maxAlwaysExpandedNb,
      matomoEventCategory: EventCategory.StatFilter,
      matomoEventAction: StatFilterEventAction.AgeGroup
    })

    if (props.filters.ageGroup === AgeGroup.Custom) {
      statsFilters.push(
        {
          name: 'fromAge',
          label: 'De (âge minimum)',
          type: FilterType.Number,
          alwaysExpanded: statsFilters.length < maxAlwaysExpandedNb
        },
        {
          name: 'toAge',
          label: 'À (âge maximum)',
          type: FilterType.Number,
          alwaysExpanded: statsFilters.length < maxAlwaysExpandedNb
        }
      )
    }

    statsFilters.push({
      name: 'qpv',
      label: beneficiaryFieldLabels.qpv,
      options: withEmptyValue(yesNoOptions, ''),
      type: FilterType.SelectOne,
      alwaysExpanded: statsFilters.length < maxAlwaysExpandedNb,
      matomoEventCategory: EventCategory.StatFilter,
      matomoEventAction: StatFilterEventAction.QPV
    })

    if (props.beneficiariesEmployersOptions.length) {
      statsFilters.push({
        name: 'employers',
        label: beneficiaryFieldLabels.employer,
        options: props.beneficiariesEmployersOptions,
        type: FilterType.SelectMultiple,
        alwaysExpanded: statsFilters.length < maxAlwaysExpandedNb,
        matomoEventCategory: EventCategory.StatFilter,
        matomoEventAction: StatFilterEventAction.Employer
      })
    }

    if (props.beneficiariesSchoolsOptions.length) {
      statsFilters.push({
        name: 'schoolUai',
        label: beneficiaryFieldLabels.schoolUai,
        options: props.beneficiariesSchoolsOptions,
        type: FilterType.SelectMultiple,
        alwaysExpanded: statsFilters.length < maxAlwaysExpandedNb,
        matomoEventCategory: EventCategory.StatFilter,
        matomoEventAction: StatFilterEventAction.School
      })
    }

    return statsFilters
  })
</script>
