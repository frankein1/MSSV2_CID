<template>
  <PageContainer class="fr-p-5w">
    <NuxtLink
      :to="routes.admin.AdminUsers.path()"
      class="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-left-line fr-btn--icon-left fr-mb-6v"
    >
      {{ routes.admin.AdminUsers.title }}
    </NuxtLink>
    <PageTitle :title="user ? formatUserDisplayName(user) : '-'" />
    <div class="fr-grid-row fr-grid-row--gutters">
      <div class="fr-col-12">
        <div
          ref="formContainer"
          class="main-container fr-p-5w"
        >
          <AtomAlert
            v-if="error"
            :alert-type="AlertType.Error"
            message="Les informations de l'utilisateur n'ont pas pu être chargées."
          />

          <AtomLoader
            v-if="pending"
            class="fr-mx-auto"
          />
          <UserFormAdmin
            v-else-if="user"
            :user="user"
            :is-submitting="isSubmitting"
            @update-user="onUpdateUser($event as AdminEditUserInput)"
          />
        </div>
      </div>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
  import type { AdminEditUserInput } from '~~/server/schema'
  import { AlertType } from '~/utils/constants/alert'
  import { formatUserDisplayName } from '~/utils/user'
  import { routes } from '~/utils/routes'

  const route = useRoute()
  const userId = route.params.id as string
  const trpcClient = useTrpcClient()
  const snackbar = useSnackbar()

  const isSubmitting = ref(false)
  const formContainer = useTemplateRef('formContainer')

  const {
    data: user,
    pending,
    error
  } = await trpcClient.admin.getUser.useQuery({
    id: userId
  })

  function onUpdateUser(updatedUser: AdminEditUserInput) {
    useTrpcMutation({
      mutation: () => trpcClient.admin.editUser.mutate(updatedUser),
      isSubmitting,
      onSuccess: res => {
        user.value = res
        snackbar.success(
          "Les informations de l'utilisateur ont été mises à jour."
        )
      },
      onFailure: () => {
        snackbar.error("La mise à jour de l'utilisateur a échoué.")
      }
    })
  }
</script>
