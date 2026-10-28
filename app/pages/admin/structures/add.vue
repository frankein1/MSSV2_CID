<template>
  <PageContainer class="fr-p-5w">
    <NuxtLink
      :to="routes.admin.AdminStructures.path()"
      class="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-left-line fr-btn--icon-left fr-mb-6v"
    >
      {{ routes.admin.AdminStructures.title }}
    </NuxtLink>
    <PageTitle :title="routes.admin.AdminStructureAdd.title" />

    <div class="fr-grid-row fr-grid-row--gutters">
      <div class="fr-col-12">
        <div class="main-container fr-p-5w">
          <StructureAdminInfoForm
            :validate="onAddStructure"
            :cancel-path="routes.admin.AdminStructures.path()"
          />
        </div>
      </div>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
  import type { CreateStructureInput } from '~~/server/schema'
  import { routes } from '~/utils/routes'

  useHead({ title: routes.admin.AdminStructureAdd.title })

  const trpcClient = useTrpcClient()
  const snackbar = useSnackbar()

  const router = trpcClient.admin
  const { mutate, error } = router.createStructure.useMutation()
  const onAddStructure = async (input: CreateStructureInput) => {
    const structureCreated = await mutate(input)
    if (error.value || !structureCreated) {
      snackbar.error("L'ajout de la structure a échoué.")
      return
    }
    navigateTo(routes.admin.AdminStructure.path(structureCreated.id))
  }
</script>
