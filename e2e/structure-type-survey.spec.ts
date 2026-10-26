import type { BrowserContext, Page } from '@playwright/test'
import { test, expect } from '@playwright/test'
import type { UserRole } from '@prisma/client'
import { prismaClient } from '~~/server/prisma'
import { signJwt } from '~~/server/lib/jwt'

// Dedicated structure without survey, so that seeded structures stay untouched
const PREFIX = 'E2E-SURVEY-'
const CGU_VERSION = '1.2'

let managerId: string
let socialWorkerId: string

async function createUser(structureId: string, role: UserRole) {
  const user = await prismaClient.user.create({
    data: {
      firstName: `${PREFIX}${role}`,
      lastName: `${PREFIX}Test`,
      email: `${PREFIX}${role.toLowerCase()}@test.com`,
      role,
      status: 'Active',
      structureId,
      CGUHistory: { create: { version: CGU_VERSION } }
    }
  })
  return user.id
}

async function authenticateAs(context: BrowserContext, userId: string) {
  if (!process.env.NUXT_AUTH_JWT_KEY) {
    throw new Error('Missing NUXT_AUTH_JWT_KEY')
  }
  await context.addCookies([
    {
      name: 'MSS_SESSION_TOKEN',
      value: signJwt({ id: userId }, process.env.NUXT_AUTH_JWT_KEY, 60),
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: true
    }
  ])
}

/** Wait for Vue hydration, otherwise the form is submitted natively (GET) */
async function gotoHydrated(page: Page, path: string) {
  await page.goto(path)
  await page.waitForFunction(
    () => !!(document.querySelector('#__nuxt') as any)?.__vue_app__
  )
}

async function selectSocialSupportType(page: Page, label: string) {
  await page.getByRole('textbox', { name: /Types de suivi/ }).click()
  await page.getByRole('checkbox', { name: label }).check({ force: true })
}

test.beforeEach(async () => {
  const structure = await prismaClient.structure.create({
    data: {
      name: `${PREFIX}Structure`,
      type: 'Ccas',
      address: '1 rue Test',
      city: 'Testville',
      zipcode: '00000',
      phone: '01 00 00 00 00',
      email: `${PREFIX}structure@test.com`
    }
  })
  managerId = await createUser(structure.id, 'StructureManager')
  socialWorkerId = await createUser(structure.id, 'SocialWorker')
})

test.afterEach(async () => {
  const users = { email: { startsWith: PREFIX } }
  await prismaClient.userActivity.deleteMany({ where: { user: users } })
  // CGU history and survey are deleted in cascade
  await prismaClient.user.deleteMany({ where: users })
  await prismaClient.structure.deleteMany({
    where: { name: { startsWith: PREFIX } }
  })
})

test.describe('Structure survey as Structure Manager', () => {
  test('should display the survey without landing menu and let the manager skip it', async ({
    page,
    context
  }) => {
    await authenticateAs(context, managerId)

    await gotoHydrated(page, '/app/structure/structure-type')
    await expect(
      page.getByRole('heading', { name: 'Informations sur votre structure' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', {
        name: 'Demande d’information sur votre structure'
      })
    ).toBeVisible()
    // The landing navigation is hidden for authenticated managers
    await expect(page.locator('#landing-nav')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Se connecter' })).toHaveCount(
      0
    )

    // The survey does not block access to the app
    await page.getByRole('link', { name: 'Tableau de bord' }).click()
    await expect(page).toHaveURL(/app\/overview/)
  })

  test('should require a free text type when "Autre" is selected', async ({
    page,
    context
  }) => {
    await authenticateAs(context, managerId)

    await gotoHydrated(page, '/app/structure/structure-type')

    await page.getByLabel('Type de structure').selectOption('Autre')
    await selectSocialSupportType(page, 'Suivi étudiant')
    await page.getByRole('button', { name: 'Enregistrer vos réponses' }).click()

    await expect(
      page.getByLabel('Autre : précisez le type de structure')
    ).toBeVisible()
    await expect(page.locator('form')).toHaveText(
      /Veuillez renseigner ce champ/
    )
    await expect(page).toHaveURL(/app\/structure\/structure-type/)
  })

  test('should go to the dashboard once the survey is submitted', async ({
    page,
    context
  }) => {
    await authenticateAs(context, managerId)

    await gotoHydrated(page, '/app/structure/structure-type')

    await page.getByLabel('Type de structure').selectOption('CentreSocial')
    await selectSocialSupportType(page, 'Suivi social généraliste')
    await page.getByRole('button', { name: 'Enregistrer vos réponses' }).click()

    await expect(page).toHaveURL(/app\/overview/)

    await page.goto('/app/structure/structure-type')
    await expect(page).toHaveURL(/app\/overview/)
  })
})

test.describe('Structure survey as Social Worker', () => {
  test('should access the dashboard and not the survey', async ({
    page,
    context
  }) => {
    await authenticateAs(context, socialWorkerId)

    await page.goto('/app/overview')
    await expect(page).toHaveURL(/app\/overview/)

    await page.goto('/app/structure/structure-type')
    await expect(page).toHaveURL(/app\/overview/)
  })
})
