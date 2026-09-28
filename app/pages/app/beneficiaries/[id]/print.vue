<!--
  This page allows to easily print the beneficiary details in a valid design.
  It improves cross-browser compatibility that is not easily reachable with print media queries.
-->

<template>
  <div>
    <AtomAlert
      v-if="error"
      :alert-type="AlertType.Error"
      message="Les informations du bénéficiaire n'ont pas pu être chargées."
    />
    <AtomLoader
      v-else-if="pending"
      class="fr-mx-auto"
    />
    <div class="fr-container">
      <div class="fr-grid-column">
        <div
          v-if="beneficiary"
          class="fr-col-12"
        >
          <h1>{{ formatBeneficiaryDisplayName(beneficiary.general) }}</h1>
          <BeneficiaryInfoHeader :beneficiary="beneficiary" />
          <template v-if="socialSupportSubjects.length">
            <hr />
            <p class="fr-text--bold">Accompagnements</p>
            <p>{{ socialSupportSubjects }}</p>
          </template>
          <hr class="fr-mt-2w" />
          <p class="fr-text--bold">Information générales</p>
          <BeneficiaryInfoGeneralContent :general="beneficiary.general" />

          <hr
            v-if="hasTaxHouseholds"
            class="fr-mt-2w"
          />
          <p class="fr-text--bold">Situation familiale</p>
          <BeneficiaryInfoTaxHouseholdsContent
            v-if="hasTaxHouseholds && beneficiary.taxHouseholds"
            :beneficiary-id="beneficiaryId"
            :tax-households="beneficiary.taxHouseholds"
          />
          <template v-if="beneficiary.entourages?.length">
            <hr class="entourage" />
            <p class="fr-text--bold">Entourage</p>
          </template>
          <BeneficiaryInfoEntouragesContent
            v-if="beneficiary.entourages"
            :entourages="beneficiary.entourages"
          />
          <template v-if="beneficiary.health">
            <hr />
            <p class="fr-text--bold">Santé</p>
          </template>
          <!-- <BeneficiaryInfoHealthContent
            v-if="beneficiary.health"
            :health="beneficiary.health"
          /> -->
          <template v-if="beneficiary.occupationIncome">
            <hr />
            <p class="fr-text--bold">Activité</p>
          </template>
          <BeneficiaryInfoOccupationIncomeContent
            v-if="beneficiary.occupationIncome"
            :occupation-income="beneficiary.occupationIncome"
          />
          <template v-if="beneficiary.externalOrganisations">
            <hr />
            <p class="fr-text--bold">Partenaires</p>
          </template>
          <BeneficiaryInfoExternalOrganisationsContent
            v-if="beneficiary.externalOrganisations"
            :external-organisations="beneficiary.externalOrganisations"
          />
          <template v-if="beneficiary.supportPrograms?.length">
            <hr />
            <p class="fr-text--bold">Parcours et dispositifs</p>
          </template>
          <BeneficiaryInfoSupportProgramsContent
            v-if="beneficiary.supportPrograms?.length"
            :support-programs="beneficiary.supportPrograms"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { AlertType } from '~/utils/constants/alert'
  import { routes } from '~/utils/routes'
  import { BeneficiaryAction, EventCategory } from '~~/types/matomo'

  definePageMeta({
    layout: false
  })

  const route = useRoute()
  const trpcClient = useTrpcClient()

  const beneficiaryId = route.params.id as string

  const {
    data,
    pending: beneficiaryPending,
    error: beneficiaryError
  } = await trpcClient.beneficiary.getBeneficiaryDetails.useQuery({
    id: beneficiaryId
  })

  const pending = computed(() => beneficiaryPending.value)
  const error = computed(() => beneficiaryError.value)

  const beneficiary = computed(() => data.value?.beneficiary || null)

  const hasTaxHouseholds = computed(() => {
    const taxHouseholds = beneficiary.value?.taxHouseholds
    return !(
      !taxHouseholds?.caregiver &&
      !taxHouseholds?.divorceDate &&
      !taxHouseholds?.familySituation &&
      !taxHouseholds?.majorChildren &&
      !taxHouseholds?.minorChildren &&
      !taxHouseholds?.weddingDate
    )
  })

  useHead({
    title: routes.beneficiary.AppBeneficiaryPrint.title(
      beneficiary.value?.general || null
    )
  })

  const socialSupportSubjects = computed(() =>
    (data.value?.beneficiary.history.subjects || [])
      .map(({ name }) => name)
      .join(', ')
  )

  onMounted(() => {
    useMatomo().trackEvent(EventCategory.Beneficiary, BeneficiaryAction.Print)
    window.addEventListener('afterprint', onAfterPrint)
    window.print()
  })

  onUnmounted(() => {
    window.removeEventListener('afterprint', onAfterPrint)
  })

  function onAfterPrint() {
    navigateTo(
      routes.file.AppFile.path(beneficiary.value?.familyFileId, {
        beneficiaryId
      })
    )
  }
</script>

<style lang="scss" scoped>
  @media print {
    :deep(.fr-icon-success-line::before) {
      content: '✅';
    }

    :deep(.fr-icon-close-circle-line::before) {
      content: '❌';
    }

    :deep(.fr-container) {
      max-width: none;
      padding: 0;
    }
  }
</style>
