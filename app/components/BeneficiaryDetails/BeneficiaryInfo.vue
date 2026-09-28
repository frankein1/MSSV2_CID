<template>
  <template v-if="beneficiary">
    <div class="fr-grid-row fr-mt-1w">
      <div class="fr-col-12 fr-col-xl-4 fr-my-2w">
        <h3 class="title fr-h4 fr-mb-0">
          {{ beneficiaryTitle }}
        </h3>
      </div>
      <div class="fr-col-12 fr-col-xl-8 detail-actions">
        <slot name="actions"></slot>
      </div>
    </div>

    <section class="feature-section fr-mt-1w fr-p-10v">
      <h4 class="fr-sr-only">Résumé</h4>
      <BeneficiaryInfoHeader :beneficiary="beneficiary" />
      <template v-if="beneficiary.history.subjects.length">
        <hr />
        <BeneficiaryInfoSocialSupportSubjects
          :social-support-subjects="beneficiary.history.subjects"
        />
      </template>
    </section>

    <BeneficiaryInfoGeneral
      :beneficiary-id="beneficiary.id"
      :general="beneficiary.general"
    />

    <!-- Situation familiale -->
    <BeneficiaryInfoTaxHouseholds
      v-if="hasTaxHouseholds && beneficiary.taxHouseholds"
      :beneficiary-id="beneficiary.id"
      :tax-households="beneficiary.taxHouseholds"
    />

    <BeneficiaryInfoEntourages
      v-if="beneficiary.entourages"
      :beneficiary-id="beneficiary.id"
      :entourages="beneficiary.entourages"
    />

    <!-- <BeneficiaryInfoHealth
      v-if="beneficiary.health"
      :beneficiary-id="beneficiary.id"
      :health="beneficiary.health"
    /> -->

    <BeneficiaryInfoOccupationIncome
      v-if="beneficiary.occupationIncome"
      :beneficiary-id="beneficiary.id"
      :occupation-income="beneficiary.occupationIncome"
    />

    <BeneficiaryInfoExternalOrganisations
      v-if="beneficiary?.externalOrganisations"
      :beneficiary-id="beneficiary.id"
      :external-organisations="beneficiary.externalOrganisations"
    />

    <BeneficiaryInfoSupportPrograms
      v-if="beneficiary?.supportPrograms?.length"
      :beneficiary-id="beneficiary.id"
      :support-programs="beneficiary.supportPrograms"
    />
  </template>
</template>

<script lang="ts" setup>
  import type { BeneficiaryDetailsOutput } from '~~/types/beneficiary'

  const { beneficiary } = defineProps<{
    beneficiary: BeneficiaryDetailsOutput
  }>()

  const beneficiaryTitle = computed(() => {
    const title = 'Informations'
    // if (beneficiary.general?.firstName) {
    //   title = title + ' ' + beneficiary.general.firstName
    // }
    // if (beneficiary.general?.usualName) {
    //   title = title + ' ' + beneficiary.general.usualName
    // }
    return title
  })

  const hasTaxHouseholds = computed(() => {
    const taxHouseholds = beneficiary.taxHouseholds
    return !(
      !taxHouseholds?.caregiver &&
      !taxHouseholds?.divorceDate &&
      !taxHouseholds?.familySituation &&
      !taxHouseholds?.majorChildren &&
      !taxHouseholds?.minorChildren &&
      !taxHouseholds?.weddingDate
    )
  })
</script>

<style lang="scss" scoped>
  @use '@gouvfr/dsfr/src/module/media-query' as dsfr-media-query;

  .title {
    color: var(--primary);
    align-self: center;
  }

  .fr-grid-row {
    align-items: center;
  }

  .detail-actions {
    margin-top: 1rem;

    @include dsfr-media-query.respond-from('xl') {
      margin-top: 0;
    }

    > :deep(ul) {
      @include dsfr-media-query.respond-from('xl') {
        justify-content: right;
      }
    }
  }
</style>
