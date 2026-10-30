<template>
  <AtomLoader
    v-if="status === 'pending'"
    class="fr-mx-auto"
  />
  <AtomAlert
    v-else-if="error"
    :alert-type="AlertType.Error"
    message="Les statistiques de la répartition des motifs de réorientation n'ont pas pu être chargées."
  />
  <template v-else-if="data?.reasons.length">
    <StatsList
      :total-count="totalCount"
      :stats="helpRequestsWithReason"
      :display-total="false"
      stats-bar
    />

    <hr />
    <p
      :id="headingId"
      class="fr-text--xs text--muted fr-text--bold fr-mb-0 text--uppercase"
    >
      Répartition des motifs de réorientation
    </p>
    <p class="fr-text--xs text--muted">
      Pourcentage calculé sur le total d'instructions de dossiers. Une demande
      d'aide pouvant donner lieu à plusieurs réorientations, la somme des
      pourcentages peut être supérieure à 100&nbsp;%.
    </p>
    <StatsList
      :labelledby="headingId"
      :total-count="totalCount"
      :stats="reasonStats"
      :with-sum="false"
    />
  </template>
  <p v-else>
    Commencez à créer des instructions de dossiers dans les fiches de
    bénéficiaires pour voir apparaître les statistiques de la répartition des
    motifs de réorientation.
  </p>
</template>

<script lang="ts" setup>
  import type { StatFilterInput } from '~~/server/schema'
  import { AlertType } from '~/utils/constants/alert'
  import { SupportColor } from '~~/client/colors/support'

  const props = defineProps<{
    totalCount: number
    filters: StatFilterInput
  }>()

  const headingId = useId()

  const trpcClient = useTrpcClient()
  const { data, error, status } =
    await trpcClient.crossStructureStat.getHelpRequestRedirectionReasonsStats.useQuery(
      toRef(() => props.filters)
    )

  const helpRequestsWithReason = computed(() => [
    {
      key: 'helpRequestsWithReason',
      label:
        'Instructions de dossiers avec un motif de réorientation renseigné',
      color: SupportColor.helpRequests,
      emphasis: true,
      count: data.value?.helpRequestsWithReason._count ?? 0
    }
  ])

  const reasonStats = computed(
    () =>
      data.value?.reasons.map(({ id, name, _count }) => ({
        key: id,
        label: name,
        color: SupportColor.helpRequests,
        emphasis: false,
        count: _count
      })) ?? []
  )
</script>
