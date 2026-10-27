import { describe, expect } from 'vitest'
import type { inferProcedureInput, inferProcedureOutput } from '@trpc/server'
import { FileInstructionType } from '@prisma/client'
import { test } from '~~/test/server/test-utils'

import type { AppRouter } from '~~/server/trpc/routers'

type Input = inferProcedureInput<
  AppRouter['stat']['getHelpRequestPrescribingOrganizationStats']
>

type Output = inferProcedureOutput<
  AppRouter['stat']['getHelpRequestPrescribingOrganizationStats']
>

const parseStats = (stats: Output) =>
  stats.reduce<Record<string, number>>(
    (acc, { prescribingOrganization, _count }) => ({
      ...acc,
      [prescribingOrganization]: _count
    }),
    {}
  )

describe('Statistics - File Instructions - Prescribing Organization', () => {
  test('should compute stats as a structure manager with no filters', async ({
    trpc
  }) => {
    const input: Input = {}

    const stats =
      await trpc.structureManager.stat.getHelpRequestPrescribingOrganizationStats(
        input
      )

    expect(parseStats(stats)).toEqual({
      'Mairie de Valence': 4,
      'CAF 26': 2,
      'Non renseigné': 6
    })
  })

  test('should compute stats including only beneficiaries followed as a referent', async ({
    trpc
  }) => {
    const input: Input = {}

    const stats =
      await trpc.referent.stat.getHelpRequestPrescribingOrganizationStats(input)

    expect(parseStats(stats)).toEqual({ 'Non renseigné': 4 })
  })

  test('should only include housing help requests when filtering on that subject', async ({
    trpc
  }) => {
    const input: Input = { helpRequestSubject: FileInstructionType.Housing }

    const stats =
      await trpc.structureManager.stat.getHelpRequestPrescribingOrganizationStats(
        input
      )

    expect(parseStats(stats)).toEqual({
      'CAF 26': 1,
      'Mairie de Valence': 2,
      'Non renseigné': 3
    })
  })
})
