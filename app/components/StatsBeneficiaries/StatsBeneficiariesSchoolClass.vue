<template>
  <AtomLoader
    v-if="status === 'pending'"
    class="fr-mx-auto"
  />
  <AtomAlert
    v-else-if="error"
    :alert-type="AlertType.Error"
    message="Les statistiques de la répartion des classes fréquentées n'ont pas pu être chargées."
  />

  <template v-else-if="schoolClassStats && schoolClassStats.length">
    <StatsList
      :total-count="beneficiaryCount"
      :stats="schoolClassStats"
      stats-bar
    />
  </template>
  <p v-else>
    Commencez à
    <NuxtLink :to="routes.beneficiary.AppBeneficiariesAdd.path()"
      >créer des fiches de bénéficiaires</NuxtLink
    >
    pour voir apparaître les statistiques de la répartition des classes
    fréquentées.
  </p>
</template>

<script lang="ts" setup>
  import type { StatFilterInput } from '~~/server/schema'
  import { AlertType } from '~/utils/constants/alert'
  import { routes } from '~/utils/routes'
  import { getStatLabel, beneficiarySchoolClassKeys } from '~~/client/options'

  const props = defineProps<{
    beneficiaryCount: number
    filters: StatFilterInput
  }>()

  const trpcClient = useTrpcClient()

  const { data, error, status } =
    await trpcClient.crossStructureStat.getSchoolClassStats.useQuery(
      toRef(() => props.filters)
    )

  const schoolClassStats = computed(
    () =>
      data.value?.map(({ _count, schoolClass }) => ({
        key: schoolClass || 'null',
        label: getStatLabel(beneficiarySchoolClassKeys.byKey, schoolClass),
        count: _count
      })) || []
  )
</script>
