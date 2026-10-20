import {
  FileInstructionType,
  MinisterStatus,
  NotificationType,
  PaymentMethod,
  SocialSupportRedirectionType,
  SocialSupportStatus,
  SocialSupportType
} from '@prisma/client'
import { afterEach, describe, expect } from 'vitest'
import { prismaClient } from '~~/server/prisma'
import { test } from '~~/test/server/test-utils'
import {
  FixtureBeneficiary,
  FixtureStructure,
  FixtureUserRole,
  fixturesBeneficiaries,
  fixtureStructures,
  fixturesSocialSupportSubjects,
  fixturesUsers
} from '~~/prisma/fixtures'

const subjectId = fixturesSocialSupportSubjects[0].id

// COURSOR: referents = StructureManager + Referent
const coursorId = fixturesBeneficiaries[FixtureBeneficiary.COURSOR].id
// APFELMANN: referents = SocialWorker only
const apfelmannId = fixturesBeneficiaries[FixtureBeneficiary.APFELMANN].id
// MARTIN: Ministère structure, referent = StructureManagerMinistere
const martinId = fixturesBeneficiaries[FixtureBeneficiary.MARTIN].id

const createdSocialSupportIds: string[] = []

const track = <T extends { socialSupportId: string }>(result: T) => {
  createdSocialSupportIds.push(result.socialSupportId)
  return result
}

afterEach(async () => {
  if (createdSocialSupportIds.length) {
    await prismaClient.socialSupport.deleteMany({
      where: { id: { in: createdSocialSupportIds } }
    })
    createdSocialSupportIds.length = 0
  }
  await Promise.all([
    prismaClient.redirectionReason.deleteMany({
      where: { name: { startsWith: 'HRUM-' } }
    }),
    prismaClient.ministerEntity.deleteMany({
      where: { lastName: { startsWith: 'HRUM-' } }
    })
  ])
})

const baseUpdateInput = (
  familyFileId: string,
  beneficiaryId: string,
  helpRequestId: string
) => ({
  id: helpRequestId,
  isMinistry: false as const,
  familyFileId,
  beneficiaryId,
  subjectId,
  date: new Date('2026-03-01'),
  status: SocialSupportStatus.Done,
  externalStructure: 'false' as const
})

async function createTestHelpRequest(
  familyFileId: string,
  beneficiaryId: string,
  createdById: string,
  overrides: {
    withRedirections?: boolean
    withMinister?: boolean
    financialSupport?: boolean
    externalStructure?: boolean
    status?: SocialSupportStatus
    structureId?: string
  } = {}
) {
  const structureId =
    overrides.structureId ?? fixtureStructures[FixtureStructure.Test].id
  const isFinancial = overrides.financialSupport ?? false
  const isExternal = overrides.externalStructure ?? false

  const redirections = overrides.withRedirections
    ? {
        create: [
          {
            type: SocialSupportRedirectionType.Intern,
            redirectionReason: {
              create: {
                name: 'HRUM-Raison interne',
                structureId,
                createdById
              }
            }
          }
        ]
      }
    : undefined

  const result = await prismaClient.socialSupport.create({
    select: {
      id: true,
      fileInstruction: {
        select: {
          helpRequest: {
            select: { id: true }
          }
        }
      }
    },
    data: {
      createdBy: { connect: { id: createdById } },
      lastUpdatedBy: { connect: { id: createdById } },
      date: new Date('2026-03-01'),
      status: overrides.status ?? SocialSupportStatus.InProgress,
      socialSupportType: SocialSupportType.HelpRequest,
      structure: { connect: { id: structureId } },
      familyFile: { connect: { id: familyFileId } },
      beneficiary: { connect: { id: beneficiaryId } },
      subjects: { connect: [{ id: subjectId }] },
      minister: overrides.withMinister
        ? {
            create: {
              firstName: 'Camille',
              lastName: 'HRUM-MINISTRE',
              function: 'Ministre des Solidarités',
              government: 'Gouvernement de test',
              status: MinisterStatus.Current
            }
          }
        : undefined,
      fileInstruction: {
        create: {
          type: isFinancial
            ? FileInstructionType.Financial
            : FileInstructionType.Other,
          externalStructure: isExternal,
          helpRequest: {
            create: {
              financialSupport: isFinancial,
              subject: { connect: { id: subjectId } }
            }
          }
        }
      },
      socialSupportRedirections: redirections
    }
  })

  return {
    id: result.fileInstruction!.helpRequest!.id,
    socialSupportId: result.id
  }
}

describe('Help Request - Update - Authorizations', () => {
  test('A manager can edit any help request', async ({ trpc }) => {
    const helpRequest = track(
      await createTestHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    const result = await trpc.structureManager.helpRequest.update(
      baseUpdateInput(coursorId, coursorId, helpRequest.id)
    )

    expect(result).toStrictEqual({ id: helpRequest.socialSupportId })
  })

  test('A referent can edit a help request they created', async ({ trpc }) => {
    const helpRequest = track(
      await createTestHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    const result = await trpc.referent.helpRequest.update(
      baseUpdateInput(coursorId, coursorId, helpRequest.id)
    )

    expect(result).toStrictEqual({ id: helpRequest.socialSupportId })
  })

  test('A social worker can edit a help request when they are member of the family file referents', async ({
    trpc
  }) => {
    const socialWorkerId = fixturesUsers[FixtureUserRole.SocialWorker].id
    const helpRequest = track(
      await createTestHelpRequest(apfelmannId, apfelmannId, socialWorkerId)
    )

    const result = await trpc.socialWorker.helpRequest.update(
      baseUpdateInput(apfelmannId, apfelmannId, helpRequest.id)
    )

    expect(result).toStrictEqual({ id: helpRequest.socialSupportId })
  })

  test('A social worker cannot edit a help request when they are neither creator nor member', async ({
    trpc
  }) => {
    const helpRequest = track(
      await createTestHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    await expect(() =>
      trpc.socialWorker.helpRequest.update(
        baseUpdateInput(coursorId, coursorId, helpRequest.id)
      )
    ).rejects.toThrow(/not allowed to access route/i)
  })

  test('A reception agent cannot edit a help request', async ({ trpc }) => {
    const helpRequest = track(
      await createTestHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    await expect(() =>
      trpc.receptionAgent.helpRequest.update(
        baseUpdateInput(coursorId, coursorId, helpRequest.id)
      )
    ).rejects.toThrow(/not allowed to access route/i)
  })

  test('An instructor cannot edit a help request they did not create', async ({
    trpc
  }) => {
    const helpRequest = track(
      await createTestHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    await expect(() =>
      trpc.instructor.helpRequest.update(
        baseUpdateInput(coursorId, coursorId, helpRequest.id)
      )
    ).rejects.toThrow(/not allowed to access route/i)
  })

  test('An administrator cannot edit a help request', async ({ trpc }) => {
    const helpRequest = track(
      await createTestHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    await expect(() =>
      trpc.administrator.helpRequest.update(
        baseUpdateInput(coursorId, coursorId, helpRequest.id)
      )
    ).rejects.toThrow(/user routes are not available to admins/i)
  })

  test('A manager from another structure cannot edit a help request', async ({
    trpc
  }) => {
    const helpRequest = track(
      await createTestHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    await expect(() =>
      trpc.structureManagerMinistere.helpRequest.update(
        baseUpdateInput(coursorId, coursorId, helpRequest.id)
      )
    ).rejects.toThrow(/helpRequest[\s\S]*?no record/im)
  })

  test('A social worker can edit a help request they created', async ({
    trpc
  }) => {
    const socialWorkerId = fixturesUsers[FixtureUserRole.SocialWorker].id
    const helpRequest = track(
      await createTestHelpRequest(apfelmannId, apfelmannId, socialWorkerId)
    )

    const result = await trpc.socialWorker.helpRequest.update(
      baseUpdateInput(apfelmannId, apfelmannId, helpRequest.id)
    )

    expect(result).toStrictEqual({ id: helpRequest.socialSupportId })
  })

  test('An instructor can edit a help request they created', async ({
    trpc
  }) => {
    const helpRequest = track(
      await createTestHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.InstructorActive].id
      )
    )

    const result = await trpc.instructor.helpRequest.update(
      baseUpdateInput(coursorId, coursorId, helpRequest.id)
    )

    expect(result).toStrictEqual({ id: helpRequest.socialSupportId })
  })

  test('A non-creator cannot set the private synthesis on a help request', async ({
    trpc
  }) => {
    const helpRequest = track(
      await createTestHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    await expect(() =>
      trpc.structureManager.helpRequest.update({
        ...baseUpdateInput(coursorId, coursorId, helpRequest.id),
        privateSynthesis: 'Private synthesis'
      })
    ).rejects.toThrow(/not allowed to access route/i)
  })

  test('A non-creator can submit privateSynthesis as null without being rejected', async ({
    trpc
  }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const helpRequest = track(
      await createTestHelpRequest(coursorId, coursorId, referentId)
    )

    await prismaClient.socialSupport.update({
      where: { id: helpRequest.socialSupportId },
      data: { privateSynthesis: 'Secret note' }
    })

    const result = await trpc.structureManager.helpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, helpRequest.id),
      privateSynthesis: null
    })

    expect(result).toStrictEqual({ id: helpRequest.socialSupportId })

    const record = await prismaClient.socialSupport.findUniqueOrThrow({
      where: { id: helpRequest.socialSupportId },
      select: { privateSynthesis: true }
    })
    expect(record.privateSynthesis).toBe('Secret note')
  })

  test('A non-creator cannot clear the private synthesis with an empty string', async ({
    trpc
  }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const helpRequest = track(
      await createTestHelpRequest(coursorId, coursorId, referentId)
    )

    await expect(() =>
      trpc.structureManager.helpRequest.update({
        ...baseUpdateInput(coursorId, coursorId, helpRequest.id),
        privateSynthesis: ''
      })
    ).rejects.toThrow(/not allowed to access route/i)
  })

  test('The creator can set the private synthesis on a help request', async ({
    trpc
  }) => {
    const helpRequest = track(
      await createTestHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    const result = await trpc.referent.helpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, helpRequest.id),
      privateSynthesis: 'Private synthesis'
    })

    expect(result).toStrictEqual({ id: helpRequest.socialSupportId })
  })
})

describe('Help Request - Update - Notifications', () => {
  test('The original creator is notified when another user updates their help request', async ({
    trpc
  }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const helpRequest = track(
      await createTestHelpRequest(coursorId, coursorId, referentId)
    )

    await trpc.structureManager.helpRequest.update(
      baseUpdateInput(coursorId, coursorId, helpRequest.id)
    )

    const notifications = await prismaClient.notification.findMany({
      where: { socialSupportId: helpRequest.socialSupportId },
      select: { recipientId: true, type: true, itemCreatedById: true }
    })

    expect(notifications).toStrictEqual([
      {
        recipientId: referentId,
        type: NotificationType.UpdateFileInstructionElement,
        itemCreatedById: fixturesUsers[FixtureUserRole.StructureManager].id
      }
    ])
  })

  test('No notification is created when the creator updates their own help request', async ({
    trpc
  }) => {
    const helpRequest = track(
      await createTestHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.StructureManager].id
      )
    )

    await trpc.structureManager.helpRequest.update(
      baseUpdateInput(coursorId, coursorId, helpRequest.id)
    )

    const notifications = await prismaClient.notification.findMany({
      where: { socialSupportId: helpRequest.socialSupportId }
    })

    expect(notifications).toStrictEqual([])
  })
})

describe('Help Request - Update - Redirections', () => {
  test('Adding redirections to a help request that had none', async ({
    trpc
  }) => {
    const helpRequest = track(
      await createTestHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.StructureManager].id
      )
    )

    await trpc.structureManager.helpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, helpRequest.id),
      socialSupportRedirections: [
        {
          type: SocialSupportRedirectionType.Intern,
          redirectionReasonName: 'HRUM-Suivi budgétaire'
        }
      ]
    })

    const redirections = await prismaClient.socialSupportRedirection.findMany({
      where: { socialSupportId: helpRequest.socialSupportId },
      select: {
        type: true,
        redirectionReason: { select: { name: true } }
      }
    })

    expect(redirections).toStrictEqual([
      {
        type: SocialSupportRedirectionType.Intern,
        redirectionReason: { name: 'HRUM-Suivi budgétaire' }
      }
    ])
  })

  test('Modifying existing redirections on a help request', async ({
    trpc
  }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const helpRequest = track(
      await createTestHelpRequest(coursorId, coursorId, referentId, {
        withRedirections: true
      })
    )

    await trpc.structureManager.helpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, helpRequest.id),
      socialSupportRedirections: [
        {
          type: SocialSupportRedirectionType.Other,
          externalStructureName: 'Association locale',
          redirectionReasonName: 'HRUM-Accès aux droits'
        }
      ]
    })

    const redirectionsAfter =
      await prismaClient.socialSupportRedirection.findMany({
        where: { socialSupportId: helpRequest.socialSupportId },
        select: {
          type: true,
          externalStructureName: true,
          redirectionReason: { select: { name: true } }
        }
      })

    expect(redirectionsAfter).toStrictEqual([
      {
        type: SocialSupportRedirectionType.Other,
        externalStructureName: 'Association locale',
        redirectionReason: { name: 'HRUM-Accès aux droits' }
      }
    ])
  })

  test('Removing all redirections from a help request', async ({ trpc }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const helpRequest = track(
      await createTestHelpRequest(coursorId, coursorId, referentId, {
        withRedirections: true
      })
    )

    await trpc.structureManager.helpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, helpRequest.id),
      socialSupportRedirections: []
    })

    const redirections = await prismaClient.socialSupportRedirection.count({
      where: { socialSupportId: helpRequest.socialSupportId }
    })

    expect(redirections).toBe(0)
  })
})

describe('Help Request - Update - Status-dependent field mutations', () => {
  const readHelpRequest = (id: string) =>
    prismaClient.helpRequest.findUniqueOrThrow({
      where: { id },
      select: {
        financialSupport: true,
        isRefundable: true,
        askedAmount: true,
        allocatedAmount: true,
        paymentMethod: true,
        paymentDate: true,
        fileInstruction: {
          select: {
            type: true,
            externalStructure: true,
            examinationDate: true,
            dispatchDate: true,
            decisionDate: true,
            refusalReason: true
          }
        }
      }
    })

  test('Financial fields and payment fields are preserved for a financial accepted internal help request', async ({
    trpc
  }) => {
    const helpRequest = track(
      await createTestHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.StructureManager].id,
        { financialSupport: true }
      )
    )

    await trpc.structureManager.helpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, helpRequest.id),
      status: SocialSupportStatus.Accepted,
      externalStructure: 'false',
      askedAmount: 500,
      allocatedAmount: 300,
      paymentMethod: PaymentMethod.WireTransfer,
      paymentDate: new Date('2026-04-01'),
      examinationDate: new Date('2026-02-15'),
      decisionDate: new Date('2026-03-10'),
      isRefundable: 'true'
    })

    const record = await readHelpRequest(helpRequest.id)

    expect(record).toMatchObject({
      financialSupport: true,
      isRefundable: true,
      askedAmount: expect.any(Object),
      allocatedAmount: expect.any(Object),
      paymentMethod: PaymentMethod.WireTransfer,
      paymentDate: expect.any(Date),
      fileInstruction: {
        externalStructure: false,
        examinationDate: expect.any(Date),
        dispatchDate: null,
        decisionDate: expect.any(Date),
        refusalReason: null
      }
    })
  })

  test('Payment fields are dropped and dispatch is kept for a financial accepted external help request', async ({
    trpc
  }) => {
    const helpRequest = track(
      await createTestHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.StructureManager].id,
        { financialSupport: true, externalStructure: true }
      )
    )

    await trpc.structureManager.helpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, helpRequest.id),
      status: SocialSupportStatus.Accepted,
      externalStructure: 'true',
      askedAmount: 500,
      allocatedAmount: 300,
      paymentMethod: PaymentMethod.WireTransfer,
      paymentDate: new Date('2026-04-01'),
      dispatchDate: new Date('2026-02-20'),
      decisionDate: new Date('2026-03-10')
    })

    const record = await readHelpRequest(helpRequest.id)

    expect(record).toMatchObject({
      financialSupport: true,
      askedAmount: expect.any(Object),
      allocatedAmount: expect.any(Object),
      paymentMethod: null,
      paymentDate: null,
      fileInstruction: {
        externalStructure: true,
        examinationDate: null,
        dispatchDate: expect.any(Date),
        decisionDate: expect.any(Date)
      }
    })
  })

  test('All financial fields are nulled for a non-financial help request', async ({
    trpc
  }) => {
    const helpRequest = track(
      await createTestHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.StructureManager].id,
        { financialSupport: false }
      )
    )

    await trpc.structureManager.helpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, helpRequest.id),
      status: SocialSupportStatus.Done,
      askedAmount: 500,
      allocatedAmount: 300,
      paymentMethod: PaymentMethod.WireTransfer,
      paymentDate: new Date('2026-04-01'),
      isRefundable: 'true'
    })

    const record = await readHelpRequest(helpRequest.id)

    expect(record).toMatchObject({
      financialSupport: false,
      isRefundable: null,
      askedAmount: null,
      allocatedAmount: null,
      paymentMethod: null,
      paymentDate: null
    })
  })

  test('The refusal reason is kept only when the status is Refused', async ({
    trpc
  }) => {
    const managerId = fixturesUsers[FixtureUserRole.StructureManager].id
    const refused = track(
      await createTestHelpRequest(coursorId, coursorId, managerId)
    )
    const accepted = track(
      await createTestHelpRequest(coursorId, coursorId, managerId)
    )

    await trpc.structureManager.helpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, refused.id),
      status: SocialSupportStatus.Refused,
      refusalReason: 'IncompleteFile',
      decisionDate: new Date('2026-03-10')
    })

    await trpc.structureManager.helpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, accepted.id),
      status: SocialSupportStatus.Accepted,
      refusalReason: 'IncompleteFile',
      decisionDate: new Date('2026-03-10')
    })

    expect((await readHelpRequest(refused.id)).fileInstruction).toMatchObject({
      refusalReason: 'IncompleteFile',
      decisionDate: expect.any(Date)
    })
    expect((await readHelpRequest(accepted.id)).fileInstruction).toMatchObject({
      refusalReason: null,
      decisionDate: expect.any(Date)
    })
  })

  test('Examination date is cleared when switching to external structure', async ({
    trpc
  }) => {
    const helpRequest = track(
      await createTestHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.StructureManager].id,
        { externalStructure: false }
      )
    )

    await trpc.structureManager.helpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, helpRequest.id),
      status: SocialSupportStatus.Accepted,
      externalStructure: 'true',
      examinationDate: new Date('2026-02-15'),
      dispatchDate: new Date('2026-02-20'),
      decisionDate: new Date('2026-03-10')
    })

    const record = await readHelpRequest(helpRequest.id)

    expect(record.fileInstruction).toMatchObject({
      externalStructure: true,
      examinationDate: null,
      dispatchDate: expect.any(Date)
    })
  })

  test('Dispatch date is cleared when switching to internal structure', async ({
    trpc
  }) => {
    const helpRequest = track(
      await createTestHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.StructureManager].id,
        { externalStructure: true }
      )
    )

    await trpc.structureManager.helpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, helpRequest.id),
      status: SocialSupportStatus.Accepted,
      externalStructure: 'false',
      examinationDate: new Date('2026-02-15'),
      dispatchDate: new Date('2026-02-20'),
      decisionDate: new Date('2026-03-10')
    })

    const record = await readHelpRequest(helpRequest.id)

    expect(record.fileInstruction).toMatchObject({
      externalStructure: false,
      examinationDate: expect.any(Date),
      dispatchDate: null
    })
  })
})

describe('Help Request - Update - Ministry', () => {
  test('The minister can be changed on a help request', async ({ trpc }) => {
    const ministereStructureId =
      fixtureStructures[FixtureStructure.Ministère].id
    const ministereUserId =
      fixturesUsers[FixtureUserRole.StructureManagerMinistere].id

    const helpRequest = track(
      await createTestHelpRequest(martinId, martinId, ministereUserId, {
        withMinister: true,
        structureId: ministereStructureId
      })
    )

    const previousMinister = await prismaClient.socialSupport.findUniqueOrThrow(
      {
        where: { id: helpRequest.socialSupportId },
        select: { ministerId: true }
      }
    )
    expect(previousMinister.ministerId).not.toBeNull()

    const newMinister = await prismaClient.ministerEntity.create({
      data: {
        firstName: 'Jean',
        lastName: 'HRUM-MINISTRE-2',
        function: 'Ministre',
        government: 'Gouvernement',
        status: MinisterStatus.Current
      },
      select: { id: true }
    })

    await trpc.structureManagerMinistere.helpRequest.update({
      ...baseUpdateInput(martinId, martinId, helpRequest.id),
      isMinistry: true,
      ministerId: newMinister.id
    })

    const socialSupport = await prismaClient.socialSupport.findUniqueOrThrow({
      where: { id: helpRequest.socialSupportId },
      select: { ministerId: true }
    })
    expect(socialSupport.ministerId).toBe(newMinister.id)
  })

  test('Cannot clear the minister when isMinistry is true', async ({
    trpc
  }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const helpRequest = track(
      await createTestHelpRequest(coursorId, coursorId, referentId, {
        withMinister: true
      })
    )

    await expect(() =>
      trpc.structureManager.helpRequest.update({
        ...baseUpdateInput(coursorId, coursorId, helpRequest.id),
        isMinistry: true,
        ministerId: null as unknown as string
      })
    ).rejects.toThrow(/veuillez renseigner ce champ/i)
  })
})

describe('Help Request - Update - SocialSupport derivation', () => {
  test('Updating a help request only modifies its own parent social support', async ({
    trpc
  }) => {
    const managerId = fixturesUsers[FixtureUserRole.StructureManager].id

    const helpRequestA = track(
      await createTestHelpRequest(coursorId, coursorId, managerId)
    )
    const helpRequestB = track(
      await createTestHelpRequest(coursorId, coursorId, managerId)
    )

    const synthesisBefore = 'Original synthesis B'
    await prismaClient.socialSupport.update({
      where: { id: helpRequestB.socialSupportId },
      data: { synthesis: synthesisBefore }
    })

    await trpc.structureManager.helpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, helpRequestA.id),
      synthesis: 'Updated synthesis A'
    })

    const ssA = await prismaClient.socialSupport.findUniqueOrThrow({
      where: { id: helpRequestA.socialSupportId },
      select: { synthesis: true }
    })
    expect(ssA.synthesis).toBe('Updated synthesis A')

    const ssB = await prismaClient.socialSupport.findUniqueOrThrow({
      where: { id: helpRequestB.socialSupportId },
      select: { synthesis: true }
    })
    expect(ssB.synthesis).toBe(synthesisBefore)
  })
})
