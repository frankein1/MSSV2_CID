<template>
  <div class="partner-card">
    <h3 class="fr-h6 fr-m-0">
      {{ el.name }}
    </h3>
    <div
      v-if="el.address || el.zipcode || el.city"
      class="fr-icon-map-pin-2-line partner-card-content__info fr-icon--sm fr-text--sm"
    >
      {{ `${el.address || ''} ${el.zipcode || ''} ${el.city || ''}` }}
    </div>
    <div
      v-if="phoneDisplay"
      class="fr-icon-phone-line partner-card-content__info fr-icon--sm fr-text--sm"
    >
      {{ phoneDisplay }}
    </div>
    <div
      v-if="partner.phone2"
      class="fr-icon-phone-line partner-card-content__info fr-icon--sm fr-text--sm"
    >
      {{ partner.phone2 }}
    </div>
    <!-- ANONYMIZED: email removed -->
    <div
      v-if="(el as any).email"
      class="fr-icon-mail-line partner-card-content__info fr-icon--sm fr-text--sm"
    >
      {{ (el as any).email }}
    </div>
    <div
      v-if="websiteDisplay"
      class="fr-icon-global-line partner-card-content__info fr-icon--sm fr-text--sm"
    >
      <NuxtLink
        :to="websiteHref"
        target="_blank"
        :title="`${websiteDisplay} - nouvelle fenêtre`"
        class="fr-link fr-text--sm"
        external
      >
        {{ websiteDisplay }}
      </NuxtLink>
    </div>
    <div
      v-if="el.workingHours"
      class="partner-card-content__info partner-card-content__working-hours fr-text--sm fr-m-0"
    >
      <div>Horaires :</div>
      {{ el.workingHours }}
    </div>
    <div
      v-for="(contact, idx) in partner.contacts"
      :key="contact.id"
      :index="idx"
      class="fr-pt-1w"
    >
      <hr
        class="fr-m-0 fr-p-0 fr-pt-1w partner-card-content__contact__separator"
      />
      <div class="fr-text--md fr-text--bold fr-m-0">{{ contact.name }}</div>
      <div class="fr-text--sm fr-m-0">{{ contact.phone }}</div>
      <div class="fr-text--sm fr-m-0">{{ contact.email }}</div>
    </div>

    <div class="partner-card__action-bar">
      <button
        class="fr-btn fr-btn--tertiary-no-outline fr-icon-pencil-line"
        data-fr-opened="false"
        aria-controls="global-modal"
        type="button"
        @click="emit('edit', partner.id)"
      >
        Modifier l'organisme partenaire
      </button>
      <button
        v-if="application.module.partner"
        class="fr-btn fr-btn--tertiary-no-outline fr-icon-delete-line partner-card__action-bar__delete"
        data-fr-opened="false"
        aria-controls="global-modal"
        type="button"
        @click="emit('delete', partner)"
      >
        Supprimer l'organisme partenaire
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { PartnerOrganizationData } from './types'
  import { sanitizeUrl } from '@braintree/sanitize-url'

  const props = defineProps<{
    partner: PartnerOrganizationData
  }>()

  const emit = defineEmits<{
    edit: [id: string]
    delete: [partner: PartnerOrganizationData]
  }>()

  const { application } = usePermissions()

  const el = computed(() => {
    if (props.partner.dataSource === 'DataInclusionV1') {
      return props.partner.dataInclusionStructureV1 || props.partner
    }
    return props.partner
  })

  const phoneDisplay = computed(() => {
    if (props.partner.dataSource === 'DataInclusionV1') {
      return (
        props.partner.dataInclusionStructureV1?.phone || props.partner.phone1
      )
    }
    return props.partner.phone1
  })

  const websiteDisplay = computed(() => {
    if (props.partner.dataSource === 'DataInclusionV1') {
      return (
        props.partner.dataInclusionStructureV1?.website || props.partner.website
      )
    }
    return props.partner.website
  })

  const websiteHref = computed(() => {
    const url = websiteDisplay.value
    if (!url) {
      return ''
    }
    const fullUrl =
      url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`
    return sanitizeUrl(fullUrl)
  })
</script>

<style lang="scss" scoped>
  .partner-card {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 1.5rem;
  }

  .partner-card__action-bar {
    display: flex;
    justify-content: flex-end;
  }

  .partner-card__action-bar__delete {
    color: var(--text-default-error);
  }

  .partner-card-content__info {
    color: var(--text-default-grey);
    margin-bottom: 0;

    &::before {
      margin-right: 0.5rem;
    }
  }

  .partner-card-content__working-hours {
    color: var(--text-mention-grey);
    margin-bottom: 0;
  }

  .partner-card-content__contact__separator {
    width: 3rem;
  }
</style>
