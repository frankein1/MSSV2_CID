import { describe, expect, beforeEach, afterEach } from 'vitest'
import { test } from '~~/test/server/test-utils'
import { prismaClient } from '~~/server/prisma'

const PREFIX = 'USI-'
let structureId: string

const typeSurvey = {
  structureType: 'Ccas' as const,
  socialSupportTypes: ['SuiviSocialGeneraliste' as const]
}

const validInput = () => ({
  id: structureId,
  type: 'Ccas' as const,
  name: `${PREFIX}Structure`,
  zipcode: '00000',
  city: 'Testville',
  address: '1 rue Test',
  phone: '01 00 00 00 00',
  email: `${PREFIX}structure@test.com`,
  dpoFirstName: 'Jean',
  dpoLastName: 'Dupont',
  dpoEmail: 'dpo@test.com',
  typeSurvey
})

const findSurvey = () =>
  prismaClient.structureTypeSurvey.findUniqueOrThrow({
    where: { structureId },
    select: {
      structureType: true,
      structureTypeOther: true,
      socialSupportTypes: true
    }
  })

beforeEach(async () => {
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
  structureId = structure.id
})

afterEach(async () => {
  await prismaClient.structure.deleteMany({
    where: { name: { startsWith: PREFIX } }
  })
})

describe('Admin - Update Structure Info - Authorizations', () => {
  test('A non-admin user is rejected', async ({ trpc }) => {
    await expect(() =>
      trpc.structureManager.admin.updateStructureInfo({
        id: structureId,
        type: 'Ccas',
        name: `${PREFIX}Structure`,
        zipcode: '00000',
        city: 'Testville',
        address: '1 rue Test',
        phone: '01 00 00 00 00',
        email: `${PREFIX}structure@test.com`,
        dpoFirstName: 'Jean',
        dpoLastName: 'Dupont',
        dpoEmail: 'dpo@test.com',
        typeSurvey
      })
    ).rejects.toThrow(/user is not an administrator/i)
  })
})

describe('Admin - Update Structure Info - Happy path', () => {
  test('An administrator can update structure admin info', async ({ trpc }) => {
    const result = await trpc.administrator.admin.updateStructureInfo({
      id: structureId,
      type: 'Ccas',
      name: `${PREFIX}Updated Name`,
      zipcode: '00000',
      city: `${PREFIX}Updated City`,
      address: '99 rue Updated',
      phone: '01 00 00 00 00',
      email: `${PREFIX}updated@test.com`,
      dpoFirstName: 'Marie',
      dpoLastName: 'Martin',
      dpoEmail: 'dpo-updated@test.com',
      typeSurvey
    })

    expect(result.id).toBe(structureId)

    const updated = await prismaClient.structure.findUniqueOrThrow({
      where: { id: structureId }
    })
    expect(updated.name).toBe(`${PREFIX}Updated Name`)
    expect(updated.city).toBe(`${PREFIX}Updated City`)
    expect(updated.address).toBe('99 rue Updated')
    expect(updated.email).toBe(`${PREFIX}updated@test.com`)
    expect(updated.dpoFirstName).toBe('Marie')
    expect(updated.dpoLastName).toBe('MARTIN')
    expect(updated.dpoEmail).toBe('dpo-updated@test.com')
  })
})

describe('Admin - Update Structure Info - Type survey', () => {
  test('An administrator creates the type survey when the structure has none', async ({
    trpc
  }) => {
    await trpc.administrator.admin.updateStructureInfo(validInput())

    expect(await findSurvey()).toEqual({
      structureType: 'Ccas',
      structureTypeOther: null,
      socialSupportTypes: ['SuiviSocialGeneraliste']
    })
  })

  test('An administrator updates the existing type survey', async ({
    trpc
  }) => {
    await prismaClient.structureTypeSurvey.create({
      data: {
        structureId,
        structureType: 'Commune',
        socialSupportTypes: ['SuiviEtudiant']
      }
    })

    await trpc.administrator.admin.updateStructureInfo({
      ...validInput(),
      typeSurvey: {
        structureType: 'Autre',
        structureTypeOther: 'Mutuelle',
        socialSupportTypes: ['InsertionEmploi', 'SuiviSocialGeneraliste']
      }
    })

    expect(await findSurvey()).toEqual({
      structureType: 'Autre',
      structureTypeOther: 'Mutuelle',
      socialSupportTypes: ['InsertionEmploi', 'SuiviSocialGeneraliste']
    })
  })

  test('An administrator can update a structure without the type survey', async ({
    trpc
  }) => {
    const { typeSurvey: _typeSurvey, ...inputWithoutSurvey } = validInput()
    await trpc.administrator.admin.updateStructureInfo(inputWithoutSurvey)

    expect(
      await prismaClient.structureTypeSurvey.findUnique({
        where: { structureId }
      })
    ).toBeNull()
  })

  test('An empty type survey keeps the existing one unchanged', async ({
    trpc
  }) => {
    await prismaClient.structureTypeSurvey.create({
      data: {
        structureId,
        structureType: 'Commune',
        socialSupportTypes: ['SuiviEtudiant']
      }
    })

    await trpc.administrator.admin.updateStructureInfo({
      ...validInput(),
      typeSurvey: { socialSupportTypes: [] }
    })

    expect(await findSurvey()).toEqual({
      structureType: 'Commune',
      structureTypeOther: null,
      socialSupportTypes: ['SuiviEtudiant']
    })
  })

  test('An administrator cannot submit a partially filled type survey', async ({
    trpc
  }) => {
    await expect(() =>
      trpc.administrator.admin.updateStructureInfo({
        ...validInput(),
        typeSurvey: { structureType: 'Ccas', socialSupportTypes: [] }
      })
    ).rejects.toThrow(/socialSupportTypes/i)
  })
})
