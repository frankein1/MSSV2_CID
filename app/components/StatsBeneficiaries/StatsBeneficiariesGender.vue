<template>
  <AtomLoader
    v-if="status === 'pending'"
    class="fr-mx-auto"
  />
  <AtomAlert
    v-else-if="error"
    :alert-type="AlertType.Error"
    message="Les statistiques de la répartion des genres n'ont pas pu être chargées."
  />
  <template v-else-if="genderStats && genderStats.length">
    <StatsPie
      pie-label="Répartion des genres"
      :stats="genderStats"
      :total-count="beneficiaryCount"
      :not-filled-route="
        routes.beneficiary.AppBeneficiaries.path({
          notFilled: FilterBeneficiaryNotFilled.Gender
        })
      "
    />
  </template>
  <p v-else>
    Commencez à
    <NuxtLink :to="routes.beneficiary.AppBeneficiariesAdd.path()"
      >créer des fiches de bénéficiaires</NuxtLink
    >
    pour voir apparaître les statistiques de la répartition des genres.
  </p>
</template>

<script lang="ts" setup>
  import { Gender } from '@prisma/client'
  import { AlertType } from '~/utils/constants/alert'
  import { routes } from '~/utils/routes'
  import type { StatFilterInput } from '~~/server/schema'
  import { getStatColor } from '~~/client/colors/stats'
  import { getStatLabel, beneficiaryGenderKeys } from '~~/client/options'
  import type { StatsPiePropType } from '~~/types/stat'
  import { FilterBeneficiaryNotFilled } from '~/utils/constants/filters'
  import { ChartColor } from '~/utils/color/chartColors'

  const GenderColor = {
    [Gender.Female]: ChartColor.Peach,
    [Gender.Male]: ChartColor.LightBlue,
    [Gender.Other]: ChartColor.Yellow
  }

  const props = defineProps<{
    beneficiaryCount: number
    filters: StatFilterInput
  }>()

  const trpcClient = useTrpcClient()

  const { data, error, status } =
    await trpcClient.crossStructureStat.getGenderStats.useQuery(
      toRef(() => props.filters)
    )
  const genderStats = computed(
    () =>
      (data.value?.map(({ _count, gender }) => ({
        key: gender,
        label: getStatLabel(beneficiaryGenderKeys.byKey, gender),
        color: getStatColor(GenderColor, gender),
        count: _count
      })) || []) as StatsPiePropType
  )
</script>
