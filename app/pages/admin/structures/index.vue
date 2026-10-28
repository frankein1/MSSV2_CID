<template>
  <PageContainer class="fr-p-5w">
    <PageTitle title="Structures" />
    <div class="fr-grid-row fr-grid-row--gutters fr-grid-row--bottom">
      <div class="fr-col-12 fr-col-lg-8 fr-col-xl-9">
        <div class="fr-input-group">
          <label
            class="fr-label"
            for="search-structure"
          >
            Recherche une structure
            <span class="fr-hint-text">Par nom ou code postal</span>
          </label>
          <div class="fr-input-wrap fr-input-wrap--addon">
            <input
              id="search-structure"
              class="fr-input"
              aria-describedby="search-structure-messages"
              type="text"
              @change="onSearch"
            />
            <button
              type="submit"
              class="fr-btn"
            >
              Chercher
            </button>
          </div>

          <div
            id="search-structure-messages"
            class="fr-messages-group"
            aria-live="polite"
          ></div>
        </div>
      </div>

      <div class="fr-col-12 fr-col-lg-4 fr-col-xl-3">
        <NuxtLink
          class="fr-btn fr-btn--icon-left fr-icon-add-line"
          :to="routes.admin.AdminStructureAdd.path()"
        >
          {{ routes.admin.AdminStructureAdd.title }}
        </NuxtLink>
      </div>
    </div>
    <StructureTableAdmin
      v-show="!pending"
      :structures="structures"
    />
  </PageContainer>
</template>
<script lang="ts" setup>
  import { routes } from '~/utils/routes'

  const trpcClient = useTrpcClient()

  const search = ref<string>()

  const queryInput = computed(() => ({
    search: search.value
  }))

  const { data, pending } =
    await trpcClient.admin.getStructures.useQuery(queryInput)

  const structures = computed(() => data.value?.structures || [])

  function onSearch(event: Event) {
    const input = event.target as HTMLInputElement
    const value = input.value.trim()
    search.value = value
  }
</script>
