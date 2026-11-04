import {
  FileInstructionType,
  MinisterStatus,
  NotificationType,
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
  fixturesUsers
} from '~~/prisma/fixtures'

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
      where: { name: { startsWith: 'HHRUM-' } }
    }),
    prismaClient.ministerEntity.deleteMany({
      where: { lastName: { startsWith: 'HHRUM-' } }
    }),
    prismaClient.partnerOrganization.deleteMany({
      where: { name: { startsWith: 'HHRUM-' } }
    })
  ])
})

const baseUpdateInput = (
  familyFileId: string,
  beneficiaryId: string,
  housingHelpRequestId: string
) => ({
  id: housingHelpRequestId,
  isMinistry: false as const,
  familyFileId,
  beneficiaryId,
  date: new Date('2026-03-01'),
  status: SocialSupportStatus.Done,
  externalStructure: 'false' as const
})

async function createTestHousingHelpRequest(
  familyFileId: string,
  beneficiaryId: string,
  createdById: string,
  overrides: {
    withRedirections?: boolean
    withMinister?: boolean
    externalStructure?: boolean
    status?: SocialSupportStatus
    structureId?: string
  } = {}
) {
  const structureId =
    overrides.structureId ?? fixtureStructures[FixtureStructure.Test].id
  const isExternal = overrides.externalStructure ?? false

  const redirections = overrides.withRedirections
    ? {
        create: [
          {
            type: SocialSupportRedirectionType.Intern,
            redirectionReason: {
              create: {
                name: 'HHRUM-Raison interne',
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
          housingHelpRequest: {
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
      socialSupportType: SocialSupportType.HelpRequestHousing,
      structure: { connect: { id: structureId } },
      familyFile: { connect: { id: familyFileId } },
      beneficiary: { connect: { id: beneficiaryId } },
      minister: overrides.withMinister
        ? {
            create: {
              firstName: 'Camille',
              lastName: 'HHRUM-MINISTRE',
              function: 'Ministre des Solidarités',
              government: 'Gouvernement de test',
              status: MinisterStatus.Current
            }
          }
        : undefined,
      fileInstruction: {
        create: {
          type: FileInstructionType.Housing,
          externalStructure: isExternal,
          housingHelpRequest: {
            create: {}
          }
        }
      },
      socialSupportRedirections: redirections
    }
  })

  return {
    id: result.fileInstruction!.housingHelpRequest!.id,
    socialSupportId: result.id
  }
}

describe('Housing Help Request - Update - Authorizations', () => {
  test('A manager can edit any housing help request', async ({ trpc }) => {
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    const result = await trpc.structureManager.housingHelpRequest.update(
      baseUpdateInput(coursorId, coursorId, housingHelpRequest.id)
    )

    expect(result).toStrictEqual({ id: housingHelpRequest.socialSupportId })
  })

  test('A referent can edit a housing help request they created', async ({
    trpc
  }) => {
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    const result = await trpc.referent.housingHelpRequest.update(
      baseUpdateInput(coursorId, coursorId, housingHelpRequest.id)
    )

    expect(result).toStrictEqual({ id: housingHelpRequest.socialSupportId })
  })

  test('A social worker can edit a housing help request when they are member of the family file referents', async ({
    trpc
  }) => {
    const socialWorkerId = fixturesUsers[FixtureUserRole.SocialWorker].id
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        apfelmannId,
        apfelmannId,
        socialWorkerId
      )
    )

    const result = await trpc.socialWorker.housingHelpRequest.update(
      baseUpdateInput(apfelmannId, apfelmannId, housingHelpRequest.id)
    )

    expect(result).toStrictEqual({ id: housingHelpRequest.socialSupportId })
  })

  test('A social worker cannot edit a housing help request when they are neither creator nor member', async ({
    trpc
  }) => {
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    await expect(() =>
      trpc.socialWorker.housingHelpRequest.update(
        baseUpdateInput(coursorId, coursorId, housingHelpRequest.id)
      )
    ).rejects.toThrow(/not allowed to access route/i)
  })

  test('A reception agent cannot edit a housing help request', async ({
    trpc
  }) => {
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    await expect(() =>
      trpc.receptionAgent.housingHelpRequest.update(
        baseUpdateInput(coursorId, coursorId, housingHelpRequest.id)
      )
    ).rejects.toThrow(/not allowed to access route/i)
  })

  test('An instructor cannot edit a housing help request they did not create', async ({
    trpc
  }) => {
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    await expect(() =>
      trpc.instructor.housingHelpRequest.update(
        baseUpdateInput(coursorId, coursorId, housingHelpRequest.id)
      )
    ).rejects.toThrow(/not allowed to access route/i)
  })

  test('An administrator cannot edit a housing help request', async ({
    trpc
  }) => {
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    await expect(() =>
      trpc.administrator.housingHelpRequest.update(
        baseUpdateInput(coursorId, coursorId, housingHelpRequest.id)
      )
    ).rejects.toThrow(/user routes are not available to admins/i)
  })

  test('A manager from another structure cannot edit a housing help request', async ({
    trpc
  }) => {
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    await expect(() =>
      trpc.structureManagerMinistere.housingHelpRequest.update(
        baseUpdateInput(coursorId, coursorId, housingHelpRequest.id)
      )
    ).rejects.toThrow(/housingHelpRequest[\s\S]*?no record/im)
  })

  test('A social worker can edit a housing help request they created', async ({
    trpc
  }) => {
    const socialWorkerId = fixturesUsers[FixtureUserRole.SocialWorker].id
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        apfelmannId,
        apfelmannId,
        socialWorkerId
      )
    )

    const result = await trpc.socialWorker.housingHelpRequest.update(
      baseUpdateInput(apfelmannId, apfelmannId, housingHelpRequest.id)
    )

    expect(result).toStrictEqual({ id: housingHelpRequest.socialSupportId })
  })

  test('An instructor can edit a housing help request they created', async ({
    trpc
  }) => {
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.InstructorActive].id
      )
    )

    const result = await trpc.instructor.housingHelpRequest.update(
      baseUpdateInput(coursorId, coursorId, housingHelpRequest.id)
    )

    expect(result).toStrictEqual({ id: housingHelpRequest.socialSupportId })
  })

  test('A non-creator cannot set the private synthesis on a housing help request', async ({
    trpc
  }) => {
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    await expect(() =>
      trpc.structureManager.housingHelpRequest.update({
        ...baseUpdateInput(coursorId, coursorId, housingHelpRequest.id),
        privateSynthesis: 'Private synthesis'
      })
    ).rejects.toThrow(/not allowed to access route/i)
  })

  test('A non-creator can submit privateSynthesis as null without being rejected', async ({
    trpc
  }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(coursorId, coursorId, referentId)
    )

    await prismaClient.socialSupport.update({
      where: { id: housingHelpRequest.socialSupportId },
      data: { privateSynthesis: 'Secret note' }
    })

    const result = await trpc.structureManager.housingHelpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, housingHelpRequest.id),
      privateSynthesis: null
    })

    expect(result).toStrictEqual({ id: housingHelpRequest.socialSupportId })

    const record = await prismaClient.socialSupport.findUniqueOrThrow({
      where: { id: housingHelpRequest.socialSupportId },
      select: { privateSynthesis: true }
    })
    expect(record.privateSynthesis).toBe('Secret note')
  })

  test('A non-creator cannot clear the private synthesis with an empty string', async ({
    trpc
  }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(coursorId, coursorId, referentId)
    )

    await expect(() =>
      trpc.structureManager.housingHelpRequest.update({
        ...baseUpdateInput(coursorId, coursorId, housingHelpRequest.id),
        privateSynthesis: ''
      })
    ).rejects.toThrow(/not allowed to access route/i)
  })

  test('The creator can set the private synthesis on a housing help request', async ({
    trpc
  }) => {
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    const result = await trpc.referent.housingHelpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, housingHelpRequest.id),
      privateSynthesis: 'Private synthesis'
    })

    expect(result).toStrictEqual({ id: housingHelpRequest.socialSupportId })
  })
})

describe('Housing Help Request - Update - Notifications', () => {
  test('The original creator is notified when another user updates their housing help request', async ({
    trpc
  }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(coursorId, coursorId, referentId)
    )

    await trpc.structureManager.housingHelpRequest.update(
      baseUpdateInput(coursorId, coursorId, housingHelpRequest.id)
    )

    const notifications = await prismaClient.notification.findMany({
      where: { socialSupportId: housingHelpRequest.socialSupportId },
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

  test('No notification is created when the creator updates their own housing help request', async ({
    trpc
  }) => {
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.StructureManager].id
      )
    )

    await trpc.structureManager.housingHelpRequest.update(
      baseUpdateInput(coursorId, coursorId, housingHelpRequest.id)
    )

    const notifications = await prismaClient.notification.findMany({
      where: { socialSupportId: housingHelpRequest.socialSupportId }
    })

    expect(notifications).toStrictEqual([])
  })
})

describe('Housing Help Request - Update - Redirections', () => {
  test('Adding redirections to a housing help request that had none', async ({
    trpc
  }) => {
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.StructureManager].id
      )
    )

    await trpc.structureManager.housingHelpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, housingHelpRequest.id),
      socialSupportRedirections: [
        {
          type: SocialSupportRedirectionType.Intern,
          redirectionReasonName: 'HHRUM-Suivi budgétaire'
        }
      ]
    })

    const redirections = await prismaClient.socialSupportRedirection.findMany({
      where: { socialSupportId: housingHelpRequest.socialSupportId },
      select: {
        type: true,
        redirectionReason: { select: { name: true } }
      }
    })

    expect(redirections).toStrictEqual([
      {
        type: SocialSupportRedirectionType.Intern,
        redirectionReason: { name: 'HHRUM-Suivi budgétaire' }
      }
    ])
  })

  test('Modifying existing redirections on a housing help request', async ({
    trpc
  }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(coursorId, coursorId, referentId, {
        withRedirections: true
      })
    )

    await trpc.structureManager.housingHelpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, housingHelpRequest.id),
      socialSupportRedirections: [
        {
          type: SocialSupportRedirectionType.Other,
          externalStructureName: 'Association locale',
          redirectionReasonName: 'HHRUM-Accès aux droits'
        }
      ]
    })

    const redirectionsAfter =
      await prismaClient.socialSupportRedirection.findMany({
        where: { socialSupportId: housingHelpRequest.socialSupportId },
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
        redirectionReason: { name: 'HHRUM-Accès aux droits' }
      }
    ])
  })

  test('Removing all redirections from a housing help request', async ({
    trpc
  }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(coursorId, coursorId, referentId, {
        withRedirections: true
      })
    )

    await trpc.structureManager.housingHelpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, housingHelpRequest.id),
      socialSupportRedirections: []
    })

    const redirections = await prismaClient.socialSupportRedirection.count({
      where: { socialSupportId: housingHelpRequest.socialSupportId }
    })

    expect(redirections).toBe(0)
  })
})

describe('Housing Help Request - Update - Status-dependent field mutations', () => {
  const readHousingHelpRequest = (id: string) =>
    prismaClient.housingHelpRequest.findUniqueOrThrow({
      where: { id },
      select: {
        fileInstruction: {
          select: {
            type: true,
            externalStructure: true,
            examinationDate: true,
            dispatchDate: true,
            decisionDate: true,
            refusalReason: true,
            instructorOrganizationId: true,
            instructorOrganizationContactId: true
          }
        }
      }
    })

  test('Internal structure fields are kept and external fields are dropped for an internal accepted housing help request', async ({
    trpc
  }) => {
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.StructureManager].id,
        { externalStructure: false }
      )
    )

    await trpc.structureManager.housingHelpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, housingHelpRequest.id),
      status: SocialSupportStatus.Accepted,
      externalStructure: 'false',
      examinationDate: new Date('2026-02-15'),
      dispatchDate: new Date('2026-02-20'),
      decisionDate: new Date('2026-03-10')
    })

    const record = await readHousingHelpRequest(housingHelpRequest.id)

    expect(record.fileInstruction).toMatchObject({
      externalStructure: false,
      examinationDate: expect.any(Date),
      dispatchDate: null,
      decisionDate: expect.any(Date),
      instructorOrganizationId: null
    })
  })

  test('External structure fields are kept and internal fields are dropped for an external accepted housing help request', async ({
    trpc
  }) => {
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.StructureManager].id,
        { externalStructure: true }
      )
    )

    await trpc.structureManager.housingHelpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, housingHelpRequest.id),
      status: SocialSupportStatus.Accepted,
      externalStructure: 'true',
      examinationDate: new Date('2026-02-15'),
      dispatchDate: new Date('2026-02-20'),
      decisionDate: new Date('2026-03-10')
    })

    const record = await readHousingHelpRequest(housingHelpRequest.id)

    expect(record.fileInstruction).toMatchObject({
      externalStructure: true,
      examinationDate: null,
      dispatchDate: expect.any(Date),
      decisionDate: expect.any(Date)
    })
  })

  test('The refusal reason is kept only when the status is Refused', async ({
    trpc
  }) => {
    const managerId = fixturesUsers[FixtureUserRole.StructureManager].id
    const refused = track(
      await createTestHousingHelpRequest(coursorId, coursorId, managerId)
    )
    const accepted = track(
      await createTestHousingHelpRequest(coursorId, coursorId, managerId)
    )

    await trpc.structureManager.housingHelpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, refused.id),
      status: SocialSupportStatus.Refused,
      refusalReason: 'IncompleteFile',
      decisionDate: new Date('2026-03-10')
    })

    await trpc.structureManager.housingHelpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, accepted.id),
      status: SocialSupportStatus.Accepted,
      refusalReason: 'IncompleteFile',
      decisionDate: new Date('2026-03-10')
    })

    expect(
      (await readHousingHelpRequest(refused.id)).fileInstruction
    ).toMatchObject({
      refusalReason: 'IncompleteFile',
      decisionDate: expect.any(Date)
    })
    expect(
      (await readHousingHelpRequest(accepted.id)).fileInstruction
    ).toMatchObject({
      refusalReason: null,
      decisionDate: expect.any(Date)
    })
  })

  test('Examination date is cleared when switching to external structure', async ({
    trpc
  }) => {
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.StructureManager].id,
        { externalStructure: false }
      )
    )

    await trpc.structureManager.housingHelpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, housingHelpRequest.id),
      status: SocialSupportStatus.Accepted,
      externalStructure: 'true',
      examinationDate: new Date('2026-02-15'),
      dispatchDate: new Date('2026-02-20'),
      decisionDate: new Date('2026-03-10')
    })

    const record = await readHousingHelpRequest(housingHelpRequest.id)

    expect(record.fileInstruction).toMatchObject({
      externalStructure: true,
      examinationDate: null,
      dispatchDate: expect.any(Date)
    })
  })

  test('Dispatch date is cleared when switching to internal structure', async ({
    trpc
  }) => {
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.StructureManager].id,
        { externalStructure: true }
      )
    )

    await trpc.structureManager.housingHelpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, housingHelpRequest.id),
      status: SocialSupportStatus.Accepted,
      externalStructure: 'false',
      examinationDate: new Date('2026-02-15'),
      dispatchDate: new Date('2026-02-20'),
      decisionDate: new Date('2026-03-10')
    })

    const record = await readHousingHelpRequest(housingHelpRequest.id)

    expect(record.fileInstruction).toMatchObject({
      externalStructure: false,
      examinationDate: expect.any(Date),
      dispatchDate: null
    })
  })

  test('Instructor organization and contact are both nulled for an internal structure even when sent', async ({
    trpc
  }) => {
    const partnerOrganization = await prismaClient.partnerOrganization.create({
      data: {
        structureId: fixtureStructures[FixtureStructure.Test].id,
        name: 'HHRUM-Organisation Instructrice'
      },
      select: { id: true }
    })

    const contact = await prismaClient.partnerOrganizationContact.create({
      data: {
        name: 'HHRUM-Contact Instructeur',
        partnerId: partnerOrganization.id
      },
      select: { id: true }
    })

    const housingHelpRequest = track(
      await createTestHousingHelpRequest(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.StructureManager].id,
        { externalStructure: true }
      )
    )

    await trpc.structureManager.housingHelpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, housingHelpRequest.id),
      externalStructure: 'false',
      instructorOrganizationId: partnerOrganization.id,
      instructorOrganizationContactId: contact.id
    })

    const record = await readHousingHelpRequest(housingHelpRequest.id)

    expect(record.fileInstruction).toMatchObject({
      externalStructure: false,
      instructorOrganizationId: null,
      instructorOrganizationContactId: null
    })
  })
})

describe('Housing Help Request - Update - Ministry', () => {
  test('The minister can be changed on a housing help request', async ({
    trpc
  }) => {
    const ministereStructureId =
      fixtureStructures[FixtureStructure.Ministère].id
    const ministereUserId =
      fixturesUsers[FixtureUserRole.StructureManagerMinistere].id

    const housingHelpRequest = track(
      await createTestHousingHelpRequest(martinId, martinId, ministereUserId, {
        withMinister: true,
        structureId: ministereStructureId
      })
    )

    const previousMinister = await prismaClient.socialSupport.findUniqueOrThrow(
      {
        where: { id: housingHelpRequest.socialSupportId },
        select: { ministerId: true }
      }
    )
    expect(previousMinister.ministerId).not.toBeNull()

    const newMinister = await prismaClient.ministerEntity.create({
      data: {
        firstName: 'Jean',
        lastName: 'HHRUM-MINISTRE-2',
        function: 'Ministre',
        government: 'Gouvernement',
        status: MinisterStatus.Current
      },
      select: { id: true }
    })

    await trpc.structureManagerMinistere.housingHelpRequest.update({
      ...baseUpdateInput(martinId, martinId, housingHelpRequest.id),
      isMinistry: true,
      ministerId: newMinister.id
    })

    const socialSupport = await prismaClient.socialSupport.findUniqueOrThrow({
      where: { id: housingHelpRequest.socialSupportId },
      select: { ministerId: true }
    })
    expect(socialSupport.ministerId).toBe(newMinister.id)
  })

  test('Cannot clear the minister when isMinistry is true', async ({
    trpc
  }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const housingHelpRequest = track(
      await createTestHousingHelpRequest(coursorId, coursorId, referentId, {
        withMinister: true
      })
    )

    await expect(() =>
      trpc.structureManager.housingHelpRequest.update({
        ...baseUpdateInput(coursorId, coursorId, housingHelpRequest.id),
        isMinistry: true,
        ministerId: null as unknown as string
      })
    ).rejects.toThrow(/veuillez renseigner ce champ/i)
  })
})

describe('Housing Help Request - Update - SocialSupport derivation', () => {
  test('Updating a housing help request only modifies its own parent social support', async ({
    trpc
  }) => {
    const managerId = fixturesUsers[FixtureUserRole.StructureManager].id

    const housingA = track(
      await createTestHousingHelpRequest(coursorId, coursorId, managerId)
    )
    const housingB = track(
      await createTestHousingHelpRequest(coursorId, coursorId, managerId)
    )

    const synthesisBefore = 'Original synthesis B'
    await prismaClient.socialSupport.update({
      where: { id: housingB.socialSupportId },
      data: { synthesis: synthesisBefore }
    })

    await trpc.structureManager.housingHelpRequest.update({
      ...baseUpdateInput(coursorId, coursorId, housingA.id),
      synthesis: 'Updated synthesis A'
    })

    const ssA = await prismaClient.socialSupport.findUniqueOrThrow({
      where: { id: housingA.socialSupportId },
      select: { synthesis: true }
    })
    expect(ssA.synthesis).toBe('Updated synthesis A')

    const ssB = await prismaClient.socialSupport.findUniqueOrThrow({
      where: { id: housingB.socialSupportId },
      select: { synthesis: true }
    })
    expect(ssB.synthesis).toBe(synthesisBefore)
  })
})
