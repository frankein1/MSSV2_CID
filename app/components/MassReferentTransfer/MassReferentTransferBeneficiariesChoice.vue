<template>
  <AtomLazyComponent
    :pending="pending"
    :error="!!error"
    message="La liste des bénéficiaires n'a pas pu être chargée."
  >
    <div class="beneficiaries-choice">
      <p class="fr-text--bold">{{ summarySelected }}</p>

      <p v-if="editionChoice === 'delete'">
        Vous ne pouvez pas séléctionner des dossiers bénéficiaires qui ont moins
        de 2 agents référents.
      </p>
      <AtomAlert
        v-if="
          selectedBeneficiaries.length >= MAX_BENEFICIARIES_REFERENT_TRANSFER
        "
        :alert-type="AlertType.Warning"
        :message="`Nombre total de dossiers bénéficiaires sélectionnés atteint`"
        size="sm"
        class="fr-mb-4v"
      >
        <template #detailedMessage>
          <p>
            Vous pouvez sélectionner jusqu'à
            {{ MAX_BENEFICIARIES_REFERENT_TRANSFER }} dossiers bénéficiaires
            maximum.
          </p>
        </template>
      </AtomAlert>
      <BeneficiaryTable
        v-model:sort="orderBy"
        v-model:selected-beneficiaries="selectedBeneficiaries"
        class="order-2"
        :beneficiary-list="items"
        :pending="pending"
        :selection-limit="MAX_BENEFICIARIES_REFERENT_TRANSFER"
        :disabled-beneficiary-ids="disabledBeneficiaryIds"
        selectable
        show-referents
      />
      <AtomPagination
        class="fr-mt-4w fr-px-5v order-2"
        :page="page"
        :per-page="perPage"
        :total-pages="totalPages"
        @change-page="updatePagination($event)"
      />
      <MassReferentTransferStepButtons
        class="order-1"
        :disable-next="
          selectedBeneficiaries.length < 1 ||
          selectedBeneficiaries.length > MAX_BENEFICIARIES_REFERENT_TRANSFER
        "
        @previous="emit('previous')"
        @next="emit('next')"
      />
    </div>
  </AtomLazyComponent>
</template>

<script setup lang="ts">
  import { AlertType } from '~/utils/constants/alert'
  import {
    BENEFICIARIES_REQUEST_LIMIT_DEFAULT,
    MAX_BENEFICIARIES_REFERENT_TRANSFER
  } from '~/utils/constants'
  import { SortOrder, type BeneficiarySort } from '~~/types/table'
  import type { BeneficiaryFilterInput } from '~~/server/schema'
  import type { BeneficiaryListItem } from './types'

  const props = defineProps<{
    filters: BeneficiaryFilterInput
  }>()

  const emit = defineEmits<{
    previous: []
    next: []
  }>()

  // beneficiary list query
  const page = ref(1)
  const perPage = ref(BENEFICIARIES_REQUEST_LIMIT_DEFAULT)
  const orderBy = ref<BeneficiarySort>({ usualName: SortOrder.Asc })
  const {
    selectedBeneficiaries,
    editionChoice,
    summarySelected,
    totalBeneficiaries
  } = useMassReferentTransferState()

  const computedFilters = computed(() => props.filters)

  const trpcClient = useTrpcClient()
  const { updatePagination } = usePagination(page, perPage, computedFilters)

  const queryInput = computed(() => ({
    page: page.value,
    perPage: perPage.value,
    orderBy: {},
    filters: props.filters,
    referents: true
  }))

  const {
    data: pageData,
    pending,
    error
  } = await trpcClient.beneficiary.getBeneficiaryList.useQuery(queryInput)
  watch(
    () => pageData.value?.count,
    count => {
      totalBeneficiaries.value = count || 0
    },
    { immediate: true }
  )

  const items = computed(
    () => (pageData.value?.items as Array<BeneficiaryListItem>) || []
  )

  const totalPages = computed(() => pageData.value?.totalPages || 0)

  const disabledBeneficiaryIds = computed(() => {
    if (editionChoice.value !== 'delete') {
      return []
    }
    return items.value
      .filter(
        b => b.familyFile?.referents && b.familyFile.referents?.length <= 1
      )
      .map(b => b.id)
  })
</script>

<style lang="scss" scoped>
  .beneficiaries-choice {
    display: flex;
    flex-flow: column wrap;

    .order-1 {
      order: 1;
    }

    .order-2 {
      order: 2;
      width: 100%;
    }
  }
</style>
