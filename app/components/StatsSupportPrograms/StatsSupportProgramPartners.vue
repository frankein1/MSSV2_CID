<template>
  <AtomLoader
    v-if="status === 'pending'"
    class="fr-mx-auto"
  />
  <AtomAlert
    v-else-if="error"
    :alert-type="AlertType.Error"
    message="Le nombre de bénéficiaires par partenaire n’a pas pu être chargé."
  />
  <StatsList
    v-else-if="partnerStats.length"
    :stats="partnerStats"
    :total-count="data?.total"
    :with-sum="false"
  />
  <p v-else>Aucun dispositif ne correspond aux filtres sélectionnés.</p>
</template>

<script lang="ts" setup>
  import type { SupportProgramStatFilterInput } from '~~/server/schema'
  import { AlertType } from '~/utils/constants/alert'
  import type { StatsListPropType } from '~~/types/stat'
  import { STATS_NULL_KEY, STATS_NULL_LABEL } from '~/utils/constants/stats'

  const props = defineProps<{
    filters: SupportProgramStatFilterInput
  }>()
  const trpc = useTrpcClient()

  const { data, status, error } =
    await trpc.crossStructureStat.getSupportProgramPartnerStats.useQuery(
      toRef(() => props.filters)
    )

  const partnerStats: Ref<StatsListPropType> = computed(
    () =>
      data.value?.partners.map(({ id, name, _count }) => ({
        key: id ?? STATS_NULL_KEY,
        label: name ?? STATS_NULL_LABEL,
        count: _count
      })) ?? []
  )
</script>
