<template>
  <AtomLoader
    v-if="status === 'pending'"
    class="fr-mx-auto"
  />
  <AtomAlert
    v-else-if="error"
    :alert-type="AlertType.Error"
    message="Les statistiques de la répartition des réorientations n'ont pas pu être chargées."
  />
  <template v-if="helpRequestsWithRedirections?.length">
    <StatsList
      :total-count="totalCount"
      :stats="helpRequestsWithRedirections"
      :display-total="false"
      stats-bar
    />
    <hr />
    <StatsList
      v-if="beneficiariesWithRedirections?.length"
      caption="Bénéficiaires avec au moins une réorientation"
      :total-count="beneficiaryTotalCount"
      :stats="beneficiariesWithRedirections"
      :display-total="false"
      stats-bar
    />
    <hr />
    <p
      v-if="redirectionTypes.length"
      class="fr-text--xs text--muted"
    >
      <span
        :id="headingId"
        class="fr-text--bold text--uppercase"
        >Répartition des réorientations</span
      >
      <br />
      Pourcentage calculé sur le total d'instructions de dossiers. Une demande
      d'aide pouvant donner lieu à plusieurs réorientations, la somme des
      pourcentages peut être supérieure à 100&nbsp;%.
    </p>
    <StatsList
      :labelledby="headingId"
      :total-count="totalCount"
      :stats="redirectionTypes"
      :with-sum="false"
    />
  </template>
  <p v-else>
    Commencez à créer d'instructions de dossiers dans les fiches de
    bénéficiaires pour voir apparaître les statistiques de la répartition des
    réorientations.
  </p>
</template>

<script lang="ts" setup>
  import type { StatFilterInput } from '~~/server/schema'
  import { AlertType } from '~/utils/constants/alert'
  import { SupportColor } from '~~/client/colors/support'

  const props = defineProps<{
    totalCount: number
    beneficiaryTotalCount: number
    filters: StatFilterInput
  }>()

  const headingId = useId()

  const trpcClient = useTrpcClient()
  const { data, error, status } =
    await trpcClient.crossStructureStat.getHelpRequestRedirectionsStats.useQuery(
      toRef(() => props.filters)
    )

  const helpRequestsWithRedirections = computed(() => {
    return [
      {
        key: 'helpRequestsWithRedirections',
        label: "Demandes d'aide avec au moins une réorientation",
        color: SupportColor.helpRequests,
        emphasis: true,
        count: data.value?.helpRequestsWithRedirections._count || 0
      }
    ]
  })

  const beneficiariesWithRedirections = computed(() => {
    return [
      {
        key: 'beneficiariesWithRedirections',
        label: 'Bénéficiaires avec au moins une réorientation',
        color: SupportColor.helpRequests,
        emphasis: true,
        count: data.value?.beneficiariesWithRedirections._count || 0,
        description:
          'Pourcentage calculé sur les bénéficiaires ayant au moins une instruction de dossier.'
      }
    ]
  })

  const redirectionTypes = computed(() => {
    const partners = data.value?.withTypeIsPartners.partners.map(partner => {
      return {
        key: partner.id,
        label: partner.name,
        color: SupportColor.helpRequests,
        emphasis: false,
        count: partner._count
      }
    })
    const redirectionWithPartners = [
      {
        key: 'redirectionWithPartners',
        label: 'Redirections avec partenaire renseigné',
        color: SupportColor.helpRequests,
        emphasis: true,
        count: data.value?.withTypeIsPartners._count || 0
      }
    ]
    partners
      ?.filter(p => p != null)
      .forEach(e => redirectionWithPartners.push(e))
    redirectionWithPartners.push(
      {
        key: 'withTypeIsIntern',
        label: 'Redirections internes',
        color: SupportColor.helpRequests,
        emphasis: true,
        count: data.value?.withTypeIsIntern._count || 0
      },
      {
        key: 'withTypeIsOther',
        label: 'Autres redirections',
        color: SupportColor.helpRequests,
        emphasis: true,
        count: data.value?.withTypeIsOther._count || 0
      }
    )
    return redirectionWithPartners
  })
</script>
