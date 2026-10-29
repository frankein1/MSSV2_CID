<template>
  <PageContainer class="fr-p-5w">
    <NuxtLink
      :to="routes.admin.AdminUsers.path()"
      class="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-left-line fr-btn--icon-left fr-mb-6v"
    >
      {{ routes.admin.AdminUsers.title }}
    </NuxtLink>
    <PageTitle :title="routes.admin.AdminUsersAdd.title" />

    <div class="fr-grid-row fr-grid-row--gutters">
      <div class="fr-col-12">
        <div class="main-container fr-p-5w">
          <UserFormAdmin
            :is-submitting="isSubmitting"
            @update-user="onAddUser($event as AdminCreateUserInput)"
          />
        </div>
      </div>
    </div>
  </PageContainer>
</template>

<script setup lang="ts">
  import { TRPCClientError } from '@trpc/client'
  import type { AdminCreateUserInput } from '~~/server/schema'
  import { routes } from '~/utils/routes'
  import { getUserCreationMessage } from '~/utils/user'

  const trpcClient = useTrpcClient()
  const snackbar = useSnackbar()

  const isSubmitting = ref(false)

  function onAddUser(user: AdminCreateUserInput) {
    useTrpcMutation({
      mutation: () => trpcClient.admin.createUser.mutate(user),
      isSubmitting,
      onSuccess: ({ email }) => {
        snackbar.success(getUserCreationMessage(email))
        navigateTo(routes.admin.AdminUsers.path())
      },
      onFailure: err => {
        if (err instanceof TRPCClientError && err.data.code === 'CONFLICT') {
          snackbar.error('Cet email est déjà associé à un utilisateur.')
        } else {
          snackbar.error("La création de l'utilisateur a échoué.")
        }
      }
    })
  }
</script>
