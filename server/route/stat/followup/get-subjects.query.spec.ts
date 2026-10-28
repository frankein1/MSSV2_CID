import { describe, expect } from 'vitest'
import type { inferProcedureInput, inferProcedureOutput } from '@trpc/server'
import { test } from '~~/test/server/test-utils'

import type { AppRouter } from '~~/server/trpc/routers'

type Input = inferProcedureInput<AppRouter['stat']['getFollowupSubjectStats']>

type Output = inferProcedureOutput<AppRouter['stat']['getFollowupSubjectStats']>

// Ties have no guaranteed order, so counts are compared as a map
const parseSubjects = (subjects: Output) =>
  subjects.reduce<Record<string, number>>(
    (acc, { name, _count }) => ({ ...acc, [name]: _count.socialSupports }),
    {}
  )

const isSortedByCountDesc = (subjects: Output) =>
  subjects
    .slice(1)
    .every(
      (subject, i) =>
        (subjects[i]?._count.socialSupports ?? 0) >=
        subject._count.socialSupports
    )

describe('Statistics - Followups - Subjects - Counts', () => {
  test('A structure manager should get the subject counts with no filters', async ({
    trpc
  }) => {
    const input: Input = {}

    const stats =
      await trpc.structureManager.stat.getFollowupSubjectStats(input)

    // Subjects with no followup are kept, with a zero count
    expect(stats.length).toBe(13)
    expect(parseSubjects(stats)).toEqual({
      'Aide alimentaire': 0,
      'Aide au relogement': 0,
      "Aide médicale d'État": 0,
      'Aide sociale': 2,
      'Aide à la culture': 0,
      'Aides financières non remboursables': 1,
      'Aides financières remboursables': 2,
      'Autre': 0,
      'Domiciliation': 2,
      'Inclusion numérique': 2,
      'PASS Adulte': 0,
      'Revenu de solidarité active': 0,
      "Secours d'urgence": 0
    })
    expect(isSortedByCountDesc(stats)).toBe(true)
  })

  test('A referent should get the subject counts of the beneficiaries they follow', async ({
    trpc
  }) => {
    const input: Input = {}

    const stats = await trpc.referent.stat.getFollowupSubjectStats(input)

    expect(stats.length).toBe(13)
    expect(parseSubjects(stats)).toEqual({
      'Aide alimentaire': 0,
      'Aide au relogement': 0,
      "Aide médicale d'État": 0,
      'Aide sociale': 1,
      'Aide à la culture': 0,
      'Aides financières non remboursables': 1,
      'Aides financières remboursables': 1,
      'Autre': 0,
      'Domiciliation': 1,
      'Inclusion numérique': 0,
      'PASS Adulte': 0,
      'Revenu de solidarité active': 0,
      "Secours d'urgence": 0
    })
    expect(isSortedByCountDesc(stats)).toBe(true)
  })
})

describe('Statistics - Followups - Subjects - Authorizations', () => {
  test('An administrator cannot get the subject counts', async ({ trpc }) => {
    await expect(
      trpc.administrator.stat.getFollowupSubjectStats({})
    ).rejects.toThrow(/user routes are not available to admins/i)
  })
})
