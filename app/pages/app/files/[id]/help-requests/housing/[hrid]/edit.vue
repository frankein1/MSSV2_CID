<template>
  <PageContainer>
    <AtomBreadcrumb
      v-if="housingHelpRequest"
      :links="
        breadcrumbs.helpRequest.AppFileHelpRequestEdit(
          {
            id: housingHelpRequest?.id,
            familyFileId,
            beneficiary:
              housingHelpRequest?.fileInstruction.socialSupport.beneficiary
          },
          familyFileIdentification,
          FileInstructionType.Housing
        )
      "
    />

    <PageTitle
      :title="title"
      icon="fr-icon-questionnaire-fill"
      icon-variant="purple"
      subtitle="Demande de logement"
      :subtitle-picto-path="fileInstructionTypePictos.Housing"
    >
      <RequiredFields />
    </PageTitle>
    <div ref="formContainer">
      <AtomLazyComponent
        :pending
        :error="Boolean(fetchError)"
        :message="fetchError"
      >
        <HousingHelpRequestFormEdition
          v-if="housingHelpRequestData && partnerOrganizations"
          :is-submitting="isSubmitting"
          :data="housingHelpRequestData"
          :family-file-identification="familyFileIdentification || []"
          :partner-organizations="partnerOrganizations"
          @save-housing-help-request="onUpdateHousingHelpRequest"
        />
      </AtomLazyComponent>
    </div>
  </PageContainer>
</template>

<script lang="ts" setup>
  import { FileInstructionType } from '@prisma/client'
  import type { EditHousingHelpRequestInput } from '~~/server/schema'
  import { BeneficiaryTab } from '~/utils/constants/beneficiary'
  import { fileInstructionTypePictos } from '~~/client/options'
  import { routes } from '~/utils/routes'
  import { breadcrumbs } from '~/utils/breadcrumbs'

  const snackbar = useSnackbar()
  const trpcClient = useTrpcClient()
  const route = useRoute()

  const isSubmitting = ref<boolean>(false)
  const formContainer = ref<HTMLElement | null>(null)

  const housingHelpRequestId = route.params.hrid as string
  const familyFileId = route.params.id as string

  const {
    data: housingHelpRequestData,
    pending: housingHelpRequestPending,
    error: housingHelpRequestError
  } = await trpcClient.housingHelpRequest.getOne.useQuery({
    id: housingHelpRequestId
  })

  const { familyFileIdentification } =
    await useFamilyFileMinimalInfo(familyFileId)

  const housingHelpRequest = computed(
    () => housingHelpRequestData.value?.housingHelpRequest || null
  )

  const beneficiary = computed(
    () =>
      housingHelpRequest.value?.fileInstruction.socialSupport.beneficiary ||
      null
  )

  const title = computed(() =>
    routes.helpRequest.AppBeneficiaryHelpRequestEdit.title(beneficiary.value)
  )
  const headTitle = computed(() =>
    routes.helpRequest.AppBeneficiaryHelpRequestEdit.title(
      beneficiary.value,
      FileInstructionType.Housing
    )
  )

  useHead({ title: headTitle })

  const {
    data: partnerOrganizations,
    pending: partnerOrganizationsPending,
    error: partnerOrganizationsError
  } = await trpcClient.partner.getAll.useQuery()

  const pending = computed(
    () => housingHelpRequestPending.value || partnerOrganizationsPending.value
  )

  const fetchError = computed(() => {
    if (housingHelpRequestError.value) {
      return "L'instruction de dossier n'a pas pu être chargée."
    }
    if (partnerOrganizationsError.value) {
      return "La liste des organismes instructeurs de votre structure n'a pas pu être chargée."
    }
    return ''
  })

  function onUpdateHousingHelpRequest(
    housingHelpRequest: EditHousingHelpRequestInput
  ) {
    useTrpcMutation({
      mutation: () =>
        trpcClient.housingHelpRequest.update.mutate(housingHelpRequest),
      isSubmitting,
      onSuccess: () => {
        navigateTo(
          routes.file.AppFile.path(housingHelpRequest.familyFileId, {
            beneficiaryId: housingHelpRequest.beneficiaryId,
            tab: BeneficiaryTab.History,
            item: housingHelpRequestData.value?.housingHelpRequest
              .fileInstruction.socialSupport.id
          })
        )
      },
      onFailure: () => {
        snackbar.error("La mise à jour de l'instruction de dossier a échoué.")
      }
    })
  }
</script>
