<template>
  <PageContainer class="fr-p-5w">
    <NuxtLink
      :to="routes.admin.AdminMinisters.path()"
      class="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-left-line fr-btn--icon-left fr-mb-6v"
    >
      {{ routes.admin.AdminMinisters.title }}
    </NuxtLink>
    <PageTitle
      :title="minister ? minister.firstName + ' ' + minister.lastName : '-'"
    />
    <div class="fr-grid-row fr-grid-row--gutters">
      <div class="fr-col-12">
        <div class="main-container fr-p-5w">
          <AtomAlert
            v-if="error"
            :alert-type="AlertType.Error"
            message="Les informations de l'utilisateur n'ont pas pu être chargées."
          />

          <AtomLoader
            v-if="pending"
            class="fr-mx-auto"
          />
          <AdminMinisterForm
            v-else-if="minister"
            :create="false"
            :minister="minister"
            :is-submitting="isSubmitting"
            @update-minister="onUpdateMinister($event as UpdateMinisterInput)"
          />
        </div>
      </div>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
  import type { UpdateMinisterInput } from '~~/server/schema'
  import { AlertType } from '~/utils/constants/alert'
  import { routes } from '~/utils/routes'

  const route = useRoute()
  const ministerId = route.params.id as string
  const trpcClient = useTrpcClient()
  const snackbar = useSnackbar()

  const isSubmitting = ref(false)

  const {
    data: minister,
    pending,
    error
  } = await trpcClient.admin.getMinister.useQuery({
    id: ministerId
  })

  const router = trpcClient.admin
  const { mutate, error: updateError } = router.updateMinister.useMutation()
  const onUpdateMinister = async (input: UpdateMinisterInput) => {
    const ministerUpdated = await mutate(input)
    if (updateError.value || !ministerUpdated) {
      snackbar.error('La modification du ministre a échoué.')
      return
    }
    snackbar.success('Le ministre a été modifié avec succès.')
    navigateTo(routes.admin.AdminMinisters.path())
  }
</script>
