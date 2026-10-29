<template>
  <form
    ref="form"
    novalidate
    @submit.prevent="onSubmit"
  >
    <div class="fr-grid-row fr-grid-row--gutters">
      <div class="fr-col-12 fr-mt-1w">
        <h2 class="fr-mb-0 fr-text--lg grey">
          Informations sur la structure&nbsp;:
        </h2>
      </div>

      <div class="fr-col-12">
        <VeeSelect
          name="type"
          :label="structureFieldLabels.type"
          :options="withEmptyValue(structureTypeKeys.options)"
          required
        />
      </div>
      <div class="fr-col-12">
        <VeeInput
          name="inhabitantsNumber"
          :label="structureFieldLabels.inhabitantsNumber"
          required
        />
      </div>

      <div class="fr-col-12">
        <VeeInput
          name="inseeCode"
          :label="structureFieldLabels.inseeCode"
          required
        />
      </div>

      <div class="fr-col-12">
        <VeeInput
          class="fr-mb-2v"
          name="siret"
          :label="structureFieldLabels.siret"
          required
        />
        <NuxtLink
          class="fr-link"
          target="_blank"
          rel="noopener"
          title="Annuaire des entreprises - nouvelle fenêtre"
          href="https://annuaire-entreprises.data.gouv.fr/"
        >
          Annuaire des entreprises
        </NuxtLink>
      </div>
      <div class="fr-col-12">
        <VeeInput
          name="name"
          :label="structureFieldLabels.name"
          required
        />
      </div>

      <div class="fr-col-12">
        <VeeAddressCombobox
          name="address"
          required
          :label="structureFieldLabels.address"
          @address-selected="onAddressSelected"
        />
      </div>

      <div class="fr-col-4">
        <VeeInput
          name="zipcode"
          :label="structureFieldLabels.zipcode"
          required
        />
      </div>
      <div class="fr-col-8">
        <VeeInput
          name="city"
          :label="structureFieldLabels.city"
          required
        />
      </div>

      <div class="fr-col-12">
        <VeeInput
          name="phone"
          :label="structureFieldLabels.phone"
          type="tel"
          required
        />
      </div>

      <div class="fr-col-12">
        <VeeInput
          name="email"
          :label="structureFieldLabels.email"
          required
          type="email"
        />
      </div>

      <div class="fr-col-12">
        <hr class="fr-mt-2w" />
      </div>

      <div class="fr-col-12 fr-mt-1w">
        <h2 class="fr-mb-0 fr-text--lg grey">Données statistiques&nbsp;:</h2>
      </div>

      <div class="fr-col-12">
        <VeeSelect
          name="typeSurvey.structureType"
          label="Type de structure"
          :options="withEmptyValue(surveyStructureTypeKeys.options)"
          :required="isTypeSurveyRequired"
        />
      </div>

      <div
        v-if="values.typeSurvey?.structureType === SurveyStructureType.Autre"
        class="fr-col-12"
      >
        <VeeInput
          name="typeSurvey.structureTypeOther"
          label="Autre : précisez le type de structure"
          required
        />
      </div>

      <div class="fr-col-12">
        <MultiSelect
          name="typeSurvey.socialSupportTypes"
          label="Types de suivi réalisés dans Mon Suivi Social"
          hint="Plusieurs choix possibles"
          :options="surveySocialSupportTypeKeys.options"
          :is-searchable="true"
          :dropdown-over="false"
          :required="isTypeSurveyRequired"
        />
      </div>

      <div class="fr-col-12">
        <hr class="fr-mt-2w" />
      </div>

      <div class="fr-col-12 fr-mt-1w">
        <h2 class="fr-mb-0 fr-text--lg grey">
          Personne référente à la protection des données (DPO)&nbsp;:
        </h2>
      </div>

      <div class="fr-col-12">
        <VeeInput
          name="dpoFirstName"
          :label="structureFieldLabels.dpoFirstName"
          required
        />
      </div>

      <div class="fr-col-12">
        <VeeInput
          name="dpoLastName"
          :label="structureFieldLabels.dpoLastName"
          required
        />
      </div>

      <div class="fr-col-12">
        <VeeInput
          name="dpoEmail"
          :label="structureFieldLabels.dpoEmail"
          required
          type="email"
        />
      </div>
    </div>

    <ul
      class="fr-btns-group fr-btns-group--inline-md fr-btns-group--right fr-mt-3w"
    >
      <li>
        <NuxtLink
          class="fr-btn fr-btn--secondary"
          :to="cancelPath"
        >
          Annuler
        </NuxtLink>
      </li>
      <li>
        <button
          class="fr-btn"
          type="submit"
          :disabled="isSubmitting"
          :data-submitting="isSubmitting"
        >
          Valider
        </button>
      </li>
    </ul>
  </form>
</template>

<script lang="ts" setup>
  import { SurveyStructureType } from '@prisma/client'
  import {
    structureTypeKeys,
    surveySocialSupportTypeKeys,
    surveyStructureTypeKeys
  } from '~~/client/options'
  import { structureFieldLabels } from '~~/client/labels'
  import type { AdminStructureInfo } from '~/components/Structure/types'
  import type {
    CreateStructureInput,
    StructureAdminInfoInput
  } from '~~/server/schema'
  import {
    structureAdminInfoWithTypeSurveySchema,
    editStructureWithoutTypeSurveySchema
  } from '~~/server/schema'

  const props = defineProps<{
    structure?: AdminStructureInfo
    validate:
      | ((values: CreateStructureInput) => void)
      | ((values: StructureAdminInfoInput) => void)
    cancelPath: string
    isSubmitting: boolean
  }>()

  const form = useTemplateRef('form')

  const isCreation = !props.structure

  // The type survey is mandatory when creating a structure, and cannot be
  // emptied once it has been filled in
  const isTypeSurveyRequired = isCreation || !!props.structure?.typeSurvey

  const validationSchema = isTypeSurveyRequired
    ? structureAdminInfoWithTypeSurveySchema
    : editStructureWithoutTypeSurveySchema

  const { handleSubmit, setFieldValue, values } =
    useForm<StructureAdminInfoInput>({
      validationSchema: toTypedSchema(validationSchema),
      initialValues: {
        ...props.structure,
        typeSurvey: props.structure?.typeSurvey ?? { socialSupportTypes: [] },
        inhabitantsNumber: props.structure?.inhabitantsNumber || undefined,
        inseeCode: props.structure?.inseeCode || undefined,
        siret: props.structure?.siret || undefined,
        dpoEmail: props.structure?.dpoEmail || undefined,
        dpoFirstName: props.structure?.dpoFirstName || undefined,
        dpoLastName: props.structure?.dpoLastName || undefined
      }
    })

  const { onSubmit } = useCatchFormErrors(handleSubmit, values =>
    // In creation, structureAdminInfoWithTypeSurveySchema guarantees the type survey is filled in
    props.validate(values as CreateStructureInput)
  )

  const { onAddressSelected } = useAddressFields({
    setCityValue: (value: string) => setFieldValue('city', value),
    setZipcodeValue: (value: string) => setFieldValue('zipcode', value)
  })
</script>

<style scoped lang="css">
  .grey {
    color: var(--text-default-grey);
  }
</style>
