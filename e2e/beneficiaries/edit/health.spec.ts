import { test, expect } from '@playwright/test'
import { prismaClient } from '~~/server/prisma'
import { fixturesBeneficiaries, FixtureBeneficiary } from '~~/prisma/fixtures'
import { gotoHydrated } from '~~/e2e/helpers/navigation'

const idCoursor = fixturesBeneficiaries[FixtureBeneficiary.COURSOR].id
const idPenberthy = fixturesBeneficiaries[FixtureBeneficiary.PENBERTHY].id
const idMartin = fixturesBeneficiaries[FixtureBeneficiary.MARTIN].id

test.afterEach(async () => {
  await prismaClient.beneficiary.update({
    where: { id: idCoursor },
    data: {
      gir: null,
      doctor: null,
      healthAdditionalInformation: null,
      socialSecurityNumber: null,
      insurance: null
    }
  })
})

const healthUrl = (id: string) => `/app/beneficiaries/${id}/edit/health`
const beneficiaryUrl = (familyFileId: string, id: string) =>
  `/app/files/${familyFileId}?beneficiaryId=${id}`

test.describe('Ccas Agent accessing beneficiary health form', () => {
  test.use({ storageState: 'playwright/.auth/structure-manager.json' })

  test('should be able to access health section, find and modify NIR field when referent of the beneficiary', async ({
    page
  }) => {
    const id = fixturesBeneficiaries[FixtureBeneficiary.COURSOR].id
    const familyFileId =
      fixturesBeneficiaries[FixtureBeneficiary.COURSOR].familyFileId
    await gotoHydrated(page, healthUrl(id))

    const healthSection = page.getByRole('button', { name: /santé/i })
    const nir = page.getByLabel(/sécurité sociale/i)

    await expect.soft(healthSection).toBeAttached()
    await expect.soft(nir).toBeAttached()

    await page.getByLabel(/gir/i).selectOption('Niveau 5')
    await page.getByLabel(/médecin traitant/i).fill('Docteur Test')
    await nir.fill('2 78 12 98 203 256 45')
    await page.getByRole('button', { name: /enregistrer et quitter/i }).click()

    await page.waitForURL(beneficiaryUrl(familyFileId, id))
    const url = page.url()

    expect
      .soft(url)
      .toBe(`http://localhost:3000${beneficiaryUrl(familyFileId, id)}`)

    const panel = page.getByRole('tabpanel', { name: /informations/i })

    await expect.soft(panel).toContainText('Santé')
    await expect.soft(panel).toContainText('Niveau 5')
    await expect.soft(panel).toContainText('Docteur Test')
    await expect.soft(panel).toContainText('2 78 12 98 203 256 45')
  })

  test('should not be able to access health section or health form when not referent of the beneficiary', async ({
    page
  }) => {
    await page.goto(healthUrl(idPenberthy))

    const healthSection = page.getByRole('button', { name: /santé/i })

    await expect.soft(healthSection).not.toBeAttached()
  })
})

test.describe('Beneficiary Health Form as Ministry Agent', () => {
  test.use({
    storageState: 'playwright/.auth/structure-manager-ministere.json'
  })

  test('should be able to access health section but not access or modify NIR field when referent of the beneficiary', async ({
    page
  }) => {
    await page.goto(healthUrl(idMartin))

    const healthSection = page.getByRole('button', { name: /santé/i })
    const gir = page.getByLabel(/gir/i)
    const doctor = page.getByLabel(/médecin traitant/i)
    const nir = page.getByLabel(/sécurité sociale/i)

    await expect.soft(healthSection).toBeAttached()
    await expect.soft(gir).toBeAttached()
    await expect.soft(doctor).toBeAttached()
    await expect.soft(nir).not.toBeAttached()
  })
})
