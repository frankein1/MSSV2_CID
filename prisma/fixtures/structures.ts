import type { Prisma } from '@prisma/client'

export enum FixtureStructure {
  Test = 0,
  Autun = 1,
  Ministère = 2,
  Inactive = 3
}

export const fixtureStructures = [
  {
    id: '8adcd106-c652-4e4c-80df-beb373fae252',
    name: 'CCAS de Test',
    email: 'ccas-test@yopmail.com',
    type: 'Ccas',
    address: '1 rue du Ruisseau',
    city: 'Ennui-sur-Blasé',
    zipcode: '00000',
    phone: '01 00 00 00 00'
  },
  {
    id: '312b0b1e-d4fe-43e6-b8ca-48012dad4335',
    name: 'CCAS Autun',
    email: 'ccas-test-autun@yopmail.com',
    type: 'Ccas',
    address: '1 rue des érables',
    city: 'Autun',
    zipcode: '71400',
    phone: '01 02 02 02 02'
  },
  {
    id: '50421089-d230-431c-99ca-0beb177fb0e9',
    name: 'Structure Test Ministère',
    email: 'ministere-test@yopmail.com',
    type: 'Ministere',
    address: '43 rue Test',
    city: 'Paris',
    zipcode: '75004',
    phone: '+33 1 22 33 44 56'
  },
  {
    id: '9c1f2a44-0f3b-4c5d-9a11-7e8b6d4c3a20',
    name: 'CCAS Inactif',
    email: 'ccas-test-inactif@yopmail.com',
    type: 'Ccas',
    address: '2 rue Dormante',
    city: 'Sommeil-les-Bains',
    zipcode: '12345',
    phone: '01 03 03 03 03',
    lastAccess: new Date('2024-01-01'),
    deactivationAlertEmail: 2,
    deactivationAlertEmailDate: new Date('2024-07-01')
  }
] satisfies [
  Prisma.StructureCreateManyInput,
  Prisma.StructureCreateManyInput,
  Prisma.StructureCreateManyInput,
  Prisma.StructureCreateManyInput
]

export const fixturesStructureTypeSurveys = [
  {
    id: 'b6f0d7e2-3c41-4a8e-9f52-1d7c6a9e4b10',
    structureId: fixtureStructures[FixtureStructure.Test].id,
    structureType: 'Ccas',
    socialSupportTypes: ['SuiviSocialGeneraliste']
  },
  {
    id: 'e2a94c18-7b6d-4f35-8c09-5a3e1f8d2c74',
    structureId: fixtureStructures[FixtureStructure.Ministère].id,
    structureType: 'Ministere',
    socialSupportTypes: ['ServiceSocialPersonnel']
  }
] satisfies Prisma.StructureTypeSurveyCreateManyInput[]
