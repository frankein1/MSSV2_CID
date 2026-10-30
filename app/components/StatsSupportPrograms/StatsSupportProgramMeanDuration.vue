<template>
  <div class="feature-section fr-p-6v">
    <AtomLoader
      v-if="status === 'pending'"
      class="fr-mx-auto"
    />
    <AtomAlert
      v-else-if="error"
      :alert-type="AlertType.Error"
      message="La durée moyenne dans un dispositif n'a pas pu être chargée."
    />
    <template v-else>
      <p
        v-if="supportProgramCount > 0"
        class="fr-mb-2v"
      >
        <span class="title-blue fr-h4">{{ meanDurationLabel }}</span> : durée
        moyenne dans un dispositif.
      </p>
      <p class="fr-text--sm text--muted fr-mb-0">
        {{ supportProgramCountLabel }}
      </p>
    </template>
  </div>
</template>

<script lang="ts" setup>
  import { AlertType } from '~/utils/constants/alert'
  import type { SupportProgramStatFilterInput } from '~~/server/schema'

  const props = defineProps<{
    filters: SupportProgramStatFilterInput
  }>()
  const trpc = useTrpcClient()
  const { data, status, error } =
    await trpc.crossStructureStat.getSupportProgramMeanDurationStats.useQuery(
      toRef(() => props.filters)
    )

  const plural = (word: string, q: number, end = 's') =>
    q > 1 ? `${word}${end}` : word

  const supportProgramCount = computed(
    () => data.value?.supportProgramCount ?? 0
  )

  const meanDurationLabel = computed(() => {
    const days = data.value?.meanDurationInDays ?? 0
    return `${days} ${plural('jour', days)}`
  })

  const supportProgramCountLabel = computed(() => {
    const count = supportProgramCount.value
    if (count === 0) {
      return 'Aucun dispositif renseigné avec une date d’entrée et une date de sortie.'
    }
    return `Calculée sur ${count} ${plural('dispositif', count)} ${plural('renseigné', count)} avec une date d’entrée et une date de sortie, toutes les deux comprises dans la période séléctionnée.`
  })
</script>
