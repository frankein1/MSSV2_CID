import type { Prisma, SocialSupportRedirectionType } from '@prisma/client'
import { FileInstructionType, SocialSupportType } from '@prisma/client'
import dayjs from 'dayjs'
import { STATS_NULL_LABEL, STATS_NULL_KEY } from '~/utils/constants/stats'
import type {
  StatFilterInput,
  SupportProgramStatFilterInput,
  WorkshopStatFilterInput
} from '~~/server/schema'
import { ageGroupToDateRange } from '~/utils/ageGroupToDateRange'
import { StatPeriodFilter } from '~~/types/stat'
import { AgeGroup } from '~~/client/options'

export function preparePrescribingOrganizationStats(
  historyItems: {
    prescribingOrganization: { id: string; name: string } | null
  }[]
) {
  const prescribingOrganizationStats = historyItems.reduce(
    (
      prescribingOrganizations: {
        [k: string]: {
          prescribingOrganizationId: string
          prescribingOrganization: string
          _count: number
        }
      },
      historyItem
    ) => {
      const prescribingOrganizationId =
        historyItem.prescribingOrganization?.id || STATS_NULL_KEY
      if (prescribingOrganizations[prescribingOrganizationId] !== undefined) {
        prescribingOrganizations[prescribingOrganizationId]._count++
      } else {
        prescribingOrganizations[prescribingOrganizationId] = {
          prescribingOrganizationId,
          prescribingOrganization:
            historyItem.prescribingOrganization?.name || STATS_NULL_LABEL,
          _count: 1
        }
      }
      return prescribingOrganizations
    },
    {}
  )
  const prescribingOrganizationStatsValues = Object.values(
    prescribingOrganizationStats
  )
  prescribingOrganizationStatsValues.sort((a, b) => b._count - a._count)
  return prescribingOrganizationStatsValues
}

export function prepareWorkshopStatFilters(filters: WorkshopStatFilterInput) {
  const workshopFilters: Prisma.WorkshopWhereInput = {}

  if (filters.workshopNameIds) {
    workshopFilters.workshopNameId = { in: filters.workshopNameIds }
  }
  if (filters.partnerOrganizationIds) {
    workshopFilters.partnerOrganizationId = {
      in: filters.partnerOrganizationIds
    }
  }
  if (
    (filters.period && filters.period !== StatPeriodFilter.Custom) ||
    (filters.period === StatPeriodFilter.Custom &&
      (filters.fromDate || filters.toDate))
  ) {
    workshopFilters.date = prepareDateFilters(filters)
  }
  return workshopFilters
}

export function prepareSupportProgramStatFilters(
  filters: SupportProgramStatFilterInput
) {
  const supportProgramFilters: Prisma.SupportProgramWhereInput = {}

  if (filters.supportProgramNameIds?.length) {
    supportProgramFilters.supportProgramNameId = {
      in: filters.supportProgramNameIds
    }
  }

  // A support program matches the period when it was active during it:
  // started before the end of the period and not ended before its start.
  // A missing start or end date is treated as an open bound, but support
  // programs without any date are excluded.
  const dateFilters = prepareDateFilters(filters)
  if (dateFilters && (dateFilters.gte || dateFilters.lte)) {
    const { gte, lte } = dateFilters
    supportProgramFilters.AND = [
      { OR: [{ startDate: { not: null } }, { endDate: { not: null } }] },
      ...(lte ? [{ OR: [{ startDate: null }, { startDate: { lte } }] }] : []),
      ...(gte ? [{ OR: [{ endDate: null }, { endDate: { gte } }] }] : [])
    ]
  }

  return supportProgramFilters
}

export function prepareSocialSupportStatFilters(filters: StatFilterInput) {
  const socialSupport: Prisma.SocialSupportWhereInput = {}

  if (filters.ministerId?.length) {
    socialSupport.ministerId = {
      in: filters.ministerId
    }
  }

  if (filters.ministereStructure) {
    if (socialSupport.beneficiary) {
      socialSupport.beneficiary.ministereStructure = filters.ministereStructure
    } else {
      socialSupport.beneficiary = {
        ministereStructure: filters.ministereStructure
      }
    }
  }
  if (filters.ministereDepartementServiceAc) {
    if (socialSupport.beneficiary) {
      socialSupport.beneficiary.ministereDepartementServiceAc =
        filters.ministereDepartementServiceAc
    } else {
      socialSupport.beneficiary = {
        ministereDepartementServiceAc: filters.ministereDepartementServiceAc
      }
    }
  }

  if (filters.createdById) {
    socialSupport.createdById = { in: filters.createdById }
  }

  if (
    (filters.period && filters.period !== StatPeriodFilter.Custom) ||
    (filters.period === StatPeriodFilter.Custom &&
      (filters.fromDate || filters.toDate))
  ) {
    socialSupport.date = prepareDateFilters(filters)
  }

  if (filters.cities?.length) {
    if (socialSupport.beneficiary) {
      socialSupport.beneficiary.city = { in: filters.cities }
    } else {
      socialSupport.beneficiary = { city: { in: filters.cities } }
    }
  }

  if (filters.employers?.length) {
    if (socialSupport.beneficiary) {
      socialSupport.beneficiary.employer = { in: filters.employers }
    } else {
      socialSupport.beneficiary = { employer: { in: filters.employers } }
    }
  }

  if (filters.schoolUai?.length) {
    if (socialSupport.beneficiary) {
      socialSupport.beneficiary.schoolUai = { in: filters.schoolUai }
    } else {
      socialSupport.beneficiary = { schoolUai: { in: filters.schoolUai } }
    }
  }

  if (filters.referent) {
    socialSupport.createdBy = { id: filters.referent }
  }

  if (filters.beneficiaryStatus) {
    if (socialSupport.beneficiary) {
      socialSupport.beneficiary.status = filters.beneficiaryStatus
    } else {
      socialSupport.beneficiary = { status: filters.beneficiaryStatus }
    }
  }

  if (filters.qpv) {
    const qpv = filters.qpv === 'true'
    if (socialSupport.beneficiary) {
      socialSupport.beneficiary.qpv = qpv
    } else {
      socialSupport.beneficiary = { qpv }
    }
  }

  if (filters.ageGroup && filters.ageGroup !== AgeGroup.Custom) {
    const dateRange = ageGroupToDateRange(filters.ageGroup)
    const gte = dateRange.lower?.toDate()
    const lte = dateRange.upper?.toDate()

    if (socialSupport.beneficiary) {
      socialSupport.beneficiary.birthDate = { gte, lte }
    } else {
      socialSupport.beneficiary = { birthDate: { gte, lte } }
    }
  }
  if (filters.fromAge || filters.toAge) {
    const today = dayjs().hour(0).minute(0).second(0).millisecond(0)
    const gte = filters.toAge
      ? today
          .subtract(filters.toAge + 1, 'year')
          .add(1, 'day')
          ?.toDate()
      : undefined
    const lte = filters.fromAge
      ? today.subtract(filters.fromAge, 'year').toDate()
      : undefined

    if (socialSupport.beneficiary) {
      socialSupport.beneficiary.birthDate = { gte, lte }
    } else {
      socialSupport.beneficiary = { birthDate: { gte, lte } }
    }
  }

  if (filters.socialSupportSubjects?.length) {
    socialSupport.subjects = {
      some: { id: { in: filters.socialSupportSubjects } }
    }
  }

  if (filters.supportProgramNameIds?.length) {
    socialSupport.supportProgram = {
      supportProgramNameId: { in: filters.supportProgramNameIds }
    }
  }

  return socialSupport
}

export function prepareHelpRequestStatFilters(filters: StatFilterInput) {
  const socialSupport = prepareSocialSupportStatFilters(filters)

  // Only the financial/other facets filter on the file instruction. Every
  // help request social support has one, so an empty `fileInstruction`
  // filter would only force a costly existence join on file_instruction.
  switch (filters.helpRequestSubject) {
    case FileInstructionType.Housing:
      socialSupport.socialSupportType = 'HelpRequestHousing'
      break
    case FileInstructionType.Financial:
      socialSupport.socialSupportType = 'HelpRequest'
      socialSupport.fileInstruction = {
        helpRequest: { financialSupport: true }
      }
      break
    case FileInstructionType.Other:
      socialSupport.socialSupportType = 'HelpRequest'
      socialSupport.fileInstruction = {
        helpRequest: { financialSupport: false }
      }
      break
    default:
      socialSupport.socialSupportType = {
        in: ['HelpRequest', 'HelpRequestHousing']
      }
      break
  }

  return socialSupport
}

export function prepareFollowupStatFilters(
  filters: StatFilterInput
): Prisma.SocialSupportWhereInput {
  return {
    ...prepareSocialSupportStatFilters(filters),
    socialSupportType: SocialSupportType.Followup
  }
}

/** filterOnBeneficiaryCreated: if true, when filtering on period,
 *  don't filter on socialSupport created during the period
 * but on beneficiaries created during the period */
export function prepareBeneficiaryStatFilters(
  filters: StatFilterInput,
  filterOnBeneficiaryCreated = false
) {
  const socialSupportFilters: Prisma.SocialSupportWhereInput = {}

  const hasDateFilter =
    (filters.period && filters.period !== StatPeriodFilter.Custom) ||
    (filters.period === StatPeriodFilter.Custom &&
      (filters.fromDate || filters.toDate))

  const filterOnSocialSupportDate = hasDateFilter && !filterOnBeneficiaryCreated

  if (filterOnSocialSupportDate) {
    socialSupportFilters.date = prepareDateFilters(filters)
  }

  if (filters.socialSupportSubjects?.length) {
    socialSupportFilters.subjects = {
      some: {
        id: { in: filters.socialSupportSubjects }
      }
    }
  }

  if (filters.ministerId?.length) {
    socialSupportFilters.ministerId = {
      in: filters.ministerId
    }
  }

  const formattedFilters: Prisma.BeneficiaryWhereInput = {}

  if (filters.supportProgramNameIds?.length) {
    formattedFilters.supportPrograms = {
      some: {
        supportProgramNameId: { in: filters.supportProgramNameIds }
      }
    }
  }

  if (
    filterOnSocialSupportDate ||
    filters.socialSupportSubjects?.length ||
    filters.ministerId
  ) {
    formattedFilters.socialSupports = { some: socialSupportFilters }
  }

  if (filterOnBeneficiaryCreated && hasDateFilter) {
    formattedFilters.created = prepareDateFilters(filters)
  }

  if (filters.cities?.length) {
    formattedFilters.city = { in: filters.cities }
  }

  if (filters.employers?.length) {
    formattedFilters.employer = { in: filters.employers }
  }

  if (filters.schoolUai?.length) {
    formattedFilters.schoolUai = { in: filters.schoolUai }
  }

  if (filters.referent) {
    formattedFilters.familyFile = {
      referents: { some: { id: { equals: filters.referent } } }
    }
  }

  if (filters.beneficiaryStatus) {
    formattedFilters.status = filters.beneficiaryStatus
  }

  if (filters.qpv) {
    formattedFilters.qpv = filters.qpv === 'true'
  }

  if (filters.ageGroup && filters.ageGroup !== AgeGroup.Custom) {
    const dateRange = ageGroupToDateRange(filters.ageGroup)
    formattedFilters.birthDate = {
      gte: dateRange.lower?.toDate(),
      lte: dateRange.upper?.toDate()
    }
  }

  if (filters.fromAge || filters.toAge) {
    const today = dayjs().hour(0).minute(0).second(0).millisecond(0)
    formattedFilters.birthDate = {
      gte: filters.toAge
        ? today
            .subtract(filters.toAge + 1, 'year')
            .add(1, 'day')
            ?.toDate()
        : undefined,
      lte: filters.fromAge
        ? today.subtract(filters.fromAge, 'year').toDate()
        : undefined
    }
  }

  if (filters.ministereStructure) {
    formattedFilters.ministereStructure = filters.ministereStructure
  }

  if (filters.ministereDepartementServiceAc) {
    formattedFilters.ministereDepartementServiceAc =
      filters.ministereDepartementServiceAc
  }

  return formattedFilters
}

export function prepareDateFilters(
  filters: Pick<StatFilterInput, 'period' | 'fromDate' | 'toDate'>
) {
  switch (filters.period) {
    case StatPeriodFilter.ThisYear:
      return {
        gte: dayjs().startOf('year').toDate(),
        lte: dayjs().endOf('year').toDate()
      }
    case StatPeriodFilter.LastYear:
      return {
        gte: dayjs().subtract(1, 'year').startOf('year').toDate(),
        lte: dayjs().subtract(1, 'year').endOf('year').toDate()
      }
    case StatPeriodFilter.ThisMonth:
      return {
        gte: dayjs().startOf('month').toDate(),
        lte: dayjs().endOf('month').toDate()
      }
    case StatPeriodFilter.LastMonth:
      return {
        gte: dayjs().subtract(1, 'month').startOf('month').toDate(),
        lte: dayjs().subtract(1, 'month').endOf('month').toDate()
      }
    case StatPeriodFilter.Custom:
      return {
        ...(filters.fromDate && { gte: filters.fromDate }),
        ...(filters.toDate && { lte: filters.toDate })
      }
    default:
      return undefined
  }
}

// For SocialSupportRedirection
export const getCountByPartners = (
  redirections: { partnerOrganizationId: string | null }[],
  orgs: { id: string; name: string }[]
) => {
  const organizationNames = orgs.reduce<Record<string, string>>((acc, cur) => {
    acc[cur.id] = cur.name
    return acc
  }, {})

  const groupbypartners = redirections.reduce(
    (acc, { partnerOrganizationId }) => {
      if (!partnerOrganizationId) {
        return acc
      }
      if (!acc[partnerOrganizationId]) {
        acc[partnerOrganizationId] = {
          id: partnerOrganizationId,
          name: organizationNames[partnerOrganizationId] || STATS_NULL_LABEL,
          _count: 0
        }
      }
      acc[partnerOrganizationId]._count++
      return acc
    },
    {} as Record<string, { id: string; name: string; _count: number }>
  )

  return Object.values(groupbypartners).toSorted((a, b) => b._count - a._count)
}

export const getCountByTypes = (
  redirections: { type: SocialSupportRedirectionType }[]
) => {
  return redirections.reduce<Record<SocialSupportRedirectionType, number>>(
    (acc, { type }) => {
      if (!acc[type]) {
        acc[type] = 0
      }
      acc[type]++
      return acc
    },
    { PartnerOrganization: 0, Intern: 0, Other: 0 }
  )
}
