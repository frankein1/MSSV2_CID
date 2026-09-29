import {
  FollowupMedium,
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
      where: { name: { startsWith: 'UDT-' } }
    }),
    prismaClient.ministerEntity.deleteMany({
      where: { lastName: { startsWith: 'UDT-' } }
    })
  ])
})

// Compulsory fields for update
const baseUpdateInput = (
  familyFileId: string,
  beneficiaryId: string,
  followupId: string,
  socialSupportId: string
) => ({
  id: followupId,
  socialSupportId,
  isMinistry: false as const,
  familyFileId,
  beneficiaryId,
  subjects: [subjectId],
  medium: FollowupMedium.PlannedInPerson,
  date: new Date('2026-03-01'),
  status: SocialSupportStatus.Done
})

async function createTestFollowup(
  familyFileId: string,
  beneficiaryId: string,
  createdById: string,
  overrides: {
    withRedirections?: boolean
    withMinister?: boolean
    medium?: FollowupMedium
    place?: string
    thirdPersonName?: string
    structureId?: string
  } = {}
) {
  const structureId =
    overrides.structureId ?? fixtureStructures[FixtureStructure.Test].id

  const redirections = overrides.withRedirections
    ? {
        create: [
          {
            type: SocialSupportRedirectionType.Intern,
            redirectionReason: {
              create: {
                name: 'UDT-Raison interne',
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
      followup: {
        select: {
          id: true
        }
      }
    },
    data: {
      createdBy: { connect: { id: createdById } },
      lastUpdatedBy: { connect: { id: createdById } },
      date: new Date('2026-03-01'),
      status: SocialSupportStatus.InProgress,
      socialSupportType: SocialSupportType.Followup,
      structure: { connect: { id: structureId } },
      familyFile: { connect: { id: familyFileId } },
      beneficiary: { connect: { id: beneficiaryId } },
      subjects: { connect: [{ id: subjectId }] },
      minister: overrides.withMinister
        ? {
            create: {
              firstName: 'Camille',
              lastName: 'UDT-MINISTRE',
              function: 'Ministre des Solidarités',
              government: 'Gouvernement de test',
              status: MinisterStatus.Current
            }
          }
        : undefined,
      followup: {
        create: {
          medium: overrides.medium ?? FollowupMedium.PlannedInPerson,
          place: overrides.place,
          thirdPersonName: overrides.thirdPersonName
        }
      },
      socialSupportRedirections: redirections
    }
  })
  return {
    id: result.followup!.id,
    socialSupportId: result.id
  }
}

describe('Followup - Update - Authorizations', () => {
  test('A manager can edit any followup', async ({ trpc }) => {
    const followup = track(
      await createTestFollowup(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    const result = await trpc.structureManager.followup.update(
      baseUpdateInput(
        coursorId,
        coursorId,
        followup.id,
        followup.socialSupportId
      )
    )

    expect(result).toStrictEqual({ id: followup.socialSupportId })
  })

  test('A referent can edit a followup they created', async ({ trpc }) => {
    const followup = track(
      await createTestFollowup(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    const result = await trpc.referent.followup.update(
      baseUpdateInput(
        coursorId,
        coursorId,
        followup.id,
        followup.socialSupportId
      )
    )

    expect(result).toStrictEqual({ id: followup.socialSupportId })
  })

  test('A social worker can edit a followup when they are member of the family file referents', async ({
    trpc
  }) => {
    const socialWorkerId = fixturesUsers[FixtureUserRole.SocialWorker].id
    const followup = track(
      await createTestFollowup(apfelmannId, apfelmannId, socialWorkerId)
    )

    const result = await trpc.socialWorker.followup.update(
      baseUpdateInput(
        apfelmannId,
        apfelmannId,
        followup.id,
        followup.socialSupportId
      )
    )

    expect(result).toStrictEqual({ id: followup.socialSupportId })
  })

  test('A social worker cannot edit a followup when they are neither creator nor member', async ({
    trpc
  }) => {
    const followup = track(
      await createTestFollowup(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    await expect(() =>
      trpc.socialWorker.followup.update(
        baseUpdateInput(
          coursorId,
          coursorId,
          followup.id,
          followup.socialSupportId
        )
      )
    ).rejects.toThrow(/not allowed to access route/i)
  })

  test('A reception agent cannot edit a followup they did not create', async ({
    trpc
  }) => {
    const followup = track(
      await createTestFollowup(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    await expect(() =>
      trpc.receptionAgent.followup.update(
        baseUpdateInput(
          coursorId,
          coursorId,
          followup.id,
          followup.socialSupportId
        )
      )
    ).rejects.toThrow(/not allowed to access route/i)
  })

  test('An instructor cannot edit a followup they did not create', async ({
    trpc
  }) => {
    const followup = track(
      await createTestFollowup(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    await expect(() =>
      trpc.instructor.followup.update(
        baseUpdateInput(
          coursorId,
          coursorId,
          followup.id,
          followup.socialSupportId
        )
      )
    ).rejects.toThrow(/not allowed to access route/i)
  })

  test('An administrator cannot edit a followup', async ({ trpc }) => {
    const followup = track(
      await createTestFollowup(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    await expect(() =>
      trpc.administrator.followup.update(
        baseUpdateInput(
          coursorId,
          coursorId,
          followup.id,
          followup.socialSupportId
        )
      )
    ).rejects.toThrow(/user routes are not available to admins/i)
  })

  test('A manager from another structure cannot edit a followup', async ({
    trpc
  }) => {
    const followup = track(
      await createTestFollowup(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    await expect(() =>
      trpc.structureManagerMinistere.followup.update(
        baseUpdateInput(
          coursorId,
          coursorId,
          followup.id,
          followup.socialSupportId
        )
      )
    ).rejects.toThrow(/followup[\s\S]*?no record/im)
  })

  test('A social worker can edit a followup they created', async ({ trpc }) => {
    const socialWorkerId = fixturesUsers[FixtureUserRole.SocialWorker].id
    const followup = track(
      await createTestFollowup(apfelmannId, apfelmannId, socialWorkerId)
    )

    const result = await trpc.socialWorker.followup.update(
      baseUpdateInput(
        apfelmannId,
        apfelmannId,
        followup.id,
        followup.socialSupportId
      )
    )

    expect(result).toStrictEqual({ id: followup.socialSupportId })
  })

  test('A reception agent can edit a followup they created', async ({
    trpc
  }) => {
    const followup = track(
      await createTestFollowup(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.ReceptionAgent].id
      )
    )

    const result = await trpc.receptionAgent.followup.update(
      baseUpdateInput(
        coursorId,
        coursorId,
        followup.id,
        followup.socialSupportId
      )
    )

    expect(result).toStrictEqual({ id: followup.socialSupportId })
  })

  test('An instructor can edit a followup they created', async ({ trpc }) => {
    const followup = track(
      await createTestFollowup(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.InstructorActive].id
      )
    )

    const result = await trpc.instructor.followup.update(
      baseUpdateInput(
        coursorId,
        coursorId,
        followup.id,
        followup.socialSupportId
      )
    )

    expect(result).toStrictEqual({ id: followup.socialSupportId })
  })

  test('A non-creator cannot set the private synthesis on a followup', async ({
    trpc
  }) => {
    const followup = track(
      await createTestFollowup(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    await expect(() =>
      trpc.structureManager.followup.update({
        ...baseUpdateInput(
          coursorId,
          coursorId,
          followup.id,
          followup.socialSupportId
        ),
        privateSynthesis: 'Private synthesis'
      })
    ).rejects.toThrow(/not allowed to access route/i)
  })

  test('A non-creator can submit privateSynthesis as null without being rejected', async ({
    trpc
  }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const followup = track(
      await createTestFollowup(coursorId, coursorId, referentId)
    )

    await prismaClient.socialSupport.update({
      where: { id: followup.socialSupportId },
      data: { privateSynthesis: 'Secret note' }
    })

    const result = await trpc.structureManager.followup.update({
      ...baseUpdateInput(
        coursorId,
        coursorId,
        followup.id,
        followup.socialSupportId
      ),
      privateSynthesis: null
    })

    expect(result).toStrictEqual({ id: followup.socialSupportId })

    const record = await prismaClient.socialSupport.findUniqueOrThrow({
      where: { id: followup.socialSupportId },
      select: { privateSynthesis: true }
    })
    expect(record.privateSynthesis).toBe('Secret note')
  })

  test('A non-creator cannot clear the private synthesis with an empty string', async ({
    trpc
  }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const followup = track(
      await createTestFollowup(coursorId, coursorId, referentId)
    )

    await expect(() =>
      trpc.structureManager.followup.update({
        ...baseUpdateInput(
          coursorId,
          coursorId,
          followup.id,
          followup.socialSupportId
        ),
        privateSynthesis: ''
      })
    ).rejects.toThrow(/not allowed to access route/i)
  })

  test('The creator can set the private synthesis on a followup', async ({
    trpc
  }) => {
    const followup = track(
      await createTestFollowup(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id
      )
    )

    const result = await trpc.referent.followup.update({
      ...baseUpdateInput(
        coursorId,
        coursorId,
        followup.id,
        followup.socialSupportId
      ),
      privateSynthesis: 'Private synthesis'
    })

    expect(result).toStrictEqual({ id: followup.socialSupportId })
  })
})

describe('Followup - Update - Notifications', () => {
  test('The original creator is notified when another user updates their followup', async ({
    trpc
  }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const followup = track(
      await createTestFollowup(coursorId, coursorId, referentId)
    )

    await trpc.structureManager.followup.update(
      baseUpdateInput(
        coursorId,
        coursorId,
        followup.id,
        followup.socialSupportId
      )
    )

    const notifications = await prismaClient.notification.findMany({
      where: { socialSupportId: followup.socialSupportId },
      select: { recipientId: true, type: true, itemCreatedById: true }
    })

    expect(notifications).toStrictEqual([
      {
        recipientId: referentId,
        type: NotificationType.UpdateFollowupElement,
        itemCreatedById: fixturesUsers[FixtureUserRole.StructureManager].id
      }
    ])
  })

  test('No notification is created when the creator updates their own followup', async ({
    trpc
  }) => {
    const followup = track(
      await createTestFollowup(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.StructureManager].id
      )
    )

    await trpc.structureManager.followup.update(
      baseUpdateInput(
        coursorId,
        coursorId,
        followup.id,
        followup.socialSupportId
      )
    )

    const notifications = await prismaClient.notification.findMany({
      where: { socialSupportId: followup.socialSupportId }
    })

    expect(notifications).toStrictEqual([])
  })
})

describe('Followup - Update - Redirections', () => {
  test('Adding redirections to a followup that had none', async ({ trpc }) => {
    const followup = track(
      await createTestFollowup(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.StructureManager].id
      )
    )

    await trpc.structureManager.followup.update({
      ...baseUpdateInput(
        coursorId,
        coursorId,
        followup.id,
        followup.socialSupportId
      ),
      socialSupportRedirections: [
        {
          type: SocialSupportRedirectionType.Intern,
          redirectionReasonName: 'UDT-Suivi budgétaire'
        }
      ]
    })

    const redirections = await prismaClient.socialSupportRedirection.findMany({
      where: { socialSupportId: followup.socialSupportId },
      select: {
        type: true,
        redirectionReason: { select: { name: true } }
      }
    })

    expect(redirections).toStrictEqual([
      {
        type: SocialSupportRedirectionType.Intern,
        redirectionReason: { name: 'UDT-Suivi budgétaire' }
      }
    ])
  })

  test('Modifying existing redirections on a followup', async ({ trpc }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const followup = track(
      await createTestFollowup(coursorId, coursorId, referentId, {
        withRedirections: true
      })
    )

    await trpc.structureManager.followup.update({
      ...baseUpdateInput(
        coursorId,
        coursorId,
        followup.id,
        followup.socialSupportId
      ),
      socialSupportRedirections: [
        {
          type: SocialSupportRedirectionType.Other,
          externalStructureName: 'Association locale',
          redirectionReasonName: 'UDT-Accès aux droits'
        }
      ]
    })

    const redirectionsAfter =
      await prismaClient.socialSupportRedirection.findMany({
        where: { socialSupportId: followup.socialSupportId },
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
        redirectionReason: { name: 'UDT-Accès aux droits' }
      }
    ])
  })

  test('Removing all redirections from a followup', async ({ trpc }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const followup = track(
      await createTestFollowup(coursorId, coursorId, referentId, {
        withRedirections: true
      })
    )

    await trpc.structureManager.followup.update({
      ...baseUpdateInput(
        coursorId,
        coursorId,
        followup.id,
        followup.socialSupportId
      ),
      socialSupportRedirections: []
    })

    const redirections = await prismaClient.socialSupportRedirection.count({
      where: { socialSupportId: followup.socialSupportId }
    })

    expect(redirections).toBe(0)
  })
})

describe('Followup - Update - Conditional field mutations', () => {
  const readFollowup = (socialSupportId: string) =>
    prismaClient.followup.findUniqueOrThrow({
      where: { socialSupportId },
      select: { medium: true, place: true, thirdPersonName: true }
    })

  const readSocialSupport = (id: string) =>
    prismaClient.socialSupport.findUniqueOrThrow({
      where: { id },
      select: { ministerId: true }
    })

  test('The place is cleared when updating from external appointment to another medium', async ({
    trpc
  }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const followup = track(
      await createTestFollowup(coursorId, coursorId, referentId, {
        medium: FollowupMedium.ExternalAppointment,
        place: 'Mairie de Dijon'
      })
    )

    await trpc.referent.followup.update({
      ...baseUpdateInput(
        coursorId,
        coursorId,
        followup.id,
        followup.socialSupportId
      ),
      medium: FollowupMedium.PhoneCall
    })

    expect(await readFollowup(followup.socialSupportId)).toMatchObject({
      place: null
    })
  })

  test('The third person name is cleared when updating from third party to another medium', async ({
    trpc
  }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const followup = track(
      await createTestFollowup(coursorId, coursorId, referentId, {
        medium: FollowupMedium.ThirdParty,
        thirdPersonName: 'Madame Dupont'
      })
    )

    await trpc.referent.followup.update({
      ...baseUpdateInput(
        coursorId,
        coursorId,
        followup.id,
        followup.socialSupportId
      ),
      medium: FollowupMedium.Sms
    })

    expect(await readFollowup(followup.socialSupportId)).toMatchObject({
      thirdPersonName: null
    })
  })

  test('The minister can be changed on a followup', async ({ trpc }) => {
    const ministereStructureId =
      fixtureStructures[FixtureStructure.Ministère].id
    const ministereUserId =
      fixturesUsers[FixtureUserRole.StructureManagerMinistere].id

    const followup = track(
      await createTestFollowup(martinId, martinId, ministereUserId, {
        withMinister: true,
        structureId: ministereStructureId
      })
    )

    const previousMinister = await readSocialSupport(followup.socialSupportId)
    expect(previousMinister.ministerId).not.toBeNull()

    const newMinister = await prismaClient.ministerEntity.create({
      data: {
        firstName: 'Jean',
        lastName: 'UDT-MINISTRE-2',
        function: 'Ministre',
        government: 'Gouvernement',
        status: MinisterStatus.Current
      },
      select: { id: true }
    })

    await trpc.structureManagerMinistere.followup.update({
      ...baseUpdateInput(
        martinId,
        martinId,
        followup.id,
        followup.socialSupportId
      ),
      isMinistry: true,
      ministerId: newMinister.id
    })

    const socialSupport = await readSocialSupport(followup.socialSupportId)
    expect(socialSupport.ministerId).toBe(newMinister.id)
  })
})

describe('Followup - Update - Clear relations', () => {
  test('Clearing the prescribing organization from a followup', async ({
    trpc
  }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const followup = track(
      await createTestFollowup(coursorId, coursorId, referentId)
    )

    await trpc.structureManager.followup.update({
      ...baseUpdateInput(
        coursorId,
        coursorId,
        followup.id,
        followup.socialSupportId
      ),
      prescribingOrganizationId: null,
      prescribingOrganizationContactId: null
    })

    const followupRecord = await prismaClient.followup.findUniqueOrThrow({
      where: { id: followup.id },
      select: {
        prescribingOrganizationId: true,
        prescribingOrganizationContactId: true
      }
    })

    expect(followupRecord.prescribingOrganizationId).toBeNull()
    expect(followupRecord.prescribingOrganizationContactId).toBeNull()
  })

  test('Cannot clear the minister when isMinistry is true', async ({
    trpc
  }) => {
    const referentId = fixturesUsers[FixtureUserRole.Referent].id
    const followup = track(
      await createTestFollowup(coursorId, coursorId, referentId, {
        withMinister: true
      })
    )

    await expect(() =>
      trpc.structureManager.followup.update({
        ...baseUpdateInput(
          coursorId,
          coursorId,
          followup.id,
          followup.socialSupportId
        ),
        isMinistry: true,
        ministerId: null as unknown as string
      })
    ).rejects.toThrow(/veuillez renseigner ce champ/i)
  })
})

describe('Followup - Update - Subtype denormalization', () => {
  test('A manager changing the medium keeps the social support subtype in sync', async ({
    trpc
  }) => {
    const followup = track(
      await createTestFollowup(
        coursorId,
        coursorId,
        fixturesUsers[FixtureUserRole.Referent].id,
        { medium: FollowupMedium.PlannedInPerson }
      )
    )

    await trpc.structureManager.followup.update({
      ...baseUpdateInput(
        coursorId,
        coursorId,
        followup.id,
        followup.socialSupportId
      ),
      medium: FollowupMedium.UnplannedInPerson
    })

    const socialSupport = await prismaClient.socialSupport.findUniqueOrThrow({
      where: { id: followup.socialSupportId },
      select: { subtype: true }
    })

    expect(socialSupport.subtype).toBe(FollowupMedium.UnplannedInPerson)
  })
})
