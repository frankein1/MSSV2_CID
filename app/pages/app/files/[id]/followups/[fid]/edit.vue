<template>
  <PageContainer>
    <AtomBreadcrumb
      :links="
        breadcrumbs.followup.AppFileFollowupEdit(
          followup,
          familyFileIdentification
        )
      "
    />
    <PageTitle :title="title" />
    <div ref="formContainer">
      <AtomLazyComponent
        :pending
        :error="Boolean(fetchError)"
        :message="fetchError"
      >
        <FollowupFormEdition
          v-if="
            followupData && allSocialSupportSubjects && partnerOrganizations
          "
          :is-submitting="isSubmitting"
          :social-support-subjects="allSocialSupportSubjects"
          :partner-organizations="partnerOrganizations"
          :data="followupData"
          :family-file-identification="familyFileIdentification || []"
          @save-followup="onUpdateFollowup"
        />
      </AtomLazyComponent>
    </div>
  </PageContainer>
</template>

<script lang="ts" setup>
  import { BeneficiaryTab } from '~/utils/constants/beneficiary'
  import type { EditFollowupInput } from '~~/server/schema'
  import { routes } from '~/utils/routes'
  import { breadcrumbs } from '~/utils/breadcrumbs'
  import { getSocialSupportSubjectsFromArray } from '~/utils/socialSupportSubject'

  const route = useRoute()
  const snackbar = useSnackbar()
  const trpcClient = useTrpcClient()

  const isSubmitting = ref<boolean>(false)
  const formContainer = ref<HTMLElement | null>(null)

  const followupId = route.params.fid as string
  const familyFileId = route.params.id as string

  const {
    data: followupData,
    pending: followupPending,
    error: followupError
  } = await trpcClient.followup.getOne.useQuery({
    id: followupId
  })

  const { familyFileIdentification } =
    await useFamilyFileMinimalInfo(familyFileId)

  const followup = computed(() => followupData.value?.followup || null)
  const beneficiary = computed(() => followup.value?.beneficiary || null)

  const title = computed(() =>
    routes.followup.AppBeneficiaryFollowupEdit.title(beneficiary.value)
  )

  useHead({ title })

  const {
    data: socialSupportSubjects,
    pending: socialSupportSubjectsPending,
    error: socialSupportSubjectsError
  } = await trpcClient.structure.getActiveSocialSupportSubjects.useQuery()

  const {
    data: partnerOrganizations,
    pending: partnerOrganizationsPending,
    error: partnerOrganizationsError
  } = await trpcClient.partner.getAll.useQuery()

  const {
    data: activeAndInactivSocialSupportSubjects,
    pending: activeAndInactivSocialSupportSubjectsPending,
    error: activeAndInactivSocialSupportSubjectsError
  } = await trpcClient.structure.getSocialSupportSubjects.useQuery()

  const allSocialSupportSubjects = computed(() =>
    getSocialSupportSubjectsFromArray(
      socialSupportSubjects.value || null,
      activeAndInactivSocialSupportSubjects.value || null,
      followupData.value?.followup.subjects
    )
  )

  const pending = computed(
    () =>
      followupPending.value ||
      socialSupportSubjectsPending.value ||
      activeAndInactivSocialSupportSubjectsPending.value ||
      partnerOrganizationsPending.value
  )

  const fetchError = computed(() => {
    if (followupError.value) {
      return "La synthèse de l'entretien n'a pas pu être chargée."
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

  function onUpdateFollowup(followup: EditFollowupInput) {
    useTrpcMutation({
      mutation: () => trpcClient.followup.update.mutate(followup),
      isSubmitting,
      onSuccess: () => {
        navigateTo(
          routes.file.AppFile.path(followup.familyFileId, {
            beneficiaryId: followup.beneficiaryId,
            tab: BeneficiaryTab.History,
            item: followupData.value?.followup.socialSupportId
          })
        )
      },
      onFailure: () => {
        snackbar.error('La mise à jour de la synthèse a échoué.')
      }
    })
  }
</script>
