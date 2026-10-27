import { describe, expect } from 'vitest'
import type { inferProcedureInput, inferProcedureOutput } from '@trpc/server'
import { FileInstructionType } from '@prisma/client'
import { test } from '~~/test/server/test-utils'

import type { AppRouter } from '~~/server/trpc/routers'

type Input = inferProcedureInput<AppRouter['stat']['getHelpRequestStatusStats']>

type Output = inferProcedureOutput<
  AppRouter['stat']['getHelpRequestStatusStats']
>

// groupBy ties have no stable order: compare as a map
const parseStats = (stats: Output) =>
  stats.reduce<Record<string, number>>(
    (acc, { status, _count }) => ({ ...acc, [status]: _count }),
    {}
  )

describe('Statistics - Help Requests - Status Without Filter', () => {
  test('A structure manager should count help requests per status', async ({
    trpc
  }) => {
    const input: Input = {}

    const stats =
      await trpc.structureManager.stat.getHelpRequestStatusStats(input)

    expect(parseStats(stats)).toEqual({
      Accepted: 8,
      InvestigationOngoing: 4
    })
  })
})

describe('Statistics - Help Requests - Status Help Request Subject Filter', () => {
  test('A structure manager should count only housing help requests per status', async ({
    trpc
  }) => {
    const input: Input = { helpRequestSubject: FileInstructionType.Housing }

    const stats =
      await trpc.structureManager.stat.getHelpRequestStatusStats(input)

    expect(parseStats(stats)).toEqual({
      Accepted: 4,
      InvestigationOngoing: 2
    })
  })
})
