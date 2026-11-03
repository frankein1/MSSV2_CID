import type { Page } from '@playwright/test'
import { test, expect } from '@playwright/test'
import { fixturesUsers, FixtureUserRole } from '~~/prisma/fixtures'
import { prismaClient } from '~~/server/prisma'
import { gotoHydrated } from '~~/e2e/helpers/navigation'

async function validateHeadings(page: Page) {
  await expect(page).toHaveTitle(/Tableau de bord/)

  await expect(
    page.getByRole('heading', { name: 'Tableau de bord' })
  ).toBeVisible()
}

async function validateLegals(page: Page, role: 'user' | 'manager') {
  // CGU
  const cgu = page.getByRole('link', { name: 'CGU' })
  await expect(cgu).toBeVisible()
  await expect(cgu).toHaveAttribute('href', new RegExp(`cgu/${role}`))

  // Politique confidentialité
  const confidentialite = page.getByRole('link', {
    name: 'Politique de confidentialité'
  })
  await expect(confidentialite).toBeVisible()
  await expect(confidentialite).toHaveAttribute(
    'href',
    /politique-confidentialite/
  )

  // Accessibilité
  const accessibilite = page.getByRole('link', { name: /Accessibilité/ })
  await expect(accessibilite).toBeVisible()
  await expect(accessibilite).toHaveAttribute(
    'href',
    /declaration-accessibilite/
  )
}

async function validateTopbarMenu(page: Page, expected: string[]) {
  const topbar = page.locator('.topbar__container')
  await topbar.getByRole('button').click()
  await expect(topbar.getByRole('listitem')).toHaveText(expected)
}

test.describe('Homepage as authenticated Structure Manager', () => {
  test.use({ storageState: 'playwright/.auth/structure-manager.json' })

  // The structure type survey is proposed when loading the dashboard: fill it beforehand
  let createdSurveyId: string | null = null

  test.beforeAll(async () => {
    const { structureId } = await prismaClient.user.findUniqueOrThrow({
      where: { id: fixturesUsers[FixtureUserRole.StructureManager].id },
      select: { structureId: true }
    })
    if (!structureId) {
      throw new Error('Structure manager fixture has no structure')
    }
    const survey = await prismaClient.structureTypeSurvey.findUnique({
      where: { structureId },
      select: { id: true }
    })
    if (!survey) {
      const created = await prismaClient.structureTypeSurvey.create({
        data: {
          structureId,
          structureType: 'Ccas',
          socialSupportTypes: ['SuiviSocialGeneraliste']
        },
        select: { id: true }
      })
      createdSurveyId = created.id
    }
  })

  test.afterAll(async () => {
    if (createdSurveyId) {
      await prismaClient.structureTypeSurvey.delete({
        where: { id: createdSurveyId }
      })
    }
  })

  test('should have title, legal mentions and settings menu', async ({
    page
  }) => {
    await gotoHydrated(page, '/app/overview')

    await validateHeadings(page)
    await validateLegals(page, 'manager')
    await validateTopbarMenu(page, ['Configuration', 'Déconnexion'])
  })
})

test.describe('Homepage as authenticated Social Worker', () => {
  test.use({ storageState: 'playwright/.auth/social-worker.json' })

  test('should have title, legal mentions and settings menu', async ({
    page
  }) => {
    await gotoHydrated(page, '/app/overview')

    await validateHeadings(page)
    await validateLegals(page, 'user')
    await validateTopbarMenu(page, ['Configuration', 'Déconnexion'])
  })
})
