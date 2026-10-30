<template>
  <AtomLoader
    v-if="status === 'pending'"
    class="fr-mx-auto"
  />
  <AtomAlert
    v-else-if="error"
    :alert-type="AlertType.Error"
    message="Le nombre d’entrées et de sorties n’a pas pu être chargé."
  />
  <StatsTable
    v-else-if="stats.length"
    :stats="stats"
    :headers="['Dispositifs', 'Entrées', 'Sorties', 'En cours']"
  />
  <p v-else>Aucun dispositif ne correspond aux filtres sélectionnés.</p>
</template>

<script lang="ts" setup>
  import type { SupportProgramStatFilterInput } from '~~/server/schema'
  import { AlertType } from '~/utils/constants/alert'
  import type { StatsTablePropType } from '~~/types/stat'

  const props = defineProps<{
    filters: SupportProgramStatFilterInput
  }>()

  const trpc = useTrpcClient()
  const { data, status, error } =
    await trpc.crossStructureStat.getSupportProgramEntriesExitsStats.useQuery(
      toRef(() => props.filters)
    )

  const stats = computed<StatsTablePropType>(
    () =>
      data.value?.map(({ name, entries, exits, ongoing }) => [
        name,
        entries,
        exits,
        ongoing
      ]) ?? []
  )
</script>
