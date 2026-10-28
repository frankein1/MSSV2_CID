<template>
  <section class="feature-section">
    <h3 class="fr-sr-only">Filtres</h3>
    <AtomFilters
      :filters="statsFilters"
      :default-values="defaultValues"
      :expanded-by-default="true"
      :validation-schema="validationSchema"
      @filter="emit('update:filters', $event)"
    />
  </section>
</template>

<script setup lang="ts">
  import {
    periodKeys,
    ageGroupKeys,
    yesNoOptions,
    AgeGroup
  } from '~~/client/options'
  import { FilterType } from '~/utils/constants/filters'
  import type { Options } from '~/utils/options'
  import { withEmptyValue } from '~/utils/options'
  import type { StatFilterInput } from '~~/server/schema'
  import type { FilterProp } from '~~/types/filter'
  import { StatPeriodFilter } from '~~/types/stat'
  import { beneficiaryFieldLabels } from '~~/client/labels'
  import { EventCategory, StatFilterEventAction } from '~~/types/matomo'

  // Review app only: cross-structure statistics panel filters
  // (period, structures, subjects, city, dispositifs, age group, QPV, school)

  const props = withDefaults(
    defineProps<{
      structureOptions?: Options
      socialSupportSubjectOptions?: Options
      beneficiariesCitiesOptions?: Options
      beneficiariesSchoolsOptions?: Options
      supportProgramNameOptions?: Options
      filters: StatFilterInput
      validationSchema?: any
    }>(),
    {
      structureOptions: () => [],
      socialSupportSubjectOptions: () => [],
      beneficiariesCitiesOptions: () => [],
      beneficiariesSchoolsOptions: () => [],
      supportProgramNameOptions: () => [],
      validationSchema: undefined
    }
  )

  const emit = defineEmits<{
    'update:filters': [filters: StatFilterInput]
  }>()

  // Every structure selected on arrival, same result as none selected
  const defaultValues = computed<StatFilterInput>(() => ({
    structureIds: props.structureOptions.map(({ value }) => value)
  }))

  const maxAlwaysExpandedNb = 4

  const statsFilters = computed(() => {
    const statsFilters: FilterProp[] = [
      {
        name: 'period',
        label: 'Période',
        type: FilterType.SelectOne,
        options: withEmptyValue(periodKeys.options, ''),
        alwaysExpanded: true,
        matomoEventCategory: EventCategory.StatFilter,
        matomoEventAction: StatFilterEventAction.Period
      }
    ]

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

    if (props.structureOptions.length) {
      statsFilters.push({
        name: 'structureIds',
        label: 'Structures',
        options: props.structureOptions,
        type: FilterType.SelectMultiple,
        alwaysExpanded: statsFilters.length < maxAlwaysExpandedNb
      })
    }
    if (props.socialSupportSubjectOptions.length) {
      statsFilters.push({
        name: 'socialSupportSubjects',
        label: "Objet de l'accompagnement",
        options: props.socialSupportSubjectOptions,
        type: FilterType.SelectMultiple,
        alwaysExpanded: statsFilters.length < maxAlwaysExpandedNb,
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
    if (props.supportProgramNameOptions.length) {
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
