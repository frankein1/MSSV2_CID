<template>
  <div>
    <h3>Menu Disclosure</h3>

    <h4>Par défaut</h4>
    <AtomDropdownDisclosure
      label="Jeanne TESTEUSE"
      :menus="menus"
    />

    <h4>Aligné à droite</h4>
    <div style="display: flex; justify-content: flex-end">
      <AtomDropdownDisclosure
        label="Actions"
        :menus="menus"
        align-right
      />
    </div>

    <h4>Avec icône</h4>
    <AtomDropdownDisclosure
      label="Jeanne TESTEUSE"
      :menus="menus"
      icon="fr-icon-account-circle-line"
    />

    <h4>Chargement</h4>
    <AtomDropdownDisclosure
      label="Chargement…"
      :menus="menus"
      loading
    />

    <h4>Avec classe personnalisée</h4>
    <AtomDropdownDisclosure
      label="Secondaire"
      :menus="menus"
      dropdown-btn-class="fr-btn--tertiary-no-outline"
    />

    <h4>Avec action onClick</h4>
    <AtomDropdownDisclosure
      label="Actions"
      :menus="menusWithActions"
    />
    <p v-if="lastClicked">
      Dernier clic : <strong>{{ lastClicked }}</strong>
    </p>
  </div>
</template>

<script lang="ts" setup>
  import type { MenuItem } from '~~/types/menu'

  const lastClicked = ref<string | null>(null)

  const menus: MenuItem[] = [
    {
      label: 'Configuration',
      to: '/',
      icon: 'fr-icon-settings-4-line'
    },
    {
      label: 'Documentation',
      href: '/',
      icon: 'fr-icon-file-text-line'
    },
    {
      label: 'Désactivé',
      to: '/',
      disabled: true
    }
  ]

  const menusWithActions: MenuItem[] = [
    {
      label: 'Exporter',
      icon: 'fr-icon-download-line',
      onClick: item => {
        lastClicked.value = item.label
      }
    },
    {
      label: 'Supprimer',
      icon: 'fr-icon-delete-line',
      onClick: item => {
        lastClicked.value = item.label
      }
    }
  ]
</script>
