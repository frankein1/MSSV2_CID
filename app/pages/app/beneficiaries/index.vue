<template>
  <PageContainer no-max-width>
    <AtomBreadcrumb :links="breadcrumbs.beneficiary.AppBeneficiaries()" />
    <div class="beneficiaries-header">
      <PageTitle
        class="title"
        no-margin
        :title="title"
      />
      <NuxtLink
        :to="routes.file.AppFileAdd.path()"
        class="fr-btn fr-btn--lg fr-btn--icon-left fr-icon-user-add-line action"
      >
        Créer un dossier bénéficiaire
      </NuxtLink>
    </div>
    <div class="fr-grid-row fr-grid-row--gutters fr-mt-3w">
      <div class="fr-col-12">
        <h2 class="fr-sr-only">Filtres</h2>
        <section class="feature-section beneficiary-filters">
          <BeneficiaryFilters @filter="filters = $event" />
        </section>
        <section class="feature-section fr-mt-2w">
          <h2 class="fr-sr-only">Liste des bénéficiaires</h2>
          <AtomAlert
            v-if="error"
            class="fr-mx-5v"
            :alert-type="AlertType.Error"
            message="La liste des bénéficiaires n'a pas pu être chargée."
          />
          <template v-else>
            <div class="fr-mb-2w results-container">
              <p class="results-count">
                {{ beneficiariesCount }} bénéficiaire(s)
              </p>
              <AtomDropdownDisclosure
                dropdown-btn-class="fr-btn--tertiary-no-outline"
                label="Options"
                icon="fr-icon-more-line"
                align-right
                :menus="optionMenu"
              />
            </div>
            <div v-if="pending">
              <AtomLoader class="fr-mx-auto" />
            </div>
            <template v-else>
              <BeneficiaryTable
                v-model:sort="orderBy"
                :beneficiary-list="items"
                :pending="pending"
              />
              <AtomPagination
                class="fr-mt-4w fr-px-5v"
                :page="page"
                :per-page="perPage"
                :total-pages="totalPages"
                @change-page="updatePagination($event)"
              />
            </template>
          </template>
        </section>
      </div>
    </div>
  </PageContainer>
</template>

<script lang="ts" setup>
  import {
    FAILED_DOWNLOAD_ERROR_MESSAGE,
    INVALID_CODE_ERROR_MESSAGE,
    BENEFICIARIES_REQUEST_LIMIT_DEFAULT
  } from '~/utils/constants'
  import type { BeneficiaryFilterInput } from '~~/server/schema'
  import { AlertType } from '~/utils/constants/alert'
  import type { BeneficiarySort } from '~~/types/table'
  import { SortOrder } from '~~/types/table'
  import { getExportUrl } from '~/utils/export/getExportUrl'
  import { getExportFilename } from '~/utils/export/getExportFilename'
  import { routes } from '~/utils/routes'
  import { breadcrumbs } from '~/utils/breadcrumbs'
  import type { FilterBeneficiaryNotFilled } from '~/utils/constants/filters'
  import { EventCategory, BeneficiaryAction } from '~~/types/matomo'
  import { isTRPCClientError } from '~/utils/error'
  import type { MenuItem } from '~~/types/menu'
  import ExportDataConfirm from '~/components/ExportData/ExportDataConfirm.vue'

  const title = routes.beneficiary.AppBeneficiaries.title

  useHead({ title })

  definePageMeta({
    name: routes.beneficiary.AppBeneficiaries.name
  })

  const route = useRoute()
  const filtersState = useFilters()
  const trpcClient = useTrpcClient()
  const modal = useModal()
  const { application } = usePermissions()

  const notFilled = route.query['not-filled'] as FilterBeneficiaryNotFilled
  if (notFilled) {
    if (filtersState.beneficiary.value) {
      filtersState.beneficiary.value.notFilled = notFilled
    } else {
      filtersState.beneficiary.value = { notFilled }
    }
  }

  const filters = ref<BeneficiaryFilterInput>(
    filtersState.beneficiary.value || {}
  )
  const orderBy = ref<BeneficiarySort>({ usualName: SortOrder.Asc })
  const page = ref(1)
  const perPage = ref(BENEFICIARIES_REQUEST_LIMIT_DEFAULT)
  const isDownloading = ref(false)

  const { updatePagination } = usePagination(page, perPage, filters)

  const queryInput = computed(() => ({
    page: page.value,
    perPage: perPage.value,
    orderBy: orderBy.value,
    filters: filters.value
  }))

  const {
    data: pageData,
    pending,
    error
  } = await trpcClient.beneficiary.getBeneficiaryList.useQuery(queryInput)

  const beneficiariesCount = computed(() => pageData.value?.count || 0)

  const items = computed(() => pageData.value?.items || [])

  const totalPages = computed(() => pageData.value?.totalPages || 0)

  async function exportBeneficiaries(code: string) {
    isDownloading.value = true
    useMatomo().trackEvent(
      EventCategory.ExportBeneficiary,
      BeneficiaryAction.ExportAll
    )

    try {
      const exportedBeneficiaries =
        await trpcClient.beneficiary.exportBeneficiaries.query({
          code,
          orderBy: orderBy.value,
          filters: filters.value
        })
      if (!exportedBeneficiaries.data) {
        throw new Error('no data')
      }
      const downloadLink = document.createElement('a')
      downloadLink.href = getExportUrl(exportedBeneficiaries.data)
      downloadLink.download = getExportFilename('beneficiaires')
      downloadLink.click()
      downloadLink.remove()

      modal.close()
    } catch (err: unknown) {
      if (isTRPCClientError(err)) {
        const msg =
          err.data?.code === 'FORBIDDEN'
            ? INVALID_CODE_ERROR_MESSAGE
            : FAILED_DOWNLOAD_ERROR_MESSAGE
        useSnackbar().error(msg)
      } else {
        useSnackbar().error(FAILED_DOWNLOAD_ERROR_MESSAGE)
      }
    } finally {
      isDownloading.value = false
    }
  }

  // Option menu
  const optionMenu: MenuItem[] = [
    {
      label: 'Exporter le tableau (.xlsx)',
      icon: 'fr-icon-download-line',
      onClick: _item => {
        exportConfirm()
      }
    }
  ]
  if (application.value.edit.beneficiary.referent) {
    optionMenu.push({
      label: 'Modifier agent référent',
      icon: 'fr-icon-user-line',
      href: routes.beneficiary.AppBeneficiariesReferentTransfer.path()
    })
  }

  function exportConfirm() {
    modal.open(ExportDataConfirm, {
      title: 'Attention aux données des bénéficiaires',
      triggerOpen: true,

      hasFilters: true,
      export: (code: string) => exportBeneficiaries(code)
    })
  }
</script>

<style lang="scss" scoped>
  @use '@gouvfr/dsfr/src/module/media-query' as dsfr-media-query;

  .beneficiaries-header {
    display: grid;
    gap: 0.5rem;
    grid-template-areas: 'title' 'action';
    grid-template-columns: auto max-content;
    align-items: center;
  }

  @include dsfr-media-query.respond-from('lg') {
    .beneficiaries-header {
      grid-template-areas: 'title action';
    }
  }

  .title {
    grid-area: title;
  }

  .action {
    grid-area: action;
  }

  .results-container :deep(.fr-icon-more-line::after) {
    transform: rotate(90deg);
  }

  /* stylelint-disable selector-class-pattern */
  .beneficiary-filters {
    :deep(.fromAge),
    :deep(.toAge) {
      .fr-input-wrap::before {
        bottom: 0.75rem;
        margin: auto;
        pointer-events: none;
        position: absolute;
        right: 1.75rem;
        top: 0.75rem;
        content: 'an(s)';
        line-height: 1rem;
      }

      .fr-input {
        padding-right: 4rem;
      }
    }
  }
  /* stylelint-enable selector-class-pattern */
</style>
