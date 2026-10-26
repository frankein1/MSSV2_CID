import { describe, expect, beforeEach, afterEach } from 'vitest'
import type { UserRole } from '@prisma/client'
import { test, createCaller } from '~~/test/server/test-utils'
import { prismaClient } from '~~/server/prisma'

const PREFIX = 'SSSU-'

let structureId: string
let managerId: string
let managerCaller: ReturnType<typeof createCaller>
const otherRoleCallers: Partial<
  Record<UserRole, ReturnType<typeof createCaller>>
> = {}
const userIds: string[] = []

const createUserCaller = async (role: UserRole) => {
  const user = await prismaClient.user.create({
    data: {
      firstName: `${PREFIX}${role}`,
      lastName: `${PREFIX}Test`,
      email: `${PREFIX}${role.toLowerCase()}@test.com`,
      role,
      status: 'Active',
      structureId
    }
  })
  userIds.push(user.id)

  return {
    id: user.id,
    caller: createCaller({
      id: user.id,
      role,
      status: 'Active',
      structureId,
      structure: { id: structureId, type: 'Ccas', externalRdvspActive: null }
    })
  }
}

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

  const manager = await createUserCaller('StructureManager')
  managerId = manager.id
  managerCaller = manager.caller

  for (const role of [
    'SocialWorker',
    'Instructor',
    'ReceptionAgent',
    'Referent'
  ] as const) {
    otherRoleCallers[role] = (await createUserCaller(role)).caller
  }
})

afterEach(async () => {
  if (userIds.length) {
    await prismaClient.userActivity.deleteMany({
      where: { userId: { in: userIds } }
    })
    userIds.length = 0
  }
  // Surveys are deleted in cascade with their structure
  await prismaClient.user.deleteMany({
    where: { email: { startsWith: PREFIX } }
  })
  await prismaClient.structure.deleteMany({
    where: { name: { startsWith: PREFIX } }
  })
})

const input = {
  structureType: 'CentreSocial' as const,
  socialSupportTypes: [
    'SuiviSocialGeneraliste' as const,
    'InsertionEmploi' as const
  ]
}

const findSurvey = () =>
  prismaClient.structureTypeSurvey.findUnique({
    where: { structureId },
    select: {
      structureType: true,
      structureTypeOther: true,
      socialSupportTypes: true,
      filledById: true
    }
  })

describe('Structure - Submit Survey - Authorizations', () => {
  test('A StructureManager can submit the structure type survey', async () => {
    const result =
      await managerCaller.structure.submitStructureTypeSurvey(input)
    expect(result).toEqual({ id: expect.any(String) })
  })

  test.each([
    'SocialWorker',
    'Instructor',
    'ReceptionAgent',
    'Referent'
  ] as const)('A %s cannot submit the structure type survey', async role => {
    await expect(() =>
      otherRoleCallers[role]!.structure.submitStructureTypeSurvey(input)
    ).rejects.toThrow(/not allowed to access route/i)
  })

  test('An Administrator cannot submit the structure type survey', async ({
    trpc
  }) => {
    await expect(() =>
      trpc.administrator.structure.submitStructureTypeSurvey(input)
    ).rejects.toThrow(/user routes are not available to admins/i)
  })
})

describe('Structure - Submit Survey - Data', () => {
  test('A StructureManager submission is saved with its author', async () => {
    await managerCaller.structure.submitStructureTypeSurvey(input)

    expect(await findSurvey()).toEqual({
      structureType: 'CentreSocial',
      structureTypeOther: null,
      socialSupportTypes: ['SuiviSocialGeneraliste', 'InsertionEmploi'],
      filledById: managerId
    })
  })

  test('A StructureManager can submit "Autre" with a free text type', async () => {
    await managerCaller.structure.submitStructureTypeSurvey({
      ...input,
      structureType: 'Autre',
      structureTypeOther: '  Maison France Services  '
    })

    expect(await findSurvey()).toEqual({
      structureType: 'Autre',
      structureTypeOther: 'Maison France Services',
      socialSupportTypes: ['SuiviSocialGeneraliste', 'InsertionEmploi'],
      filledById: managerId
    })
  })

  test('A free text type is dropped when the structure type is not "Autre"', async () => {
    await managerCaller.structure.submitStructureTypeSurvey({
      ...input,
      structureTypeOther: 'Ignored'
    })

    expect((await findSurvey())?.structureTypeOther).toBeNull()
  })

  test('A StructureManager cannot submit the survey twice', async () => {
    await managerCaller.structure.submitStructureTypeSurvey(input)

    await expect(() =>
      managerCaller.structure.submitStructureTypeSurvey(input)
    ).rejects.toThrow(/survey already submitted/i)
  })
})

describe('Structure - Submit Survey - Validation', () => {
  test('A StructureManager cannot submit "Autre" without a free text type', async () => {
    await expect(() =>
      managerCaller.structure.submitStructureTypeSurvey({
        ...input,
        structureType: 'Autre',
        structureTypeOther: ' '
      })
    ).rejects.toThrow(/structureTypeOther/i)
  })

  test('A StructureManager cannot submit without any social support type', async () => {
    await expect(() =>
      managerCaller.structure.submitStructureTypeSurvey({
        ...input,
        socialSupportTypes: []
      })
    ).rejects.toThrow(/au moins un type de suivi/i)
  })
})
