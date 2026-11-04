<template>
  <PageContainer>
    <AtomBreadcrumb
      v-if="helpRequest"
      :links="
        breadcrumbs.helpRequest.AppFileHelpRequestEdit(
          {
            id: helpRequest.id,
            familyFileId,
            beneficiary: helpRequest.fileInstruction.socialSupport.beneficiary
          },
          familyFileIdentification,
          subject
        )
      "
    />

    <PageTitle
      :title="title"
      icon="fr-icon-questionnaire-fill"
      icon-variant="purple"
      :subtitle="subtitle"
      :subtitle-picto-path="subtitlePictoPath"
    >
      <RequiredFields />
    </PageTitle>
    <div ref="formContainer">
      <AtomLazyComponent
        :pending
        :error="Boolean(fetchError)"
        :message="fetchError"
      >
        <HelpRequestFormEdition
          v-if="
            helpRequestData && allSocialSupportSubjects && partnerOrganizations
          "
          :is-submitting="isSubmitting"
          :social-support-subjects="allSocialSupportSubjects"
          :data="helpRequestData"
          :family-file-identification="familyFileIdentification || []"
          :partner-organizations="partnerOrganizations"
          @save-help-request="onUpdateHelpRequest"
        />
      </AtomLazyComponent>
    </div>
  </PageContainer>
</template>

<script lang="ts" setup>
  import { FileInstructionType } from '@prisma/client'
  import type { EditHelpRequestInput } from '~~/server/schema'
  import { BeneficiaryTab } from '~/utils/constants/beneficiary'
  import { fileInstructionTypePictos } from '~~/client/options'
  import { routes } from '~/utils/routes'
  import { breadcrumbs } from '~/utils/breadcrumbs'
  import { getSocialSupportSubjects } from '~/utils/socialSupportSubject'

  const snackbar = useSnackbar()
  const trpcClient = useTrpcClient()
  const route = useRoute()

  const isSubmitting = ref<boolean>(false)
  const formContainer = ref<HTMLElement | null>(null)

  const helpRequestId = route.params.hrid as string
  const familyFileId = route.params.id as string

  const {
    data: helpRequestData,
    pending: helpRequestPending,
    error: helpRequestError
  } = await trpcClient.helpRequest.getOne.useQuery({
    id: helpRequestId
  })

  const { familyFileIdentification } =
    await useFamilyFileMinimalInfo(familyFileId)

  const helpRequest = computed(() => helpRequestData.value?.helpRequest || null)

  const beneficiary = computed(
    () => helpRequest.value?.fileInstruction.socialSupport.beneficiary || null
  )

  const title = computed(() =>
    routes.helpRequest.AppBeneficiaryHelpRequestEdit.title(beneficiary.value)
  )

  const subject = computed(() =>
    helpRequest.value?.financialSupport
      ? FileInstructionType.Financial
      : FileInstructionType.Other
  )

  const subtitle = computed(() =>
    helpRequest.value?.financialSupport ? 'Aide financière' : undefined
  )

  const subtitlePictoPath = computed(() => {
    if (!helpRequest.value) {
      return undefined
    }
    return helpRequest.value?.financialSupport
      ? fileInstructionTypePictos.Financial
      : undefined
  })

  const headTitle = computed(() =>
    routes.helpRequest.AppBeneficiaryHelpRequestEdit.title(
      beneficiary.value,
      subject.value
    )
  )
  useHead({ title: headTitle })
  const {
    data: socialSupportSubjects,
    pending: socialSupportSubjectsPending,
    error: socialSupportSubjectsError
  } = await trpcClient.structure.getActiveSocialSupportSubjects.useQuery()

  const {
    data: activeAndInactivSocialSupportSubjects,
    pending: activeAndInactivSocialSupportSubjectsPending,
    error: activeAndInactivSocialSupportSubjectsError
  } = await trpcClient.structure.getSocialSupportSubjects.useQuery()

  const allSocialSupportSubjects = computed(() =>
    getSocialSupportSubjects(
      socialSupportSubjects.value || null,
      activeAndInactivSocialSupportSubjects.value || null,
      helpRequestData.value?.helpRequest.subjectId
    )
  )

  const {
    data: partnerOrganizations,
    pending: partnerOrganizationsPending,
    error: partnerOrganizationsError
  } = await trpcClient.partner.getAll.useQuery()

  const pending = computed(
    () =>
      helpRequestPending.value ||
      socialSupportSubjectsPending.value ||
      activeAndInactivSocialSupportSubjectsPending.value ||
      partnerOrganizationsPending.value
  )

  const fetchError = computed(() => {
    if (helpRequestError.value) {
      return "L'instruction de dossier n'a pas pu être chargée."
    }
    if (socialSupportSubjectsError.value) {
      return "La liste des objets d'accompagnement de votre structure n'a pas pu être chargée."
    }
    if (activeAndInactivSocialSupportSubjectsError.value) {
      return "La liste des objets d'accompagnement n'a pas pu être chargée."
    }
    if (partnerOrganizationsError.value) {
      return "La liste des organismes partenaires de votre structure n'a pas pu être chargée."
    }
    return ''
  })

  function onUpdateHelpRequest(helpRequest: EditHelpRequestInput) {
    useTrpcMutation({
      mutation: () => trpcClient.helpRequest.update.mutate(helpRequest),
      isSubmitting,
      onSuccess: () => {
        navigateTo(
          routes.file.AppFile.path(helpRequest.familyFileId, {
            beneficiaryId: helpRequest.beneficiaryId,
            tab: BeneficiaryTab.History,
            item: helpRequestData.value?.helpRequest.fileInstruction
              .socialSupport.id
          })
        )
      },
      onFailure: () => {
        snackbar.error("La mise à jour de l'instruction a échoué.")
      }
    })
  }
</script>
