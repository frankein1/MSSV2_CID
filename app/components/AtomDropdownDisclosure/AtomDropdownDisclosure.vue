<!-- Based on https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-navigation/ -->

<template>
  <div
    :id="CONTAINER_ID"
    class="disclosure"
    :class="{ 'disclosure-right': alignRight }"
    @keydown="onArrowNavigation"
    @focusout="onFocusOut"
  >
    <button
      ref="triggerBtn"
      :disabled="loading"
      class="fr-btn fr-btn--icon-right disclosure-btn"
      :class="[icon ?? 'fr-icon-arrow-down-s-line', dropdownBtnClass]"
      :aria-expanded="expanded"
      :aria-controls="MENU_ID"
      @click="toggle"
    >
      <AtomLoader
        v-if="loading"
        border-color="#DDDDDD"
        :diameter="20"
        class="fr-mr-1w"
      />
      {{ label }}
    </button>

    <ul
      v-show="expanded"
      :id="MENU_ID"
      ref="menuList"
      class="menu"
      role="list"
    >
      <li
        v-for="menu in menus"
        :key="menu.label"
      >
        <NuxtLink
          v-if="menu.to || menu.href"
          :disabled="menu.disabled"
          :to="menu.to || menu.href"
          :class="menuClass(menu.icon)"
          :external="menu.href != null"
          :title="menu.title"
          @click="close"
        >
          {{ menu.label }}
        </NuxtLink>
        <button
          v-else
          :disabled="menu.disabled"
          :class="menuClass(menu.icon)"
          :title="menu.title"
          @click.prevent="onMenuItemClick(menu)"
        >
          {{ menu.label }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
  import type { MenuItem } from '~~/types/menu'

  withDefaults(
    defineProps<{
      label: string
      menus: MenuItem[]
      loading?: boolean
      dropdownBtnClass?: string
      alignRight?: boolean
      icon?: string
    }>(),
    {
      dropdownBtnClass: '',
      alignRight: false,
      icon: undefined,
      loading: false
    }
  )

  const MENU_ID = 'disclosure-menu-' + useId()
  const CONTAINER_ID = 'disclosure-' + useId()

  const expanded = ref(false)
  const triggerBtn = ref<HTMLButtonElement | null>(null)
  const menuList = ref<HTMLUListElement | null>(null)

  function toggle() {
    expanded.value = !expanded.value
  }

  function close() {
    expanded.value = false
  }

  function onMenuItemClick(menu: MenuItem) {
    menu.onClick?.(menu)
    close()
  }

  function menuClass(icon: string | undefined) {
    const base = 'fr-btn fr-btn--tertiary-no-outline'
    return icon ? `${base} fr-btn--icon-left ${icon}` : base
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && expanded.value) {
      close()
      triggerBtn.value?.focus()
    }
  }

  function getFocusableItems(): HTMLElement[] {
    if (!menuList.value) {
      return []
    }
    return Array.from(
      menuList.value.querySelectorAll<HTMLElement>(
        ':scope > li > a, :scope > li > button'
      )
    ).filter(item => !item.hasAttribute('disabled'))
  }

  function onArrowNavigation(event: KeyboardEvent) {
    if (!expanded.value) {
      return
    }
    const items = getFocusableItems()
    if (!items.length) {
      return
    }
    const currentIndex = items.indexOf(document.activeElement as HTMLElement)
    const lastIndex = items.length - 1
    let nextIndex: number
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex =
          currentIndex === -1 || currentIndex === lastIndex
            ? 0
            : currentIndex + 1
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = currentIndex <= 0 ? lastIndex : currentIndex - 1
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = lastIndex
        break
      default:
        return
    }
    event.preventDefault()
    items[nextIndex]?.focus()
  }

  function onFocusOut(event: FocusEvent) {
    // relatedTarget is null when clicking a non-focusable element (and on Safari,
    // when clicking a button): that case is handled by onClickOutside
    const nextFocused = event.relatedTarget as Node | null
    const container = document.getElementById(CONTAINER_ID)
    if (nextFocused && container && !container.contains(nextFocused)) {
      close()
    }
  }

  function onClickOutside(event: MouseEvent) {
    const container = document.getElementById(CONTAINER_ID)
    if (container && !container.contains(event.target as Node)) {
      close()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', onKeydown)
    document.addEventListener('click', onClickOutside, true)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeydown)
    document.removeEventListener('click', onClickOutside, true)
  })
</script>

<style lang="scss" scoped>
  @use '~/assets/style/variables' as *;

  .disclosure {
    display: block;
    width: fit-content;
    position: relative;

    .menu {
      animation: slide-down 0.15s ease 1;
      left: 0;
      max-height: 50vh;
      overflow-y: auto;
      width: initial;
    }

    &.disclosure-right {
      margin-left: auto;

      .menu {
        right: 0;
        left: unset;

        .fr-btn {
          justify-content: flex-end;
          text-align: right;
        }
      }
    }
  }

  .menu .fr-btn {
    border-radius: 0;
    width: 100%;
    text-align: left;
    text-wrap: nowrap;
  }

  .disclosure-btn {
    span::before {
      --icon-size: 1.125rem;
    }
  }
</style>
