<template>
  <AtomLoader
    v-if="status === 'pending'"
    class="fr-mx-auto"
  />
  <AtomAlert
    v-else-if="error"
    :alert-type="AlertType.Error"
    message="Les statistiques de fréquentation des établissements REP n'ont pas pu être chargées."
  />
  <template v-else-if="repClassificationStats && repClassificationStats.length">
    <StatsPie
      pie-label="Fréquentation des établissements REP"
      :stats="repClassificationStats"
      :total-count="beneficiaryCount"
    />
  </template>
  <p v-else>
    Commencez à
    <NuxtLink :to="routes.beneficiary.AppBeneficiariesAdd.path()"
      >créer des fiches de bénéficiaires</NuxtLink
    >
    pour voir apparaître les statistiques de fréquentation des établissements
    REP.
  </p>
</template>

<script lang="ts" setup>
  import { RepClassification } from '@prisma/client'
  import type { StatFilterInput } from '~~/server/schema'
  import { AlertType } from '~/utils/constants/alert'
  import { routes } from '~/utils/routes'
  import type { StatsPiePropType } from '~~/types/stat'
  import { ChartColor } from '~/utils/color/chartColors'
  import { repClassificationStatLabels } from '~~/client/labels/school.labels'

  const NonRepKey = 'NonRep'
  const SchoolNotFilledKey = 'SchoolNotFilled'

  const RepClassificationColor = {
    [NonRepKey]: ChartColor.Yellow,
    [RepClassification.Rep]: ChartColor.Peach,
    [RepClassification.RepPlus]: ChartColor.LightBlue,
    [SchoolNotFilledKey]: ChartColor.Gray
  }

  const props = defineProps<{
    beneficiaryCount: number
    filters: StatFilterInput
  }>()

  const trpcClient = useTrpcClient()

  const { data, error, status } =
    await trpcClient.crossStructureStat.getRepClassificationStats.useQuery(
      toRef(() => props.filters)
    )

  const repClassificationStats = computed(
    () =>
      (data.value?.map(({ _count, repClassification }) => ({
        key: repClassification,
        label: repClassificationStatLabels[repClassification],
        color: RepClassificationColor[repClassification],
        count: _count
      })) || []) as StatsPiePropType
  )
</script>
