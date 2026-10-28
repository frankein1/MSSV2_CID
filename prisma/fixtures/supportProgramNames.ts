import type { Prisma } from '@prisma/client'
import {
  fixtureStructures,
  FixtureStructure,
  fixturesUsers,
  FixtureUserRole
} from '.'

export enum FixtureProgramName {
  PortageRepas = 0,
  AideDomicile = 1,
  Externe = 2,
  GratuiteTransport = 3
}

export const fixturesSupportProgramNames = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: 'Soutien à la parentalité',
    structureId: fixtureStructures[FixtureStructure.Test].id,
    createdById: fixturesUsers[FixtureUserRole.StructureManager].id
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'Accès aux soins',
    structureId: fixtureStructures[FixtureStructure.Test].id,
    createdById: fixturesUsers[FixtureUserRole.StructureManager].id
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    name: 'Accès aux loisirs',
    structureId: fixtureStructures[FixtureStructure.Ministère].id,
    createdById: fixturesUsers[FixtureUserRole.StructureManagerMinistere].id
  },
  {
    id: 'd4e5f6a7-b8c9-0123-def0-234567890123',
    name: 'Dispositif PRE',
    hasLifecycle: true,
    structureId: fixtureStructures[FixtureStructure.Test].id,
    createdById: fixturesUsers[FixtureUserRole.StructureManager].id
  }
] satisfies [
  Prisma.SupportProgramNameCreateManyInput,
  Prisma.SupportProgramNameCreateManyInput,
  Prisma.SupportProgramNameCreateManyInput,
  Prisma.SupportProgramNameCreateManyInput
]
