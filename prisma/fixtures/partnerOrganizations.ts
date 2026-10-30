import type { Prisma } from '@prisma/client'
import { fixtureStructures } from '../fixtures'
import { fixturesDataInclusionStructures } from './dataInclusionStructures'

const structureId = fixtureStructures[0].id
const v0 = fixturesDataInclusionStructures

export enum FixturePartnerOrganization {
  CAF26 = 0,
  FranceTravail = 1,
  MairieValence = 2,
  MasinSolidarited = 3,
  V1MDADrôme = 4,
  V1CCASPortesLèsValence = 5,
  V1CCASTainLHermitage = 6,
  V1FranceServicesLivron = 7,
  V1MJCEtoile = 8,
  MatchedCroixRouge = 9,
  MatchedSecoursCatholique = 10,
  MatchedRestosDuCoeur = 11,
  MatchedSecuriteSociale = 12,
  MatchedEmmaüs = 13,
  V0MédecinsDuMonde = 14,
  V0APFHandicap = 15,
  V0ATDQuartMonde = 16,
  V0PetitsFreres = 17,
  V0AbbéPierre = 18
}

export const fixturesPartnerOrganizations = [
  // Custom (no data inclusion)
  {
    id: '16f4c01f-738a-41b0-918c-73ae14e4267c',
    name: 'CMP',
    structureId
  },
  {
    id: '8a2d66f7-1d4b-4ac5-8238-7082d51b8281',
    name: 'Centre social et socioculturel',
    structureId
  },
  {
    id: 'f4105259-e47e-46b3-8a52-61b3ea273be4',
    name: 'Education nationale',
    structureId
  },
  {
    id: 'c8825cc8-76fb-4792-8add-f66b62e8c839',
    name: 'MDS',
    structureId,
    inactive: true
  },
  // V1 partner orgs (dataInclusionIdV1 filled, no v0)
  {
    id: 'a1b2c3d4-1111-4000-8000-000000000001',
    name: 'CLAS',
    structureId,
    dataInclusionIdV1: 'ma-boussole-aidants--10012430'
  },
  {
    id: 'a1b2c3d4-1111-4000-8000-000000000002',
    name: 'CCAS',
    structureId,
    dataInclusionIdV1: 'ma-boussole-aidants--10004354'
  },
  {
    id: 'a1b2c3d4-1111-4000-8000-000000000003',
    name: 'PMI',
    structureId,
    dataInclusionIdV1: 'ma-boussole-aidants--10004359'
  },
  {
    id: 'a1b2c3d4-1111-4000-8000-000000000004',
    name: 'France services',
    structureId,
    dataInclusionIdV1: 'mediation-numerique--France-Services_157'
  },
  {
    id: 'a1b2c3d4-1111-4000-8000-000000000005',
    name: 'MJC',
    structureId,
    dataInclusionIdV1: 'mediation-numerique--Hinaura_MjcEtoile3'
  },
  // V1 partner orgs — have been matched (v0 ID resolves to a v1 structure)
  {
    id: 'b2c3d4e5-2222-4000-8000-000000000001',
    name: 'CAF',
    structureId,
    dataInclusionId: v0[0].id,
    dataInclusionIdV1: `dora--${v0[0].id}`
  },
  {
    id: 'b2c3d4e5-2222-4000-8000-000000000002',
    name: 'CMPP',
    structureId,
    dataInclusionId: v0[1].id,
    dataInclusionIdV1: `dora--${v0[1].id}`
  },
  {
    id: 'b2c3d4e5-2222-4000-8000-000000000003',
    name: 'Mission locale',
    structureId,
    dataInclusionId: v0[2].id,
    dataInclusionIdV1: `dora--${v0[2].id}`
  },
  {
    id: 'b2c3d4e5-2222-4000-8000-000000000004',
    name: 'CPAM',
    structureId,
    dataInclusionId: v0[3].id,
    dataInclusionIdV1: `dora--${v0[3].id}`
  },
  {
    id: 'b2c3d4e5-2222-4000-8000-000000000005',
    name: 'ASE',
    structureId,
    dataInclusionId: v0[4].id,
    dataInclusionIdV1: `dora--${v0[4].id}`
  },
  // V0 legacy partner orgs — unmatched (no corresponding v1 structure)
  {
    id: 'b2c3d4e5-2222-4000-8000-000000000006',
    name: 'Club de prévention',
    structureId,
    dataInclusionId: v0[5].id
  },
  {
    id: 'b2c3d4e5-2222-4000-8000-000000000007',
    name: 'Centre médico-social',
    structureId,
    dataInclusionId: v0[6].id
  },
  {
    id: 'b2c3d4e5-2222-4000-8000-000000000008',
    name: 'Point accueil écoute jeunes',
    structureId,
    dataInclusionId: v0[7].id
  },
  {
    id: 'b2c3d4e5-2222-4000-8000-000000000009',
    name: 'Médiathèque',
    structureId,
    dataInclusionId: v0[8].id
  },
  {
    id: 'b2c3d4e5-2222-4000-8000-00000000000a',
    name: 'Ludothèque',
    structureId,
    dataInclusionId: v0[9].id
  }
] satisfies [
  Prisma.PartnerOrganizationUncheckedCreateInput,
  Prisma.PartnerOrganizationUncheckedCreateInput,
  Prisma.PartnerOrganizationUncheckedCreateInput,
  Prisma.PartnerOrganizationUncheckedCreateInput,
  Prisma.PartnerOrganizationUncheckedCreateInput,
  Prisma.PartnerOrganizationUncheckedCreateInput,
  Prisma.PartnerOrganizationUncheckedCreateInput,
  Prisma.PartnerOrganizationUncheckedCreateInput,
  Prisma.PartnerOrganizationUncheckedCreateInput,
  Prisma.PartnerOrganizationUncheckedCreateInput,
  Prisma.PartnerOrganizationUncheckedCreateInput,
  Prisma.PartnerOrganizationUncheckedCreateInput,
  Prisma.PartnerOrganizationUncheckedCreateInput,
  Prisma.PartnerOrganizationUncheckedCreateInput,
  Prisma.PartnerOrganizationUncheckedCreateInput,
  Prisma.PartnerOrganizationUncheckedCreateInput,
  Prisma.PartnerOrganizationUncheckedCreateInput,
  Prisma.PartnerOrganizationUncheckedCreateInput,
  Prisma.PartnerOrganizationUncheckedCreateInput
]
