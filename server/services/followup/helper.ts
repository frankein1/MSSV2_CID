import dayjs from 'dayjs'
import type {
  FollowupMedium,
  SocialSupportSubject,
  Prisma
} from '@prisma/client'
import type {
  FollowupFilterInput,
  ExportFollowupsInput
} from '~~/server/schema'
import { FollowupPeriodFilter } from '~~/types/followup'
import { SortOrder } from '~~/types/table'
import { FilterFollowupNotFilled } from '~/utils/constants/filters'

/**
 * A followup's denormalized `social_support.subtype` mirrors its `medium`.
 * Both create and update derive the value here so the column can't drift from
 * `followup.medium` (see the `subtype` field in prisma/schema.prisma).
 */
export function deriveFollowupSubtype(medium: FollowupMedium): string {
  return medium
}

export function prepareSocialSupportSubjectsMutations(
  inputSubjects: string[],
  targetSubjects?: SocialSupportSubject[]
) {
  return {
    connect: inputSubjects.map(id => ({ id })),
    disconnect: targetSubjects
      ?.filter(({ id }) => !inputSubjects.includes(id))
      .map(({ id }) => ({ id }))
  }
}

export function prepareFilters(filters: FollowupFilterInput) {
  const {
    status,
    medium,
    socialSupportSubjects,
    createdById,
    ministerId,
    period,
    fromDate,
    toDate,
    ministereDepartementServiceAc,
    ministereStructure,
    notFilled
  } = filters

  const formattedFilters: Prisma.FollowupWhereInput = {}

  if (medium) {
    formattedFilters.medium = { in: medium }
  }

  if (
    status ||
    socialSupportSubjects?.length ||
    createdById ||
    ministerId ||
    ministereDepartementServiceAc ||
    ministereStructure ||
    period
  ) {
    formattedFilters.socialSupport = {}

    if (status) {
      formattedFilters.socialSupport.status = status
    }

    if (socialSupportSubjects?.length) {
      formattedFilters.socialSupport.subjects = {
        some: { id: { in: socialSupportSubjects } }
      }
    }

    if (createdById) {
      formattedFilters.socialSupport.createdById = { in: createdById }
    }

    if (ministerId) {
      formattedFilters.socialSupport.ministerId = {
        in: filters.ministerId
      }
    }

    if (ministereStructure) {
      if (formattedFilters.socialSupport.beneficiary) {
        formattedFilters.socialSupport.beneficiary.ministereStructure =
          ministereStructure
      } else {
        formattedFilters.socialSupport.beneficiary = {
          ministereStructure: filters.ministereStructure
        }
      }
    }

    if (ministereDepartementServiceAc) {
      if (formattedFilters.socialSupport.beneficiary) {
        formattedFilters.socialSupport.beneficiary.ministereDepartementServiceAc =
          ministereDepartementServiceAc
      } else {
        formattedFilters.socialSupport.beneficiary = {
          ministereDepartementServiceAc: filters.ministereDepartementServiceAc
        }
      }
    }

    if (
      (period && period !== FollowupPeriodFilter.Custom) ||
      (period === FollowupPeriodFilter.Custom && (fromDate || toDate))
    ) {
      formattedFilters.socialSupport.date = prepareDateFilters(filters)
    }
  }

  switch (notFilled) {
    case FilterFollowupNotFilled.PrescribingOrganization:
      formattedFilters.prescribingOrganization = null
      break
    case FilterFollowupNotFilled.Duration:
      formattedFilters.duration = null
      break
    default:
      break
  }

  return formattedFilters
}

export function prepareSort(sort: ExportFollowupsInput['orderBy']) {
  const orderBy: Prisma.FollowupFindManyArgs['orderBy'] = [sort]

  if (sort.socialSupport?.date) {
    orderBy.push({ socialSupport: { created: SortOrder.Desc } })
  }

  return orderBy
}

function prepareDateFilters(filters: FollowupFilterInput) {
  switch (filters.period) {
    case FollowupPeriodFilter.ThisYear:
      return {
        gte: dayjs().startOf('year').toDate(),
        lte: dayjs().endOf('year').toDate()
      }
    case FollowupPeriodFilter.LastYear:
      return {
        gte: dayjs().subtract(1, 'year').startOf('year').toDate(),
        lte: dayjs().subtract(1, 'year').endOf('year').toDate()
      }
    case FollowupPeriodFilter.ThisMonth:
      return {
        gte: dayjs().startOf('month').toDate(),
        lte: dayjs().endOf('month').toDate()
      }
    case FollowupPeriodFilter.LastMonth:
      return {
        gte: dayjs().subtract(1, 'month').startOf('month').toDate(),
        lte: dayjs().subtract(1, 'month').endOf('month').toDate()
      }
    case FollowupPeriodFilter.Custom:
      return {
        ...(filters.fromDate && { gte: filters.fromDate }),
        ...(filters.toDate && { lte: filters.toDate })
      }
    default:
      return undefined
  }
}
