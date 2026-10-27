import { describe, expect } from 'vitest'
import type { inferProcedureInput, inferProcedureOutput } from '@trpc/server'
import { FileInstructionType } from '@prisma/client'
import { test } from '~~/test/server/test-utils'

import type { AppRouter } from '~~/server/trpc/routers'

type Input = inferProcedureInput<
  AppRouter['stat']['getHelpRequestMinistreStats']
>

type Output = inferProcedureOutput<
  AppRouter['stat']['getHelpRequestMinistreStats']
>

// groupBy ties have no stable order: compare as a map. Rows without a
// minister come back as `{}` and are counted under a placeholder key.
// Seeded help requests have no minister, so these tests only pin the output
// shape: they would not catch a broken help request subject filter.
const parseStats = (stats: Output) =>
  stats.reduce<Record<string, number>>((acc, row) => {
    if (row.minister !== undefined) {
      return { ...acc, [row.minister]: row._count }
    }
    return { ...acc, '(none)': (acc['(none)'] ?? 0) + 1 }
  }, {})

describe('Statistics - Help Requests - Minister Without Filter', () => {
  test('A structure manager should count help requests per minister', async ({
    trpc
  }) => {
    const input: Input = {}

    const stats =
      await trpc.structureManager.stat.getHelpRequestMinistreStats(input)

    expect(parseStats(stats)).toEqual({
      '(none)': 1
    })
  })
})

describe('Statistics - Help Requests - Minister Help Request Subject Filter', () => {
  test('A structure manager should count only housing help requests per minister', async ({
    trpc
  }) => {
    const input: Input = { helpRequestSubject: FileInstructionType.Housing }

    const stats =
      await trpc.structureManager.stat.getHelpRequestMinistreStats(input)

    expect(parseStats(stats)).toEqual({
      '(none)': 1
    })
  })
})
