<template>
  <HelpRequestForm
    :is-submitting="isSubmitting"
    :partner-organizations="partnerOrganizations"
    :family-file-identification="familyFileIdentification || []"
    :can-edit-private-synthesis="permissions?.set.privateSynthesis"
    :caught-errors="caughtErrors"
    :subject="FileInstructionType.Housing"
    edition-mode
    @submit="onSubmit"
  />
</template>

<script lang="ts" setup>
  import { AskedHousing, FileInstructionType } from '@prisma/client'
  import { toTypedSchema } from '@vee-validate/zod'
  import type { EditHousingHelpRequestInput } from '~~/server/schema'
  import { editHousingHelpRequestSchema } from '~~/server/schema'
  import { prismaDecimalToNumber } from '~/utils/prisma'
  import type { GetHousingHelpRequestOutput } from '~~/server/trpc/routers'
  import type { PartnerOrganizationIdName } from '~~/types/partner'
  import type { BeneficiaryFileIdentification } from '~~/types/beneficiary'
  import { toKindOfBoolean } from '~/utils/form/toKindOfBoolean'

  const { application } = usePermissions()

  const props = defineProps<{
    isSubmitting: boolean
    partnerOrganizations: PartnerOrganizationIdName[]
    data: GetHousingHelpRequestOutput
    familyFileIdentification: BeneficiaryFileIdentification[]
  }>()

  const emit = defineEmits<{
    saveHousingHelpRequest: [housingHelpRequest: EditHousingHelpRequestInput]
  }>()

  const housingHelpRequest = computed(() => props.data.housingHelpRequest)
  const fileInstruction = computed(
    () => housingHelpRequest.value.fileInstruction
  )
  const socialSupport = computed(() => fileInstruction.value.socialSupport)

  const permissions = computed(() => props.data.permissions)

  const initialDocumentIds = computed(
    () => socialSupport.value.documents?.map(d => d.key) || []
  )

  const { handleSubmit, meta } = useForm<EditHousingHelpRequestInput>({
    validationSchema: toTypedSchema(editHousingHelpRequestSchema),
    initialValues: {
      id: housingHelpRequest.value.id,
      beneficiaryId: socialSupport.value.beneficiary.id,
      familyFileId: socialSupport.value.familyFileId,
      date: socialSupport.value.date,
      isMinistry: application.value.module.ministere,
      synthesis: socialSupport.value.synthesis,
      synthesisRichText: socialSupport.value.synthesisRichText,
      privateSynthesis: socialSupport.value.privateSynthesis,
      privateSynthesisRichText: socialSupport.value.privateSynthesisRichText,
      ministerId: socialSupport.value.ministerId,
      numeroPegase: socialSupport.value.numeroPegase,
      status: socialSupport.value.status,
      dueDate: socialSupport.value.dueDate,
      documents: initialDocumentIds.value,
      socialSupportRedirections: toRedirectionFormValues(
        socialSupport.value.socialSupportRedirections
      ),
      externalStructure: fileInstruction.value.externalStructure
        ? 'true'
        : 'false',
      isFirst: toKindOfBoolean(housingHelpRequest.value.isFirst),
      fullFile: fileInstruction.value.fullFile || false,
      endOfSocialSupport: socialSupport.value.endOfSocialSupport || false,
      isPmr: housingHelpRequest.value.isPmr || false,
      maxRent: prismaDecimalToNumber(housingHelpRequest.value.maxRent),
      maxCharges: prismaDecimalToNumber(housingHelpRequest.value.maxCharges),
      [AskedHousing.HebergementTemporaire]:
        housingHelpRequest.value.askedHousing?.includes(
          AskedHousing.HebergementTemporaire
        ),
      [AskedHousing.ParcPrive]: housingHelpRequest.value.askedHousing?.includes(
        AskedHousing.ParcPrive
      ),
      [AskedHousing.ParcSocial]:
        housingHelpRequest.value.askedHousing?.includes(
          AskedHousing.ParcSocial
        ),
      housingType: housingHelpRequest.value.housingType || [],
      roomCount: housingHelpRequest.value.roomCount || [],
      lowIncomeHousingType: housingHelpRequest.value.lowIncomeHousingType || [],
      prescribingOrganizationId:
        housingHelpRequest.value.prescribingOrganizationId,
      prescribingOrganizationContactId:
        housingHelpRequest.value.prescribingOrganizationContactId,
      instructorOrganizationId: fileInstruction.value.instructorOrganizationId,
      instructorOrganizationContactId:
        fileInstruction.value.instructorOrganizationContactId,
      examinationDate: fileInstruction.value.examinationDate,
      decisionDate: fileInstruction.value.decisionDate,
      refusalReason: fileInstruction.value.refusalReason,
      dispatchDate: fileInstruction.value.dispatchDate,
      firstOpeningDate: housingHelpRequest.value.firstOpeningDate,
      reason: housingHelpRequest.value.reason,
      uniqueId: housingHelpRequest.value.uniqueId,
      taxHouseholdAdditionalInformation:
        housingHelpRequest.value.taxHouseholdAdditionalInformation,
      handlingDate: housingHelpRequest.value.handlingDate,
      supportProgramId: socialSupport.value.supportProgramId
    }
  })

  const isFormDirty = computed(() => meta.value.dirty)

  const { isNavigatingWithFormActions } = useLeaveFormConfirmation({
    isFormDirty
  })

  const { caughtErrors, onSubmit } =
    useCatchFormErrors<EditHousingHelpRequestInput>(handleSubmit, values => {
      isNavigatingWithFormActions.value = true
      emit('saveHousingHelpRequest', values)
    })
</script>
