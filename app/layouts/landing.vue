<template>
  <div
    class="template-landing"
    :class="{ 'dsfr-default': dsfrDefault }"
  >
    <DsfrSkipLinks
      :links="[
        { id: 'main-content', text: 'Contenu' },
        { id: 'header', text: `Entête` },
        { id: 'footer', text: `Pied de page` }
      ]"
    />
    <DsfrHeader
      id="header"
      :logo-text="['République', 'Française']"
      :service-title="APP_NAME"
      :service-description="APP_DESCRIPTION"
      :home-to="landingPageUrl"
      :quick-links="hideMenu ? [] : quickLinks"
    >
      <template #operator>
        <img
          style="max-width: 5.5rem"
          src="/logo-landing.svg"
          class="fr-responsive-img"
          alt="Mon Suivi Social"
        />
      </template>
      <template
        v-if="!hideMenu"
        #mainnav
      >
        <DsfrNavigation
          id="landing-nav"
          :nav-items
        />
      </template>
    </DsfrHeader>
    <main
      id="main-content"
      role="main"
      tabindex="-1"
    >
      <DsfrNotice
        v-if="mssEnvironment !== 'production'"
        :title="environment[mssEnvironment]"
        type="weather-orange"
      >
      </DsfrNotice>
      <slot />
    </main>
    <DsfrFooter
      id="footer"
      :before-mandatory-links
      :mandatory-links
      :after-mandatory-links
      :operator-to="landingPageUrl"
      operator-img-src="/logo-landing.svg"
      operator-img-alt="mon suivi social"
      :operator-img-style="{ 'max-width': '5.5rem' }"
    />
    <AtomSnackbar />
  </div>
</template>

<script setup lang="ts">
  import type {
    DsfrFooterProps,
    DsfrHeaderProps,
    DsfrNavigationProps
  } from '@gouvminint/vue-dsfr'
  import DsfrHeader from '~/components/TheLandingHeader/DsfrHeader.vue'
  import { CODE_URL, APP_DESCRIPTION, APP_NAME } from '~/utils/constants'
  import { routes } from '~/utils/routes'

  const {
    public: { landingPageUrl, mssEnvironment }
  } = useRuntimeConfig()

  // Pages displayed to authenticated users can hide the landing navigation
  const route = useRoute()
  const hideMenu = computed(() => !!route.meta.hideLandingMenu)
  const dsfrDefault = computed(() => !!route.meta.dsfrDefault)

  const quickLinks: DsfrHeaderProps['quickLinks'] = [
    {
      id: routes.auth.AuthLogin.name,
      label: 'Se connecter',
      to: routes.auth.AuthLogin.path()
    },
    {
      id: routes.landing.Sinscrire.name,
      label: routes.landing.Sinscrire.name,
      href: routes.landing.Sinscrire.path(landingPageUrl)
    }
  ]

  const navItems: DsfrNavigationProps['navItems'] = [
    {
      id: routes.landing.Accueil.name,
      to: routes.landing.Accueil.path(landingPageUrl),
      text: routes.landing.Accueil.title
    },
    {
      id: routes.landing.Sinscrire.name,
      to: routes.landing.Sinscrire.path(landingPageUrl),
      text: routes.landing.Sinscrire.title
    },
    {
      id: routes.landing.Contact.name,
      to: routes.landing.Contact.path(landingPageUrl),
      text: routes.landing.Contact.title
    }
  ]

  const beforeMandatoryLinks: DsfrFooterProps['beforeMandatoryLinks'] = [
    {
      label: routes.landing.Statistiques.name,
      href: routes.landing.Statistiques.path(landingPageUrl)
    },
    {
      label: routes.landing.Budget.name,
      href: routes.landing.Budget.path(landingPageUrl)
    },
    {
      label: 'Code source',
      href: CODE_URL
    }
  ]

  const mandatoryLinks: DsfrFooterProps['mandatoryLinks'] = [
    {
      label: `Accessibilité : non conforme`,
      // @ts-expect-error props type is incorrect but the component works with general format for links
      href: routes.landing.DeclarationAccessibilite.path(landingPageUrl)
    },
    {
      label: routes.landing.MentionsLegales.title,
      // @ts-expect-error props type is incorrect but the component works with general format for links
      href: routes.landing.MentionsLegales.path(landingPageUrl)
    }
  ]

  const afterMandatoryLinks: DsfrFooterProps['afterMandatoryLinks'] = [
    {
      label: routes.landing.PlanDuSite.title,
      href: routes.landing.PlanDuSite.path(landingPageUrl)
    }
  ]

  const environment: Record<string, string> = {
    local: 'Local',
    development: 'Dev',
    demo: 'Démo : vous êtes sur un environnement de démo',
    production: ''
  }
</script>

<style scoped>
  .template-landing {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    justify-content: space-between;
  }

  #main-content {
    flex-grow: 1;
  }

  :deep(.fr-header__tools-links .fr-btn) {
    color: var(--blue-france-sun-113-625);
  }

  .fr-header::after {
    display: none;
  }

  .fr-footer::after {
    display: none;
  }
</style>
