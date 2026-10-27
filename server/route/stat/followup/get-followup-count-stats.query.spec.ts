import { describe, expect } from 'vitest'
import type { inferProcedureInput } from '@trpc/server'
import { FileInstructionType } from '@prisma/client'
import { test } from '~~/test/server/test-utils'
import { AgeGroup } from '~~/client/options'
import type { AppRouter } from '~~/server/trpc/routers'

type Input = inferProcedureInput<AppRouter['stat']['getFollowupCountStats']>

// No seeded followup sets `firstFollowup` or `isDuringWalkInSession`:
// `firstFollowups` and `walkInSessionFollowups` are 0 in every case and only
// pin the shape of the output.

describe('Statistics - Followup Count - Role Scope', () => {
  test('A structure manager should count all followups of the structure', async ({
    trpc
  }) => {
    const input: Input = {}

    const stats = await trpc.structureManager.stat.getFollowupCountStats(input)

    expect(stats).toEqual({
      followups: 6,
      firstFollowups: 0,
      walkInSessionFollowups: 0,
      followupBeneficiaries: 4
    })
  })

  test('A referent should count only followups of the beneficiaries they follow', async ({
    trpc
  }) => {
    const input: Input = {}

    const stats = await trpc.referent.stat.getFollowupCountStats(input)

    expect(stats).toEqual({
      followups: 2,
      firstFollowups: 0,
      walkInSessionFollowups: 0,
      followupBeneficiaries: 1
    })
  })
})

describe('Statistics - Followup Count - Filters', () => {
  test('A structure manager should count only followups of active beneficiaries', async ({
    trpc
  }) => {
    const input: Input = { beneficiaryStatus: 'Active' }

    const stats = await trpc.structureManager.stat.getFollowupCountStats(input)

    expect(stats).toEqual({
      followups: 3,
      firstFollowups: 0,
      walkInSessionFollowups: 0,
      followupBeneficiaries: 2
    })
  })

  test('A structure manager should count only followups of beneficiaries in the age group', async ({
    trpc
  }) => {
    const input: Input = { ageGroup: AgeGroup.Group35_44 }

    const stats = await trpc.structureManager.stat.getFollowupCountStats(input)

    expect(stats).toEqual({
      followups: 2,
      firstFollowups: 0,
      walkInSessionFollowups: 0,
      followupBeneficiaries: 1
    })
  })

  test('A structure manager should count only followups of beneficiaries in the city', async ({
    trpc
  }) => {
    const input: Input = { cities: ['Dijon'] }

    const stats = await trpc.structureManager.stat.getFollowupCountStats(input)

    expect(stats).toEqual({
      followups: 2,
      firstFollowups: 0,
      walkInSessionFollowups: 0,
      followupBeneficiaries: 1
    })
  })

  // The followup path never reads `helpRequestSubject`: the counts must equal
  // the ones without filter.
  test('A structure manager should get the same followup counts with a help request subject filter', async ({
    trpc
  }) => {
    const input: Input = { helpRequestSubject: FileInstructionType.Housing }

    const stats = await trpc.structureManager.stat.getFollowupCountStats(input)

    expect(stats).toEqual({
      followups: 6,
      firstFollowups: 0,
      walkInSessionFollowups: 0,
      followupBeneficiaries: 4
    })
  })
})
