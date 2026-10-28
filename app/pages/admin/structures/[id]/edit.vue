<template>
  <PageContainer class="fr-p-5w">
    <NuxtLink
      :to="routes.admin.AdminStructure.path(structureId)"
      class="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-left-line fr-btn--icon-left fr-mb-6v"
    >
      {{ data?.structure.name || routes.admin.AdminStructure.title }}
    </NuxtLink>
    <PageTitle :title="routes.admin.AdminStructureEdit.title" />

    <div class="fr-grid-row fr-grid-row--gutters">
      <div class="fr-col-12">
        <div class="main-container fr-p-5w">
          <AtomLoader
            v-if="pending"
            class="fr-mx-auto"
          />
          <AtomAlert
            v-else-if="error"
            :alert-type="AlertType.Error"
            message="Les informations de la structure n'ont pas pu être chargées."
          />
          <StructureAdminInfoForm
            v-else-if="data"
            :structure="data.structure"
            :validate="onUpdateStructure"
            :cancel-path="routes.admin.AdminStructure.path(structureId)"
            :is-submitting="status === 'pending'"
          />
        </div>
      </div>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
  import type { StructureAdminInfoInput } from '~~/server/schema'
  import { AlertType } from '~/utils/constants/alert'
  import { routes } from '~/utils/routes'

  useHead({ title: routes.admin.AdminStructureEdit.title })

  const route = useRoute()
  const structureId = route.params.id as string
  const trpcClient = useTrpcClient()
  const snackbar = useSnackbar()

  const { data, pending, error, refresh } =
    await trpcClient.admin.getStructure.useQuery({ id: structureId })

  const router = trpcClient.admin
  const {
    mutate,
    error: updateError,
    status
  } = router.updateStructureInfo.useMutation()
  const onUpdateStructure = async (input: StructureAdminInfoInput) => {
    const structureUpdated = await mutate({ ...input, id: structureId })
    if (updateError.value || !structureUpdated) {
      snackbar.error(
        'La modification des informations de la structure a échoué.'
      )
      return
    }
    snackbar.success('Les informations de la structure ont été mises à jour.')
    // The details page shares this query key and reuses its cached data
    // instead of fetching again, so it must be refreshed before redirecting
    await refresh()
    navigateTo(routes.admin.AdminStructure.path(structureId))
  }
</script>
