<template>
  <FollowupForm
    :is-submitting="isSubmitting"
    :social-support-subjects="socialSupportSubjects"
    :partner-organizations="partnerOrganizations"
    :family-file-identification="familyFileIdentification || []"
    :medium="values.medium"
    :can-set-private-synthesis="canSetPrivateSynthesis"
    :caught-errors="caughtErrors"
    edition-mode
    @submit="onSubmit"
  />
</template>

<script lang="ts" setup>
  import type { SocialSupportSubject } from '@prisma/client'
  import { toTypedSchema } from '@vee-validate/zod'
  import type { FollowupPageItem } from './types'
  import type { EditFollowupInput } from '~~/server/schema'
  import { editFollowupSchema } from '~~/server/schema'
  import type { PartnerOrganizationIdName } from '~~/types/partner'
  import type { BeneficiaryFileIdentification } from '~~/types/beneficiary'

  const { application } = usePermissions()

  const props = defineProps<{
    isSubmitting: boolean
    socialSupportSubjects: Array<SocialSupportSubject>
    partnerOrganizations: Array<PartnerOrganizationIdName>
    data: FollowupPageItem
    familyFileIdentification: BeneficiaryFileIdentification[]
  }>()

  const emit = defineEmits<{
    saveFollowup: [followup: EditFollowupInput]
  }>()

  const followup = computed(() => props.data.followup)
  const permissions = computed(() => props.data.permissions)

  const initialSocialSupportSubjectIds = computed(
    () => props.data.followup.subjects.map(({ id }) => id) || []
  )

  const canSetPrivateSynthesis = computed(
    () => permissions.value.set.privateSynthesis
  )

  const initialDocumentIds = computed(
    () => followup.value.documents?.map(d => d.key) || []
  )

  const { handleSubmit, values, meta } = useForm<EditFollowupInput>({
    validationSchema: toTypedSchema(editFollowupSchema),
    initialValues: {
      id: followup.value.id,
      beneficiaryId: followup.value.beneficiaryId,
      familyFileId: followup.value.familyFileId,
      medium: followup.value.medium,
      numeroPegase: followup.value.numeroPegase,
      date: followup.value.date,
      synthesis: followup.value.synthesis,
      synthesisRichText: followup.value.synthesisRichText,
      privateSynthesis: followup.value.privateSynthesis,
      privateSynthesisRichText: followup.value.privateSynthesisRichText,
      status: followup.value.status,
      helpRequested: followup.value.helpRequested || false,
      dueDate: followup.value.dueDate,
      thirdPersonName: followup.value.thirdPersonName,
      place: followup.value.place,
      prescribingOrganizationId: followup.value.prescribingOrganization?.id,
      prescribingOrganizationContactId:
        followup.value.prescribingOrganizationContact?.id,
      subjects: initialSocialSupportSubjectIds.value,
      documents: initialDocumentIds.value,
      firstFollowup: followup.value.firstFollowup || false,
      endOfSocialSupport: followup.value.endOfSocialSupport || false,
      classified: followup.value.classified || false,
      forwardedToJustice: followup.value.forwardedToJustice || false,
      isDuringWalkInSession: followup.value.isDuringWalkInSession || false,
      isMinistry: application.value.module.ministere,
      duration: followup.value.duration,
      ministerId: followup.value.ministerId,
      socialSupportRedirections: toRedirectionFormValues(
        followup.value.socialSupportRedirections
      ),
      supportProgramId: followup.value.supportProgramId
    }
  })

  const isFormDirty = computed(() => meta.value.dirty)

  const { isNavigatingWithFormActions } = useLeaveFormConfirmation({
    isFormDirty
  })

  const { onSubmit, caughtErrors } = useCatchFormErrors(
    handleSubmit,
    values => {
      isNavigatingWithFormActions.value = true
      emit('saveFollowup', values)
    }
  )
</script>
