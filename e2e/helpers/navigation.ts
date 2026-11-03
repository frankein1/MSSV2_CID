import type { Page } from '@playwright/test'

/**
 * Navigates to a page and waits for Nuxt hydration to complete.
 * Interacting before hydration ends either submits forms natively (GET)
 * or loses typed values when Vue takes over the inputs.
 * `__vue_app__` alone is not enough: it is set as soon as Vue mounts,
 * while async components may still be hydrating.
 */
export async function gotoHydrated(page: Page, path: string) {
  await page.goto(path)
  await page.waitForFunction(() => {
    const container = document.querySelector('#__nuxt') as
      | (Element & {
          __vue_app__?: { $nuxt?: { isHydrating?: boolean } }
        })
      | null
    return container?.__vue_app__?.$nuxt?.isHydrating === false
  })
}
