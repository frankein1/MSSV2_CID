<template>
  <AtomLazyComponent
    :pending="status === 'pending'"
    :error="Boolean(error)"
    message="La liste des ateliers n'a pas pu être chargée."
  >
    <WorkshopListFilters v-model="listFilters" />

    <WorkshopListEmpty
      v-if="workshopList.length === 0"
      :is-filtered
      :time-direction
    />
    <template v-else>
      <div class="workshop-export">
        <p class="fr-mb-0">
          {{ data?.count }}
          {{
            timeDirection === FilterWorkshopTimeDirection.Future
              ? 'ateliers à venir'
              : 'ateliers passés'
          }}
        </p>
      </div>

      <ul class="workshop-list">
        <li
          v-for="month in groupAndSortWorkshops(
            workshopList,
            timeDirection !== FilterWorkshopTimeDirection.Past
          )"
          :key="month[0]"
        >
          <p
            role="heading"
            aria-level="3"
            class="workshop-month"
          >
            {{ month[0] }}
          </p>
          <ul class="workshop-list">
            <li
              v-for="workshop in month[1]"
              :key="workshop.id"
            >
              <WorkshopListItem
                :workshop="workshop"
                :time-direction
              />
            </li>
          </ul>
        </li>
      </ul>

      <AtomPagination
        class="fr-mt-4w fr-px-5v"
        :page="page"
        :per-page="perPage"
        :total-pages="totalPages"
        @change-page="updatePagination($event)"
      />
    </template>
  </AtomLazyComponent>
</template>

<script setup lang="ts">
  import { WORKSHOPS_REQUEST_LIMIT_DEFAULT } from '~/utils/constants'
  import type { WorkshopsPageItems } from './types'
  import { FilterWorkshopTimeDirection } from '~/utils/constants/filters'

  const trpcClient = useTrpcClient()
  const page = ref(1)
  const perPage = ref(WORKSHOPS_REQUEST_LIMIT_DEFAULT)
  const listFilters = ref({})
  const filters = computed(() => ({ timeDirection, ...listFilters.value }))
  const isFiltered = computed(() => Object.keys(listFilters.value).length > 0)

  const { timeDirection = FilterWorkshopTimeDirection.Future } = defineProps<{
    timeDirection?: FilterWorkshopTimeDirection
  }>()

  const totalPages = computed(() => data.value?.totalPages || 0)
  const { updatePagination } = usePagination(page, perPage, filters)

  const workshopListQueryInput = computed(() => ({
    page: page.value,
    perPage: perPage.value,
    filter: filters.value
  }))

  const { status, error, data } = await trpcClient.workshop.getPage.useQuery(
    workshopListQueryInput
  )

  const workshopList: ComputedRef<WorkshopsPageItems> = computed(
    () => data.value?.items || []
  )

  function groupAndSortWorkshops(
    workshops: WorkshopsPageItems,
    asc: boolean
  ): Map<string, typeof workshops> {
    const months = [
      'janvier',
      'février',
      'mars',
      'avril',
      'mai',
      'juin',
      'juillet',
      'août',
      'septembre',
      'octobre',
      'novembre',
      'décembre'
    ]

    // Regroupement par mois/année avec clé technique "YYYY-MM"
    const tempGroups: Record<
      string,
      { label: string; items: typeof workshops }
    > = {}

    for (const workshop of workshops) {
      const year = formatDate(workshop.date, 'YYYY')
      const monthIndex = parseInt(formatDate(workshop.date, 'M'))
      const key = `${year}-${formatDate(workshop.date, 'MM')}` // ex: "2025-03"
      const label = `${months[monthIndex - 1]} ${year}` // ex: "mars 2025"

      if (!tempGroups[key]) {
        tempGroups[key] = { label, items: [] }
      }

      tempGroups[key].items.push(workshop)
    }

    // Trie les groupes par date (YYYY-MM)
    const sortedKeys = Object.keys(tempGroups).sort((a, b) =>
      asc ? a.localeCompare(b) : b.localeCompare(a)
    )
    // Trie interne de chaque groupe, puis remplissage de la Map finale
    const result = new Map<string, typeof workshops>()
    for (const key of sortedKeys) {
      const group = tempGroups[key]
      if (!group) {
        continue
      }
      group.items.sort((a, b) =>
        asc
          ? a.date.getTime() - b.date.getTime()
          : b.date.getTime() - a.date.getTime()
      )
      result.set(group.label, group.items)
    }

    return result
  }
</script>

<style scoped lang="scss">
  @use '@gouvfr/dsfr/src/module/media-query' as dsfr-media-query;

  .feature-section {
    margin-bottom: 1.5rem;
  }

  .workshop-list {
    --ul-start: 0;
    --xl-block: 0;
    --ul-type: none;
  }

  .workshop-month {
    font-size: 1.25rem;
    font-weight: 700;
    text-transform: uppercase;
    margin-bottom: 0.5rem;
  }

  .workshop-export {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 2rem;

    @include dsfr-media-query.respond-from('sm') {
      flex-direction: row;
      justify-content: space-between;
      align-items: baseline;
    }
  }
</style>
