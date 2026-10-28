import { describe, expect } from 'vitest'
import { FileInstructionType } from '@prisma/client'
import { test } from '~~/test/server/test-utils'

describe('Statistics - Help Request Count Stats - Help Request Subject Filter', () => {
  test('A structure manager should count all help requests without a subject filter', async ({
    trpc
  }) => {
    const { helpRequests, helpRequestBeneficiaries } =
      await trpc.structureManager.stat.getHelpRequestCountStats({})

    expect(helpRequests).toBe(12)
    expect(helpRequestBeneficiaries).toBe(4)
  })

  test('A structure manager should count only housing help requests', async ({
    trpc
  }) => {
    const { helpRequests, helpRequestBeneficiaries } =
      await trpc.structureManager.stat.getHelpRequestCountStats({
        helpRequestSubject: FileInstructionType.Housing
      })

    expect(helpRequests).toBe(6)
    expect(helpRequestBeneficiaries).toBe(4)
  })

  test('A structure manager should count only financial help requests', async ({
    trpc
  }) => {
    const { helpRequests, helpRequestBeneficiaries } =
      await trpc.structureManager.stat.getHelpRequestCountStats({
        helpRequestSubject: FileInstructionType.Financial
      })

    expect(helpRequests).toBe(4)
    expect(helpRequestBeneficiaries).toBe(2)
  })

  test('A structure manager should count only other help requests', async ({
    trpc
  }) => {
    const { helpRequests, helpRequestBeneficiaries } =
      await trpc.structureManager.stat.getHelpRequestCountStats({
        helpRequestSubject: FileInstructionType.Other
      })

    expect(helpRequests).toBe(2)
    expect(helpRequestBeneficiaries).toBe(2)
  })
})

describe('Statistics - Help Request Count Stats - Referent Scope', () => {
  test('A referent should count only help requests of the beneficiaries they follow', async ({
    trpc
  }) => {
    const { helpRequests } = await trpc.referent.stat.getHelpRequestCountStats(
      {}
    )

    expect(helpRequests).toBe(4)
  })
})
