<template>
  <AtomLoader
    v-if="status === 'pending'"
    class="fr-mx-auto"
  />
  <AtomAlert
    v-else-if="error"
    :alert-type="AlertType.Error"
    message="Les statistiques du nombre de suivis par bénéficiaire n'ont pas pu être chargées."
  />
  <template
    v-else-if="socialSupportCountStats && socialSupportCountStats.length"
  >
    <StatsList
      :total-count="beneficiaryCount"
      :stats="socialSupportCountStats"
      stats-bar
    />
  </template>
  <p v-else>
    Commencez à
    <NuxtLink :to="routes.beneficiary.AppBeneficiariesAdd.path()"
      >créer des fiches de bénéficiaires</NuxtLink
    >
    pour voir apparaître les statistiques du nombre de suivis par bénéficiaire.
  </p>
</template>

<script setup lang="ts">
  import { AlertType } from '~/utils/constants/alert'
  import { routes } from '~/utils/routes'
  import type { StatFilterInput } from '~~/server/schema'

  const props = defineProps<{
    beneficiaryCount: number
    filters: StatFilterInput
  }>()

  const trpcClient = useTrpcClient()

  const { data, error, status } =
    await trpcClient.crossStructureStat.getSocialSupportCountPerBeneficiaryStats.useQuery(
      toRef(() => props.filters)
    )

  const socialSupportCountStats = computed(
    () =>
      data.value
        ?.filter(({ _count }) => _count > 0)
        .map(({ key, label, _count }) => ({
          key,
          label,
          count: _count
        })) || []
  )
</script>
