<template>
  <form
    class="fr-container--fluid"
    novalidate
    @submit.prevent="onSubmit"
  >
    <RequiredFields />
    <VeeSelect
      name="structureType"
      label="Type de structure"
      :options="withEmptyValue(surveyStructureTypeKeys.options)"
      required
    />
    <VeeInput
      v-if="values.structureType === SurveyStructureType.Autre"
      name="structureTypeOther"
      label="Autre : précisez le type de structure"
      required
    />
    <MultiSelect
      name="socialSupportTypes"
      label="Types de suivi réalisés dans Mon Suivi Social"
      hint="Plusieurs choix possibles"
      :options="surveySocialSupportTypeKeys.options"
      :is-searchable="true"
      :dropdown-over="false"
      required
    />
    <ul class="fr-btns-group fr-btns-group--inline-lg fr-mt-2w">
      <li>
        <button
          class="fr-btn"
          type="submit"
          :disabled="isSubmitting"
          :data-submitting="isSubmitting"
        >
          Enregistrer vos réponses
        </button>
      </li>
    </ul>
  </form>
</template>

<script lang="ts" setup>
  import { toTypedSchema } from '@vee-validate/zod'
  import { SurveyStructureType } from '@prisma/client'
  import { routes } from '~/utils/routes'
  import { withEmptyValue } from '~/utils/options'
  import {
    surveySocialSupportTypeKeys,
    surveyStructureTypeKeys
  } from '~~/client/options'
  import { submitStructureTypeSurveySchema } from '~~/server/schema'

  const trpcClient = useTrpcClient()
  const snackbar = useSnackbar()
  const { setStructureTypeSurveyFilled } = useAuth()

  const { handleSubmit, values } = useForm({
    validationSchema: toTypedSchema(submitStructureTypeSurveySchema),
    initialValues: { socialSupportTypes: [] }
  })

  const isSubmitting = ref(false)

  const onSubmit = handleSubmit(async input => {
    isSubmitting.value = true
    try {
      await trpcClient.structure.submitStructureTypeSurvey.mutate(input)
      setStructureTypeSurveyFilled()
      await navigateTo(routes.user.AppOverview.path())
    } catch {
      snackbar.error("L'enregistrement du questionnaire a échoué.")
    }
    isSubmitting.value = false
  })
</script>
