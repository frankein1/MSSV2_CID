import { BeneficiaryRepo, StructureRepo } from '~~/server/database'
import type { PlanAppointmentInput } from '~~/server/schema'
import type { ProtectedAppContext } from '~~/server/trpc'
import { invalidError } from '~~/server/trpc'
import { getAgentClient, throwIfStructureIsNotSetup } from './helper'
import { routes } from '~/utils/routes'
import { BeneficiaryTab } from '~/utils/constants/beneficiary'
import { formatAddress } from '~/utils'
import { formatDate } from '~/utils/formatDate'
import { TRPCError } from '@trpc/server'

/** This function needs the rdvsp integration setup and active
 * otherwise throws a forbidden error.
 *
 * Throws an unauthorized error if user is not authenticated to
 * RDVSP api.
 */
export async function planAppointment({
  input,
  ctx
}: {
  input: PlanAppointmentInput
  ctx: ProtectedAppContext
}) {
  const {
    public: { appUrl }
  } = useRuntimeConfig()

  const [structure, ben] = await Promise.all([
    StructureRepo.findUniqueOrThrow(ctx.user, {
      where: { id: ctx.structure.id },
      select: { externalRdvspId: true, externalRdvspActive: true }
    }),
    BeneficiaryRepo.findUniqueOrThrow(ctx.user, {
      where: { id: input.beneficiaryId },
      select: {
        externalRdvspId: true,
        familyFileId: true,
        id: true,
        // firstName: true,
        // usualName: true,
        // birthName: true,
        // birthDate: true,
        // email: true,
        // phone1: true,
        // street: true,
        zipcode: true,
        city: true,
        region: true
      }
    })
  ])

  throwIfStructureIsNotSetup(structure)

  const beneficiaryHistoryUrl = `${appUrl}${routes.file.AppFile.path(
    ben.familyFileId,
    {
      beneficiaryId: ben.id,
      tab: BeneficiaryTab.History,
      originPage: 'ExternalRdvsp'
    }
  )}`

  try {
    const rdvPlan = await createRdvspPlan(
      ctx.user.id,
      ben,
      beneficiaryHistoryUrl,
      beneficiaryHistoryUrl
    )
    if (!ben.externalRdvspId) {
      await BeneficiaryRepo.update(ctx.user, {
        where: { id: ben.id },
        data: { externalRdvspId: rdvPlan.user_id.toString() }
      })
    }

    return rdvPlan.url
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error
    }
    console.error('rdvsp: failed to create rdv plan', error)
    throw invalidError('could not create rdv plan')
  }
}

async function createRdvspPlan(
  userId: string,
  beneficiary: any,
  returnUrl: string,
  beneficiaryHistoryUrl: string
) {
  const address = formatAddress(beneficiary)

  const agentClient = getAgentClient({ user_id: userId })

  if (beneficiary.externalRdvspId) {
    try {
      const userUpdateBody = {
        id: beneficiary.externalRdvspId,
        first_name: beneficiary.firstName || 'Non renseigné',
        last_name:
          beneficiary.usualName || beneficiary.birthName || 'Non renseigné',
        ...(beneficiary.email && { email: beneficiary.email }),
        ...(beneficiary.phone1 && { phone_number: beneficiary.phone1 }),
        ...(address && { address }),
        ...(beneficiary.birthDate && {
          birth_date: formatDate(beneficiary.birthDate, 'YYYY-MM-DD')
        })
      }
      await agentClient(`/users/${beneficiary.externalRdvspId}`, {
        method: 'PATCH',
        body: JSON.stringify(userUpdateBody)
      })
    } catch (error) {
      console.error('rdvsp: user update error', error)
    }
  }
  const body = {
    user: {
      ...(beneficiary.externalRdvspId && { id: beneficiary.externalRdvspId }),
      first_name: beneficiary.firstName || 'Non renseigné',
      last_name:
        beneficiary.usualName || beneficiary.birthName || 'Non renseigné',
      ...(beneficiary.email && { email: beneficiary.email }),
      ...(beneficiary.phone1 && { phone_number: beneficiary.phone1 }),
      ...(address && { address }),
      ...(beneficiary.birthDate && {
        birth_date: formatDate(beneficiary.birthDate, 'YYYY-MM-DD')
      })
    },
    return_url: returnUrl,
    dossier_url: beneficiaryHistoryUrl
  }

  const { rdv_plan: rdvPlan } = await agentClient('/rdv_plans', {
    method: 'POST',
    body: JSON.stringify(body)
  })

  return {
    id: rdvPlan.id as number,
    url: rdvPlan.url as string,
    user_id: rdvPlan.user_id as number
  }
}
