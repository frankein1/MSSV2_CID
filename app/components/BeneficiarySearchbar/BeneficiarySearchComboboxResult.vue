<template>
  <div
    class="result"
    :class="{ 'active-link': !selectOnly }"
  >
    <div class="name-status">
      <AtomTextEmphasis
        class="fr-text--regular fr-text--lg fr-mr-1w fr-mb-0 text--primary result-name"
        :name="formatBeneficiarySearchDisplayName(beneficiary)"
        :input="search"
      />
      <BeneficiaryStatusBadge
        v-if="showStatus"
        :status="beneficiary.status"
        small
      />
    </div>
    <div
      class="fr-grid-row text--muted fr-text--regular fr-text--sm whitespace-pre-wrap fr-mt-1v"
    >
      <!-- ANONYMIZED: fileNumber, numeroPegase, phone1 -->
      <span v-if="beneficiary.birthDate && !showAge">
        {{ formatDate(beneficiary.birthDate) }}
      </span>
      <span v-if="beneficiary.birthDate && showAge">{{
        calculateAge(beneficiary.birthDate) + ' ans'
      }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import type { BeneficiarySearchResult } from '~~/types/beneficiary'

  defineProps<{
    search: string | undefined
    showStatus?: boolean
    showAge?: boolean
    beneficiary: BeneficiarySearchResult
    selectOnly: boolean
  }>()
</script>

<style lang="scss" scoped>
  .result {
    .name-status {
      display: flex;
      justify-content: flex-start;
      align-items: baseline;
    }
  }

  .result.active-link:hover,
  .result.active-link.focused {
    .result-name {
      text-decoration: underline;
    }
  }
</style>
