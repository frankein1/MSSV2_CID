import { describe, expect } from 'vitest'
import type { inferProcedureInput } from '@trpc/server'
import { FileInstructionType } from '@prisma/client'
import { test } from '~~/test/server/test-utils'

import type { AppRouter } from '~~/server/trpc/routers'

type Input = inferProcedureInput<
  AppRouter['stat']['getHelpRequestRedirectionsStats']
>

describe('Statistics - Help Requests - Redirections', () => {
  test('should compute stats as a structure manager with no filters', async ({
    trpc
  }) => {
    const input: Input = {}

    const stats =
      await trpc.structureManager.stat.getHelpRequestRedirectionsStats(input)

    expect(stats.helpRequestsWithRedirections._count).toBe(4)
    expect(stats.beneficiariesWithRedirections._count).toBe(3)
    expect(stats.withTypeIsPartners._count).toBe(2)
    expect(stats.withTypeIsPartners.partners).toHaveLength(2)
    expect(stats.withTypeIsIntern._count).toBe(1)
    expect(stats.withTypeIsOther._count).toBe(2)
  })

  test('should compute stats including only beneficiaries followed as a referent', async ({
    trpc
  }) => {
    const input: Input = {}

    const stats =
      await trpc.referent.stat.getHelpRequestRedirectionsStats(input)

    expect(stats.helpRequestsWithRedirections._count).toBe(1)
    expect(stats.beneficiariesWithRedirections._count).toBe(1)
    expect(stats.withTypeIsPartners._count).toBe(0)
    expect(stats.withTypeIsPartners.partners).toHaveLength(0)
    expect(stats.withTypeIsIntern._count).toBe(1)
    expect(stats.withTypeIsOther._count).toBe(1)
  })

  test('should only include housing help requests when filtering on that subject', async ({
    trpc
  }) => {
    const input: Input = { helpRequestSubject: FileInstructionType.Housing }

    const stats =
      await trpc.structureManager.stat.getHelpRequestRedirectionsStats(input)

    expect(stats.helpRequestsWithRedirections._count).toBe(1)
    expect(stats.beneficiariesWithRedirections._count).toBe(1)
    expect(stats.withTypeIsPartners._count).toBe(0)
    expect(stats.withTypeIsPartners.partners.length).toBe(0)
    expect(stats.withTypeIsIntern._count).toBe(0)
    expect(stats.withTypeIsOther._count).toBe(1)
  })
})
