import { test, expect } from '@playwright/test'
import { prismaClient } from '~~/server/prisma'
import { FixtureUserRole, fixturesUsers } from '~~/prisma/fixtures'
import { gotoHydrated } from '~~/e2e/helpers/navigation'

test.afterEach(async () => {
  await prismaClient.cGUHistory.deleteMany({
    where: {
      userId: {
        in: [
          fixturesUsers[FixtureUserRole.StructureManagerNew].id,
          fixturesUsers[FixtureUserRole.SocialWorkerNew].id
        ]
      }
    }
  })
})

test.describe('Validate CGU as new Structure Manager', () => {
  test.use({ storageState: 'playwright/.auth/structure-manager-new-user.json' })

  test('should redirect to CGU if they have not been accepted yet', async ({
    page
  }) => {
    await page.goto('/app/overview')

    await expect(page).toHaveURL(/cgu\/manager/)
  })

  // test('should redirect to manager CGU when trying to access user CGU', async ({
  //   page
  // }) => {
  //   await page.goto('/cgu/user')

  //   await expect(page).toHaveURL(/cgu\/manager/)
  // })

  test('should show error if CGU are not read and accepted before validation', async ({
    page
  }) => {
    await gotoHydrated(page, '/cgu/manager')

    await page.getByRole('button', { name: 'Enregistrer' }).click()

    const form = page.locator('form')
    await expect(form).toHaveText(/Veuillez lire les CGU/)
    await expect(form).toHaveText(/Veuillez accepter les CGU/)
  })

  test('should validate CGU if read and accepted', async ({ page }) => {
    await gotoHydrated(page, '/cgu/manager')

    await page
      .getByRole('checkbox', { name: /confirme/i })
      .check({ force: true })
    await page
      .getByRole('checkbox', { name: /accepte/i })
      .check({ force: true })
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    await expect(page).toHaveURL(/app\/overview/)
  })
})

test.describe('Validate CGU as new Social Worker', () => {
  test.use({ storageState: 'playwright/.auth/social-worker-new-user.json' })

  test('should redirect to CGU if they have not been accepted yet', async ({
    page
  }) => {
    await page.goto('/app/overview')

    await expect(page).toHaveURL(/cgu\/user/)
  })

  // test('should redirect to user CGU when trying to access manager CGU', async ({
  //   page
  // }) => {
  //   await page.goto('/cgu/manager')

  //   await expect(page).toHaveURL(/cgu\/user/)
  // })

  test('should show error if CGU are not read and accepted before validation', async ({
    page
  }) => {
    await gotoHydrated(page, '/cgu/user')

    await page.getByRole('button', { name: 'Enregistrer' }).click()

    const form = page.locator('form')
    await expect(form).toHaveText(/Veuillez lire les CGU/)
    await expect(form).toHaveText(/Veuillez accepter les CGU/)
  })

  test('should validate CGU if read and accepted', async ({ page }) => {
    await gotoHydrated(page, '/cgu/user')

    await page
      .getByRole('checkbox', { name: /confirme/i })
      .check({ force: true })
    await page
      .getByRole('checkbox', { name: /accepte/i })
      .check({ force: true })
    await page.getByRole('button', { name: 'Enregistrer' }).click()

    await expect(page).toHaveURL(/app\/overview/)
  })
})
