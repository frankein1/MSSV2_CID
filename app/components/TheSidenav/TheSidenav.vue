<template>
  <nav
    id="navigation"
    class="fr-sidemenu fr-sidemenu--sticky-full-height fr-p-0"
    role="navigation"
    aria-labelledby="sidemenu-title"
    tabindex="-1"
  >
    <div class="fr-sidemenu__inner fr-py-0 fr-px-2w">
      <button
        ref="menuButton"
        class="fr-sidemenu__btn"
        hidden
        aria-controls="fr-sidemenu-wrapper"
        aria-expanded="false"
      >
        Menu
      </button>
      <div
        id="fr-sidemenu-wrapper"
        class="fr-collapse"
      >
        <header>
          <div class="fr-sidemenu__title fr-py-1w">
            <NuxtLink
              :to="homePage"
              title="Tableau de bord - Mon Suivi Social"
            >
              <img
                id="sidemenu-title"
                src="~/assets/img/logo-mss-bleu.svg"
                width="100"
                alt="Mon Suivi Social"
              />
            </NuxtLink>
          </div>
          <ul class="fr-sidemenu__list">
            <!-- extraneous emits come from custom nuxt-link https://github.com/nuxt/nuxt/pull/28738 fixed in 3.13.1 -->
            <NuxtLink
              v-for="menuItem in menuItems"
              v-slot="{ href, navigate, isActive }"
              :key="menuItem.to"
              custom
              :to="menuItem.to"
            >
              <li
                class="fr-sidemenu__item"
                :class="{ 'fr-sidemenu__item--active': isActive }"
              >
                <NuxtLink
                  :href="href"
                  class="fr-sidemenu__link"
                  :aria-current="isActive ? 'page' : undefined"
                  @click="
                    () => {
                      navigate()
                      closeMenu()
                    }
                  "
                >
                  <span
                    class="fr-mr-1w"
                    :class="[menuItem.icon]"
                    aria-hidden="true"
                  ></span>
                  {{ menuItem.label }}
                </NuxtLink>
              </li>
            </NuxtLink>
            <li class="fr-mt-3w">
              <NuxtLink
                class="fr-link fr-sidemenu__link fr-sidemenu__help"
                to="https://mon-suivi-social.gitbook.io/mon-suivi-social/"
                target="_blank"
                rel="noopener external"
                title="Aide - nouvelle fenêtre"
                >Aide</NuxtLink
              >
            </li>
          </ul>
        </header>
        <footer>
          <ul class="fr-footer__bottom-list">
            <li
              v-if="!application.view.admin"
              class="fr-footer__bottom-item"
            >
              <NuxtLink
                class="fr-footer__bottom-link"
                :to="
                  application.view.cgu.asManager
                    ? routes.cgu.CGUManager.path({ readonly: true })
                    : routes.cgu.CGUUser.path({ readonly: true })
                "
              >
                CGU
              </NuxtLink>
            </li>
            <li class="fr-footer__bottom-item">
              <NuxtLink
                class="fr-footer__bottom-link"
                :to="routes.landing.PolitiqueConfidentialite.path()"
              >
                Politique de confidentialité
              </NuxtLink>
            </li>
            <li class="fr-footer__bottom-item">
              <NuxtLink
                class="fr-footer__bottom-link"
                :to="routes.siteMap.path()"
              >
                {{ routes.siteMap.title }}
              </NuxtLink>
            </li>
            <li class="fr-footer__bottom-item">
              <NuxtLink
                class="fr-footer__bottom-link"
                :to="
                  routes.landing.DeclarationAccessibilite.path(landingPageUrl)
                "
              >
                Accessibilité&nbsp;: non conforme
              </NuxtLink>
            </li>
            <li
              v-if="version"
              class="fr-footer__bottom-item"
            >
              <NuxtLink
                class="fr-footer__bottom-link"
                :to="sourceCode"
                target="_blank"
                rel="noopener external"
                title="Code source de la version - nouvelle fenêtre"
              >
                Version {{ version }}
              </NuxtLink>
            </li>
          </ul>
        </footer>
      </div>
    </div>
  </nav>
</template>

<script setup>
  import { routes } from '~/utils/routes'

  const {
    public: { landingPageUrl }
  } = useRuntimeConfig()

  const homePage = useHomePage()

  const { version, sourceCode } = useClientVersion()
  const { application } = usePermissions()

  const menuButton = useTemplateRef('menuButton')

  const closeMenu = () => {
    if (
      menuButton.value &&
      menuButton.value.getAttribute('aria-expanded') === 'true'
    ) {
      menuButton.value.click()
    }
  }

  // Review app (Pilotage territorial): the panel is the only entry
  const menuItems = [
    {
      to: routes.crossStructure.PilotageTerritorial.path(),
      label: routes.crossStructure.PilotageTerritorial.title,
      icon: 'fr-icon-line-chart-line'
    }
  ]
</script>

<style lang="scss" scoped>
  @use '~/assets/style/variables' as *;

  .fr-sidemenu {
    background-color: $primary;
  }

  .fr-sidemenu__inner {
    box-shadow: none;
  }

  .fr-sidemenu__btn {
    background-color: var(--background-action-high-blue-france);
    color: white;

    &:hover {
      background-color: var(--primary-hover);
    }
  }

  .fr-sidemenu__help {
    justify-content: center;
  }

  .fr-sidemenu__link {
    color: #fff;
    font-weight: $font-weight-normal;
    word-break: normal;
    overflow-wrap: anywhere;
    padding-right: 0;
  }

  @media (hover: hover) and (pointer: fine) {
    .fr-sidemenu__link[href]:hover {
      background-color: inherit;
      font-weight: $font-weight-bold;
    }

    .fr-sidemenu__link[href]:active {
      font-weight: $font-weight-bold;
    }
  }

  .fr-sidemenu__link[aria-current] {
    color: #fff;
    font-weight: $font-weight-bold;
  }

  .fr-sidemenu__link[aria-current]::before {
    background-color: #fff;
    top: 0;
    bottom: 0;
    margin: 0.75rem 0;
  }

  .fr-sidemenu__link::before {
    margin-right: 0.5rem;
  }

  .fr-sidemenu__title {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
  }

  footer {
    margin-top: auto;
  }

  .fr-footer__bottom-link {
    --underline-img: linear-gradient(0deg, currentcolor, currentcolor);

    color: #fff;
  }

  .fr-footer__bottom-list {
    text-align: center;
    margin-bottom: 1rem;
  }

  .fr-footer__bottom-item {
    display: inherit;
    margin: 0.5rem 0 0;
  }

  .fr-footer__bottom-item::before {
    display: none;
  }

  .fr-collapse {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
</style>
