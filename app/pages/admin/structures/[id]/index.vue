<template>
  <PageContainer class="fr-p-5w">
    <NuxtLink
      :to="routes.admin.AdminStructures.path()"
      class="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-left-line fr-btn--icon-left fr-mb-6v"
    >
      {{ routes.admin.AdminStructures.title }}
    </NuxtLink>
    <PageTitle :title="title" />

    <AtomLoader
      v-if="pending"
      class="fr-mx-auto"
    />

    <AtomAlert
      v-else-if="error"
      :alert-type="AlertType.Error"
      message="Les informations de votre structure n'ont pas pu être chargées."
    />
    <div v-else-if="data">
      <StructureAdminInfo
        :structure="data.structure"
        @disable="disableStructureOpenModal"
        @toggle-rdv="toggleRdvspIntegration"
      />

      <StructureAdminUsers
        class="fr-mb-5w"
        :structure-id="data.structure.id"
        :users="data.users"
      />
      <div class="feature-section bg-color-white">
        <h2 class="fr-h4">Objets d'accompagnements</h2>
        <SocialSupportSubjects
          class="fr-mb-5w"
          :subjects="data.socialSupportSubjects"
          :edit-path="routes.admin.AdminStructureSubjects.path(structureId)"
          @refresh="refresh"
        />
      </div>
    </div>
  </PageContainer>
</template>

<script lang="ts" setup>
  import { AlertType } from '~/utils/constants/alert'
  import StructureDisableModal from '~/components/Structure/StructureDisableModal.vue'
  import { routes } from '~/utils/routes'
  import type { AdminStructureInfo } from '~/components/Structure/types'
  import { hasCompletedDeactivationWarnings } from '~/utils/structure'

  const title = routes.structure.AppStructure.title

  useHead({ title })

  const route = useRoute()
  const modal = useModal()
  const snackbar = useSnackbar()
  const structureId = route.params.id as string

  /* Get strcuture */
  const { data, pending, error, refresh } =
    await useTrpcClient().admin.getStructure.useQuery({ id: structureId })

  /* Disable structure buton action */
  function disableStructureOpenModal() {
    if (!data?.value?.structure) {
      return
    }
    const structure = data.value.structure
    modal.open(StructureDisableModal, {
      title: hasCompletedDeactivationWarnings(structure)
        ? 'Désactiver une structure inactive'
        : 'Désactiver une structure active',
      structure,
      disable: onDisable,
      requestCode: onRequestCode,
      cancel: onCancel
    })
  }
  function onCancel() {
    modal.close()
  }

  /** A structure can only be disabled with a code sent by email,
   * see server/route/admin/authorizeDisableStructure.mutation.ts
   */
  const {
    mutate: authorizeDisableStructureMutate,
    error: authorizeDisableStructureError
  } = useTrpcClient().admin.authorizeDisableStructure.useMutation()

  async function onRequestCode(structure: AdminStructureInfo) {
    let sent = false
    await authorizeDisableStructureMutate({ id: structure.id })
    if (authorizeDisableStructureError.value) {
      snackbar.error("L'envoi du code de confirmation a échoué.")
      return sent
    }
    sent = true
    return sent
  }

  /** Disable structure
   * see server/route/admin/disableStructure.mutation.ts
   */
  const { mutate: disableStructureMutate, error: disableStructureError } =
    useTrpcClient().admin.disableStructure.useMutation()

  async function onDisable(structure: AdminStructureInfo, code: string) {
    const res = await disableStructureMutate({ id: structure.id, code })
    if (disableStructureError.value || !res) {
      snackbar.error('Le code de confirmation est invalide ou expiré.')
      return
    }
    modal.close()
    snackbar.success('Structure désactivée.')
    navigateTo(routes.admin.AdminStructures.path())
  }

  /** Toggle structure RDVSP service
   * see server/route/admin/toggleRdvsp.mutation.ts
   */
  const { mutate: toggleRdvspMutate, error: toggleRdvspError } =
    useTrpcClient().admin.toggleRdvsp.useMutation()

  async function toggleRdvspIntegration(externalRdvspActive: boolean) {
    const values = { id: data.value?.structure?.id || '', externalRdvspActive }
    const res = await toggleRdvspMutate(values)
    if (toggleRdvspError.value || !res) {
      snackbar.error("L'activation de la fonctionnalité a échoué")
      return
    }
    const msg = externalRdvspActive
      ? 'La fonctionnalité de prise de rendez-vous est maintenant disponible pour tous les agents de la structure'
      : 'La fonctionnalité de prise de rendez-vous a été désactivée'
    snackbar.success(msg)
  }
</script>
