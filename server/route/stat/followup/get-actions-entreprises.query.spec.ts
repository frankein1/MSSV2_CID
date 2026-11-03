import { describe, expect, beforeAll, afterAll } from 'vitest'
import type { inferProcedureInput, inferProcedureOutput } from '@trpc/server'
import { test } from '~~/test/server/test-utils'
import { prismaClient } from '~~/server/prisma'
import {
  fixtureStructures,
  FixtureStructure,
  fixturesUsers,
  FixtureUserRole,
  fixturesBeneficiaries,
  FixtureBeneficiary
} from '~~/prisma/fixtures'

import type { AppRouter } from '~~/server/trpc/routers'

type Input = inferProcedureInput<
  AppRouter['stat']['getFollowupActionsEntreprisesStats']
>

type Output = inferProcedureOutput<
  AppRouter['stat']['getFollowupActionsEntreprisesStats']
>

const parseStats = (stats: Output) =>
  stats.reduce<Record<string, number>>(
    (acc, { actionEntreprise, _count }) => ({
      ...acc,
      [actionEntreprise]: _count
    }),
    {}
  )

const structureId = fixtureStructures[FixtureStructure.Ministère].id
const createdById = fixturesUsers[FixtureUserRole.StructureManagerMinistere].id

// Mixes true / false / null for each flag so that every tile shows a distinct count
const followupRows = [
  {
    beneficiary: fixturesBeneficiaries[FixtureBeneficiary.MARTIN],
    classified: true,
    forwardedToJustice: true,
    helpRequested: true
  },
  {
    beneficiary: fixturesBeneficiaries[FixtureBeneficiary.DUPONT],
    classified: true,
    forwardedToJustice: false,
    helpRequested: true
  },
  {
    beneficiary: fixturesBeneficiaries[FixtureBeneficiary.LEROY],
    classified: false,
    forwardedToJustice: null,
    helpRequested: false
  },
  {
    beneficiary: fixturesBeneficiaries[FixtureBeneficiary.MOREAU],
    classified: null,
    forwardedToJustice: false,
    helpRequested: false
  },
  {
    beneficiary: fixturesBeneficiaries[FixtureBeneficiary.MARTIN],
    classified: false,
    forwardedToJustice: false,
    helpRequested: false
  }
]

const socialSupportIds: string[] = []

const createMinistereFollowups = async () => {
  for (const {
    beneficiary,
    classified,
    forwardedToJustice,
    helpRequested
  } of followupRows) {
    const socialSupport = await prismaClient.socialSupport.create({
      select: { id: true },
      data: {
        structure: { connect: { id: structureId } },
        familyFile: { connect: { id: beneficiary.familyFileId } },
        beneficiary: { connect: { id: beneficiary.id } },
        createdBy: { connect: { id: createdById } },
        socialSupportType: 'Followup',
        status: 'Done',
        date: new Date(),
        followup: {
          create: {
            medium: 'PhoneCall',
            classified,
            forwardedToJustice,
            helpRequested
          }
        }
      }
    })
    socialSupportIds.push(socialSupport.id)
  }
}

const deleteMinistereFollowups = async () => {
  await prismaClient.socialSupport.deleteMany({
    where: { id: { in: socialSupportIds } }
  })
  socialSupportIds.length = 0
}

describe('Statistics - Followup - Actions Entreprises', () => {
  test('should compute stats as a structure manager with no filters', async ({
    trpc
  }) => {
    const input: Input = {}

    const stats =
      await trpc.structureManager.stat.getFollowupActionsEntreprisesStats(input)

    expect(parseStats(stats)).toEqual({
      Instruction: 0
    })
  })

  test('should compute stats including only beneficiaries followed as a referent', async ({
    trpc
  }) => {
    const input: Input = {}

    const stats =
      await trpc.referent.stat.getFollowupActionsEntreprisesStats(input)

    expect(parseStats(stats)).toEqual({
      Instruction: 0
    })
  })
})

describe('Statistics - Followup - Actions Entreprises - Ministère', () => {
  beforeAll(createMinistereFollowups)
  afterAll(deleteMinistereFollowups)

  test('should compute stats as a structure manager from a ministère structure with no filters', async ({
    trpc
  }) => {
    const input: Input = {}

    const stats =
      await trpc.structureManagerMinistere.stat.getFollowupActionsEntreprisesStats(
        input
      )

    expect(parseStats(stats)).toEqual({
      'Instruction': 2,
      'Classé': 2,
      'Transmis à la justice': 1
    })
    expect(
      stats.map(({ actionEntrepriseId }) => actionEntrepriseId).sort()
    ).toEqual(['classified', 'forwardedToJustice', 'helpRequested'])
  })
})
