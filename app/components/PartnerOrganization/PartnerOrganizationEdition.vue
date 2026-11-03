<template>
  <PartnerOrganizationForm
    :is-submitting="isSubmitting"
    :caught-errors="caughtErrors"
    :partner-id="partner.id"
    :show-phone2="!!partner.phone2"
    :data-source="currentDataSource"
    :existing-data-inclusion-v1-ids="existingDataInclusionV1Ids"
    @submit="onSubmit"
    @cancel="onCancel"
    @restore="onRestore"
    @select-structure="onSelectDataInclusionStructure"
  />
</template>

<script lang="ts" setup>
  import { toTypedSchema } from '@vee-validate/zod'
  import type { PartnerOrganizationData, DataInclusionStructure } from './types'
  import type { EditPartnerOrganizationInput } from '~~/server/schema'
  import {
    editDataInclusionV1PartnerOrganizationSchema,
    editCustomPartnerOrganizationSchema,
    limitPOAddress,
    limitPOName,
    limitPOWebsite,
    limitPOWorkingHours
  } from '~~/server/schema'

  const props = defineProps<{
    isSubmitting: boolean
    id: string
    existingDataInclusionV1Ids: string[]
    finish: (partner: EditPartnerOrganizationInput) => void
    cancel: () => void
    restore: (partner: PartnerOrganizationData) => void
  }>()

  const partner = await useTrpcClient().partner.getOne.query({ id: props.id })

  const currentDataSource = ref<'Custom' | 'DataInclusionV1'>(
    partner.dataSource === 'LegacyDataInclusionV0'
      ? 'Custom'
      : partner.dataSource
  )

  const schema = computed(() => {
    if (currentDataSource.value === 'DataInclusionV1') {
      return toTypedSchema(editDataInclusionV1PartnerOrganizationSchema)
    }
    return toTypedSchema(editCustomPartnerOrganizationSchema)
  })

  function formatContacts(contacts: typeof partner.contacts) {
    return (contacts || []).map(({ id, name, email, phone }) => ({
      id,
      name,
      email,
      phone,
      deleted: false
    }))
  }

  function setInitialValues() {
    if (partner.dataSource === 'DataInclusionV1') {
      const v1 = partner.dataInclusionStructureV1
      return {
        id: partner.id,
        dataSource: 'DataInclusionV1' as const,
        dataInclusionIdV1: partner.dataInclusionIdV1 || undefined,
        name: v1?.name || partner.name,
        siret: v1?.siret,
        phone1: v1?.phone,
        phone2: partner.phone2,
        address: v1?.address,
        city: v1?.city,
        zipcode: v1?.zipcode,
        email: v1?.email,
        website: v1?.website,
        workingHours: v1?.workingHours,
        contacts: formatContacts(partner.contacts)
      }
    }

    return {
      id: partner.id,
      dataSource: 'Custom' as const, // To match zod schema for vee-validate
      name: partner.name,
      siret: partner.siret ?? undefined,
      phone1: partner.phone1,
      phone2: partner.phone2,
      address: partner.address,
      city: partner.city,
      zipcode: partner.zipcode,
      email: (partner as any).email,
      website: partner.website,
      workingHours: partner.workingHours,
      contacts: formatContacts(partner.contacts)
    }
  }

  const { handleSubmit, setValues: _setValues } =
    useForm<EditPartnerOrganizationInput>({
      validationSchema: schema,
      initialValues: setInitialValues()
    })

  // setValues accepts partials that don't match the discriminated union shape
  const setValues = _setValues as (values: Record<string, unknown>) => void

  const { caughtErrors, onSubmit } = useCatchFormErrors(
    handleSubmit,
    values => {
      props.finish(values)
    }
  )

  function onCancel() {
    props.cancel()
  }

  function onRestore(partner: PartnerOrganizationData) {
    props.restore(partner)
  }

  function onSelectDataInclusionStructure(
    structure: DataInclusionStructure | null
  ) {
    if (!structure) {
      if (currentDataSource.value === 'DataInclusionV1') {
        setValues({
          dataSource: 'Custom',
          siret: null,
          email: null,
          phone1: null,
          phone2: null,
          website: null,
          address: null,
          city: null,
          zipcode: null,
          workingHours: null
        })
        currentDataSource.value = 'Custom'
      }
      return
    }

    currentDataSource.value = 'DataInclusionV1'
    // Some fields from data inclusion can evolve to be very long. They are truncated
    // to the limit specified in the schema
    setValues({
      dataSource: 'DataInclusionV1',
      dataInclusionIdV1: structure.id,
      name: structure.name.substring(0, limitPOName),
      siret: structure.siret || null,
      address: structure.address?.substring(0, limitPOAddress),
      zipcode: structure.zipcode,
      city: structure.city,
      email: structure.email,
      phone1: structure.phone,
      website: structure.website?.substring(0, limitPOWebsite),
      workingHours: structure.workingHours?.substring(0, limitPOWorkingHours)
    })
  }
</script>
