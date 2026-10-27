import { describe, expect } from 'vitest'
import type { inferProcedureInput, inferProcedureOutput } from '@trpc/server'
import { FileInstructionType } from '@prisma/client'
import { test } from '~~/test/server/test-utils'

import type { AppRouter } from '~~/server/trpc/routers'

type Input = inferProcedureInput<
  AppRouter['stat']['getHelpRequestInstructionsStats']
>

type Output = inferProcedureOutput<
  AppRouter['stat']['getHelpRequestInstructionsStats']
>

// instructor organizations come from an unordered findMany: compare as a map
const parseStats = ({ fileInstructions }: Output) => ({
  total: fileInstructions._count,
  externalStructure: fileInstructions.externalStructure._count,
  internalStructure: fileInstructions.internalStructure._count,
  instructorOrganizations: fileInstructions.instructorOrganization.reduce<
    Record<string, number>
  >((acc, { name, _count }) => ({ ...acc, [name]: _count }), {})
})

describe('Statistics - Help Requests - Instructions Without Filter', () => {
  test('A structure manager should count file instructions by instructing structure', async ({
    trpc
  }) => {
    const input: Input = {}

    const stats =
      await trpc.structureManager.stat.getHelpRequestInstructionsStats(input)

    expect(parseStats(stats)).toEqual({
      externalStructure: 6,
      instructorOrganizations: {
        'CAF 26': 4,
        'Non renseigné': 2
      },
      internalStructure: 6,
      total: 12
    })
  })
})

describe('Statistics - Help Requests - Instructions Help Request Subject Filter', () => {
  test('A structure manager should count only housing file instructions by instructing structure', async ({
    trpc
  }) => {
    const input: Input = { helpRequestSubject: FileInstructionType.Housing }

    const stats =
      await trpc.structureManager.stat.getHelpRequestInstructionsStats(input)

    expect(parseStats(stats)).toEqual({
      externalStructure: 3,
      instructorOrganizations: {
        'CAF 26': 2,
        'Non renseigné': 1
      },
      internalStructure: 3,
      total: 6
    })
  })
})
