<template>
  <div class="fr-container">
    <div class="fr-grid-row fr-grid-row--gutters">
      <h1 class="fr-col-12">Composants UI</h1>
      <p class="fr-col-12">Les composants UI sont testables ci-dessous.</p>

      <h2 class="fr-col-12">Combobox</h2>
      <div class="fr-col-12">
        <VeeComboboxStory />
      </div>

      <div class="fr-col-12">
        <ComboboxStory />
      </div>

      <div class="fr-col-12">
        <MinisterComboboxStory />
      </div>

      <div class="fr-col-12">
        <VeeCityComboboxStory />
      </div>

      <div class="fr-col-12">
        <VeeAddressComboboxStory />
      </div>

      <h2 class="fr-col-12">Multiselect (legacy)</h2>
      <div class="fr-col-12">
        <VeeMultiselectStory />
      </div>

      <h2 class="fr-col-12">Multiselect</h2>
      <div class="fr-col-12">
        <MultiSelectStory />
      </div>

      <h2 class="fr-col-12">Wysiwyg editor</h2>
      <div class="fr-col-12">
        <AtomTextEditor name="editor" />
      </div>

      <h2 class="fr-col-12">Tables</h2>

      <div class="fr-col-6">
        <TableSortableHeaderStory />
      </div>

      <div class="fr-col-12">
        <AtomFiltersStory />
      </div>

      <div class="fr-col-12">
        <FollowupsTableStory />
      </div>

      <h2 class="fr-col-12">Formulaires</h2>

      <div class="fr-col-6">
        <VeeInputStory />
      </div>

      <div class="fr-col-12">
        <VeeRadioButtonsStory />
      </div>

      <div class="fr-col-12">
        <VeeSelectOptionGroupStory />
      </div>

      <h2 class="fr-col-12">Statistiques</h2>

      <div class="fr-col-12">
        <StatsFiltersStory />
      </div>

      <div class="fr-col-12">
        <StatsListStory />
      </div>

      <h2 class="fr-col-12">Dossier foyer</h2>
      <div class="fr-col-12">
        <FamilyFileSegmentedControlStory />
      </div>

      <h2 class="fr-col-12">Dropdown Disclosure</h2>
      <div class="fr-col-12 fr-mb-5w">
        <AtomDropdownDisclosureStory />
      </div>
    </div>
  </div>
</template>

<script setup>
  import TableSortableHeaderStory from '~/components/TableSortableHeader/TableSortableHeader.story.vue'
  import AtomFiltersStory from '~/components/AtomFilters/AtomFilters.story.vue'
  import VeeInputStory from '~/components/VeeForm/VeeInput.story.vue'
  import VeeRadioButtonsStory from '~/components/VeeForm/VeeRadioButtons.story.vue'
  import VeeSelectOptionGroupStory from '~/components/VeeForm/VeeSelectOptionGroup.story.vue'
  import StatsFiltersStory from '~/components/StatsFilters/StatsFilters.story.vue'
  import StatsListStory from '~/components/StatsList/StatsList.story.vue'
  import FamilyFileSegmentedControlStory from '~/components/FamilyFileSegmentedControl/FamilyFileSegmentedControl.story.vue'
  import MultiSelectStory from '~/components/MultiSelect/MultiSelect.story.vue'
  import VeeMultiselectStory from '~/components/VeeForm/VeeMultiSelect.story.vue'
  import VeeComboboxStory from '~/components/VeeForm/VeeCombobox.story.vue'
  import ComboboxStory from '~/components/ComboBox/Combobox.story.vue'
  import MinisterComboboxStory from '~/components/Minister/MinisterCombobox.story.vue'
  import VeeCityComboboxStory from '~/components/VeeForm/VeeCityCombobox.story.vue'
  import VeeAddressComboboxStory from '~/components/VeeForm/VeeAddressCombobox.story.vue'
  import FollowupsTableStory from '~/components/Followups/FollowupsTable.story.vue'
  import AtomDropdownDisclosureStory from '~/components/AtomDropdownDisclosure/AtomDropdownDisclosure.story.vue'

  definePageMeta({
    layout: 'landing'
  })
</script>

<style scoped>
  :deep(h4) {
    margin-top: 1.5rem;
  }

  h2 {
    width: 100%;
    margin-top: 1rem;
    padding-top: 2rem !important;
    border-top: 1px solid var(--background-alt-grey-active);
  }
</style>
