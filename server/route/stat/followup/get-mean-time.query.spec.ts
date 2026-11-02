import { describe, expect } from 'vitest'
import type { inferProcedureInput, inferProcedureOutput } from '@trpc/server'
import { test } from '~~/test/server/test-utils'
import { StatPeriodFilter } from '~~/types/stat'
import { getSocialSupportSubjectTotalDuration } from '~/utils/followups/getSocialSupportSubjetcTotalDuration'

import type { AppRouter } from '~~/server/trpc/routers'

type Input = inferProcedureInput<AppRouter['stat']['getFollowupMeanTimeStats']>

type Output = inferProcedureOutput<
  AppRouter['stat']['getFollowupMeanTimeStats']
>

// No `orderBy`: the per-subject means are compared as a map.
// Computed like the card (`StatsFollowupMeanTime.vue`): mean duration per
// subject, then the unweighted mean of the per-subject means.
const parseMeanTimes = (subjects: Output) =>
  subjects.reduce<Record<string, number>>(
    (acc, { name, socialSupports }) => ({
      ...acc,
      [name]: getSocialSupportSubjectTotalDuration(socialSupports)
    }),
    {}
  )

const getOverallMeanTime = (subjects: Output) => {
  const means = Object.values(parseMeanTimes(subjects))
  if (means.length === 0) {
    return 0
  }
  return means.reduce((total, mean) => total + mean, 0) / means.length
}

describe('Statistics - Followups - Mean Time - Durations', () => {
  test('A structure manager should get the mean time per subject with no filters', async ({
    trpc
  }) => {
    const input: Input = {}

    const stats =
      await trpc.structureManager.stat.getFollowupMeanTimeStats(input)

    expect(parseMeanTimes(stats)).toEqual({
      'Aide sociale': 52.5,
      'Aides financières non remboursables': 45,
      'Aides financières remboursables': 45,
      'Domiciliation': 22.5,
      'Inclusion numérique': 45
    })
    expect(getOverallMeanTime(stats)).toBe(42)
  })

  // Pins today's referent output as is: the subject-rooted query is not
  // narrowed to the referent's beneficiaries, so the referent gets the same
  // means as the structure manager (open scope finding, not fixed here)
  test('A referent should get the mean time per subject with no filters', async ({
    trpc
  }) => {
    const input: Input = {}

    const stats = await trpc.referent.stat.getFollowupMeanTimeStats(input)

    expect(parseMeanTimes(stats)).toEqual({
      'Aide sociale': 52.5,
      'Aides financières non remboursables': 45,
      'Aides financières remboursables': 45,
      'Domiciliation': 22.5,
      'Inclusion numérique': 45
    })
    expect(getOverallMeanTime(stats)).toBe(42)
  })

  // From 2022-10-22, "Inclusion numérique" has no matching followup: the
  // subject is kept with a zero mean, which pulls the overall mean down.
  // "Domiciliation" keeps only one of its two followups: its mean changes.
  test('A structure manager should keep subjects with no followup in the period at zero', async ({
    trpc
  }) => {
    const input: Input = {
      period: StatPeriodFilter.Custom,
      fromDate: new Date('2022-10-22')
    }

    const stats =
      await trpc.structureManager.stat.getFollowupMeanTimeStats(input)

    expect(parseMeanTimes(stats)).toEqual({
      'Aide sociale': 52.5,
      'Aides financières non remboursables': 45,
      'Aides financières remboursables': 45,
      'Domiciliation': 15,
      'Inclusion numérique': 0
    })
    expect(getOverallMeanTime(stats)).toBe(31.5)
  })
})

describe('Statistics - Followups - Mean Time - Authorizations', () => {
  test('An administrator cannot get the mean time', async ({ trpc }) => {
    await expect(
      trpc.administrator.stat.getFollowupMeanTimeStats({})
    ).rejects.toThrow(/user routes are not available to admins/i)
  })
})
