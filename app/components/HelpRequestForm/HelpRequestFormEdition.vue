<template>
  <HelpRequestForm
    :is-submitting="isSubmitting"
    :social-support-subjects="socialSupportSubjects"
    :partner-organizations="partnerOrganizations"
    :family-file-identification="familyFileIdentification || []"
    :can-edit-private-synthesis="permissions?.set.privateSynthesis"
    :caught-errors="caughtErrors"
    :subject="subject"
    edition-mode
    @submit="onSubmit"
  />
</template>

<script lang="ts" setup>
  import type { SocialSupportSubject } from '@prisma/client'
  import { FileInstructionType } from '@prisma/client'
  import { toTypedSchema } from '@vee-validate/zod'
  import type { HelpRequestPageItem } from './types'
  import type { EditHelpRequestInput } from '~~/server/schema'
  import { editHelpRequestSchema } from '~~/server/schema'
  import { prismaDecimalToNumber } from '~/utils/prisma'
  import { toKindOfBoolean } from '~/utils/form/toKindOfBoolean'
  import type { PartnerOrganizationIdName } from '~~/types/partner'
  import type { BeneficiaryFileIdentification } from '~~/types/beneficiary'

  const { application } = usePermissions()

  const props = defineProps<{
    isSubmitting: boolean
    socialSupportSubjects: SocialSupportSubject[]
    partnerOrganizations: PartnerOrganizationIdName[]
    data: HelpRequestPageItem
    familyFileIdentification: BeneficiaryFileIdentification[]
  }>()

  const emit = defineEmits<{
    saveHelpRequest: [helpRequest: EditHelpRequestInput]
  }>()

  const helpRequest = computed(() => props.data.helpRequest)
  const fileInstruction = computed(() => helpRequest.value.fileInstruction)
  const socialSupport = computed(() => fileInstruction.value.socialSupport)
  const permissions = computed(() => props.data.permissions)

  const initialDocumentIds = computed(
    () => socialSupport.value.documents?.map(d => d.key) || []
  )

  const subject = computed(() =>
    helpRequest.value.financialSupport
      ? FileInstructionType.Financial
      : FileInstructionType.Other
  )

  const { handleSubmit, meta } = useForm<EditHelpRequestInput>({
    validationSchema: toTypedSchema(editHelpRequestSchema),
    initialValues: {
      id: helpRequest.value.id,
      beneficiaryId: socialSupport.value.beneficiary.id,
      familyFileId: socialSupport.value.familyFileId,
      numeroPegase: socialSupport.value.numeroPegase,
      ministerId: socialSupport.value.ministerId,
      subjectId: helpRequest.value.subjectId,
      status: socialSupport.value.status,
      examinationDate: fileInstruction.value.examinationDate,
      decisionDate: fileInstruction.value.decisionDate,
      paymentMethod: helpRequest.value.paymentMethod,
      paymentDate: helpRequest.value.paymentDate,
      handlingDate: helpRequest.value.handlingDate,
      refusalReason: fileInstruction.value.refusalReason,
      prescribingOrganizationId: helpRequest.value.prescribingOrganizationId,
      prescribingOrganizationContactId:
        helpRequest.value.prescribingOrganizationContactId,
      instructorOrganizationId: fileInstruction.value.instructorOrganizationId,
      instructorOrganizationContactId:
        fileInstruction.value.instructorOrganizationContactId,
      dispatchDate: fileInstruction.value.dispatchDate,
      synthesis: socialSupport.value.synthesis,
      synthesisRichText: socialSupport.value.synthesisRichText,
      privateSynthesis: socialSupport.value.privateSynthesis,
      privateSynthesisRichText: socialSupport.value.privateSynthesisRichText,
      dueDate: socialSupport.value.dueDate,
      isRefundable: toKindOfBoolean(helpRequest.value.isRefundable),
      isMinistry: application.value.module.ministere,
      date: socialSupport.value.date,
      documents: initialDocumentIds.value,
      socialSupportRedirections: toRedirectionFormValues(
        socialSupport.value.socialSupportRedirections
      ),
      externalStructure: fileInstruction.value.externalStructure
        ? 'true'
        : 'false',
      askedAmount: prismaDecimalToNumber(helpRequest.value.askedAmount),
      allocatedAmount: prismaDecimalToNumber(helpRequest.value.allocatedAmount),
      fullFile: fileInstruction.value.fullFile || false,
      endOfSocialSupport: socialSupport.value.endOfSocialSupport || false,
      supportProgramId: socialSupport.value.supportProgramId
    }
  })

  const isFormDirty = computed(() => meta.value.dirty)

  const { isNavigatingWithFormActions } = useLeaveFormConfirmation({
    isFormDirty
  })

  const { caughtErrors, onSubmit } = useCatchFormErrors<EditHelpRequestInput>(
    handleSubmit,
    values => {
      isNavigatingWithFormActions.value = true
      emit('saveHelpRequest', values)
    }
  )
</script>
