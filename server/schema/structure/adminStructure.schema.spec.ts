import { describe, test, expect } from 'vitest'
import {
  structureAdminInfoWithTypeSurveySchema,
  editStructureWithoutTypeSurveySchema
} from './adminStructure.schema'

const validBase = {
  type: 'Ccas',
  name: 'Structure',
  zipcode: '75001',
  city: 'Paris',
  address: '1 rue de Test',
  phone: '01 00 00 00 00',
  email: 'structure@test.com',
  inhabitantsNumber: '1000',
  inseeCode: '75056',
  siret: '12345678901234',
  dpoFirstName: 'Jean',
  dpoLastName: 'Dupont',
  dpoEmail: 'dpo@test.com'
}

const filledTypeSurvey = {
  structureType: 'Ccas',
  socialSupportTypes: ['SuiviSocialGeneraliste']
}

const emptyTypeSurvey = { socialSupportTypes: [] }

const getIssuePaths = (result: {
  success: boolean
  error?: { issues: { path: (string | number)[] }[] }
}) => result.error?.issues.map(issue => issue.path.join('.')) ?? []

describe('Admin Structure Schema - Type survey on creation or edition with existing survey', () => {
  test('Schema accepts a filled in type survey', () => {
    const result = structureAdminInfoWithTypeSurveySchema.safeParse({
      ...validBase,
      typeSurvey: filledTypeSurvey
    })
    expect(result.success).toBe(true)
  })

  test('Schema rejects an empty type survey', () => {
    const result = structureAdminInfoWithTypeSurveySchema.safeParse({
      ...validBase,
      typeSurvey: emptyTypeSurvey
    })
    expect(getIssuePaths(result)).toEqual([
      'typeSurvey.structureType',
      'typeSurvey.socialSupportTypes'
    ])
  })
})

describe('Admin Structure Schema - Type survey on edition without existing survey', () => {
  test('Schema treats an empty type survey as missing', () => {
    const result = editStructureWithoutTypeSurveySchema.safeParse({
      ...validBase,
      typeSurvey: emptyTypeSurvey
    })
    expect(result.success).toBe(true)
    expect(result.data?.typeSurvey).toBeUndefined()
  })

  test('Schema rejects a partially filled type survey', () => {
    const result = editStructureWithoutTypeSurveySchema.safeParse({
      ...validBase,
      typeSurvey: { structureType: 'Ccas', socialSupportTypes: [] }
    })
    expect(getIssuePaths(result)).toEqual(['typeSurvey.socialSupportTypes'])
  })
})
