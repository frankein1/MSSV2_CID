import { describe, expect, afterEach } from 'vitest'
import { test } from '~~/test/server/test-utils'
import { prismaClient } from '~~/server/prisma'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

mockNuxtImport('useRuntimeConfig', () => {
  return () => ({
    app: { baseURL: '/' },
    public: { email: { from: 'mss@example.com' } },
    document: { useS3Storage: true },
    logs: { activateRequestLogging: false }
  })
})

const createdIds: string[] = []

const track = <T extends { id: string }>(result: T) => {
  createdIds.push(result.id)
  return result
}

afterEach(async () => {
  if (createdIds.length) {
    await prismaClient.socialSupportSubject.deleteMany({
      where: { ownedByStructureId: { in: createdIds } }
    })
    await prismaClient.structure.deleteMany({
      where: { id: { in: createdIds } }
    })
    createdIds.length = 0
  }
})

const validInput = {
  type: 'Ccas' as const,
  name: 'Test Structure Spec',
  zipcode: '75001',
  city: 'Paris',
  address: '1 rue de Test',
  phone: '01 00 00 00 00',
  email: 'create-structure-spec@test.com',
  dpoFirstName: 'Jean',
  dpoLastName: 'Dupont',
  dpoEmail: 'dpo-spec@test.com',
  typeSurvey: {
    structureType: 'Ccas' as const,
    socialSupportTypes: ['SuiviSocialGeneraliste' as const]
  }
}

describe('Admin - Create Structure - Authorizations', () => {
  test('A non-admin user is rejected', async ({ trpc }) => {
    await expect(() =>
      trpc.structureManager.admin.createStructure(validInput)
    ).rejects.toThrow(/user is not an administrator/i)
  })
})

describe('Admin - Create Structure - Happy path', () => {
  test('An administrator can create a structure with default social support subjects', async ({
    trpc
  }) => {
    const result = track(
      await trpc.administrator.admin.createStructure(validInput)
    )

    expect(result.id).toBeDefined()

    const structure = await prismaClient.structure.findUniqueOrThrow({
      where: { id: result.id }
    })
    expect(structure.name).toBe('Test Structure Spec')
    expect(structure.type).toBe('Ccas')
    expect(structure.email).toBe('create-structure-spec@test.com')

    const subjects = await prismaClient.socialSupportSubject.findMany({
      where: { ownedByStructureId: result.id }
    })
    expect(subjects.length).toBeGreaterThan(0)

    const survey = await prismaClient.structureTypeSurvey.findUniqueOrThrow({
      where: { structureId: result.id }
    })
    expect(survey.structureType).toBe('Ccas')
    expect(survey.socialSupportTypes).toEqual(['SuiviSocialGeneraliste'])
    expect(survey.structureTypeOther).toBeNull()
  })
})

describe('Admin - Create Structure - Validation', () => {
  test('The type survey is required', async ({ trpc }) => {
    const { typeSurvey: _typeSurvey, ...inputWithoutSurvey } = validInput
    await expect(() =>
      trpc.administrator.admin.createStructure(
        // @ts-expect-error typeSurvey is deliberately missing
        inputWithoutSurvey
      )
    ).rejects.toThrow(/typeSurvey/)
  })

  test('At least one social support type is required', async ({ trpc }) => {
    await expect(() =>
      trpc.administrator.admin.createStructure({
        ...validInput,
        typeSurvey: { structureType: 'Ccas', socialSupportTypes: [] }
      })
    ).rejects.toThrow(/socialSupportTypes/)
  })

  test('structureTypeOther is required when the structure type is Autre', async ({
    trpc
  }) => {
    await expect(() =>
      trpc.administrator.admin.createStructure({
        ...validInput,
        typeSurvey: {
          structureType: 'Autre',
          socialSupportTypes: ['SuiviSocialGeneraliste']
        }
      })
    ).rejects.toThrow(/structureTypeOther/)
  })
})
