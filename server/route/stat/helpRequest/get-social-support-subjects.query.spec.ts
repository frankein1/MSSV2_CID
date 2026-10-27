import { describe, expect } from 'vitest'
import type { inferProcedureInput, inferProcedureOutput } from '@trpc/server'
import { FileInstructionType } from '@prisma/client'
import { test } from '~~/test/server/test-utils'

import type { AppRouter } from '~~/server/trpc/routers'

type Input = inferProcedureInput<
  AppRouter['stat']['getHelpRequestSubjectStats']
>

type Output = inferProcedureOutput<
  AppRouter['stat']['getHelpRequestSubjectStats']
>

const parseStats = (stats: Output) =>
  stats.reduce<Record<string, number>>(
    (acc, { name, _count }) => ({
      ...acc,
      [name]: _count.socialSupports
    }),
    {}
  )

describe('Statistics - File Instructions - Social Support Subjects', () => {
  test('should compute stats as a structure manager with no filters', async ({
    trpc
  }) => {
    const input: Input = {}

    const stats =
      await trpc.structureManager.stat.getHelpRequestSubjectStats(input)

    expect(parseStats(stats)).toEqual({
      'Aide alimentaire': 0,
      'Aide au relogement': 0,
      "Aide médicale d'État": 0,
      'Aide sociale': 0,
      'Aide à la culture': 0,
      'Aides financières non remboursables': 2,
      'Aides financières remboursables': 4,
      'Autre': 0,
      'Demande de logement': 6,
      'Domiciliation': 0,
      'Inclusion numérique': 0,
      'PASS Adulte': 0,
      'Revenu de solidarité active': 0,
      "Secours d'urgence": 0
    })
  })

  test('should only include housing help requests when filtering on that subject', async ({
    trpc
  }) => {
    const input: Input = { helpRequestSubject: FileInstructionType.Housing }

    const stats =
      await trpc.structureManager.stat.getHelpRequestSubjectStats(input)

    expect(parseStats(stats)).toEqual({
      'Demande de logement': 6
    })
  })
})
