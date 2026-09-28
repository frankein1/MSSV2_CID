import {
  followupMediumKeys,
  socialSupportStatusKeys,
  followupDurationKeys
} from '~~/client/options'
import type { ExportFollowupsInput } from '~~/server/schema'
import {
  getAppContextPermissions,
  getFollowupPermissions,
  type SecurityRuleContext
} from '~~/server/security'
import { prepareFilters } from './helper'
import {
  MinisterRepo,
  PartnerOrganizationRepo,
  UserRepo
} from '~~/server/database'
import {
  filterFollowupForExport,
  filterSocialSupportForExport
} from '../helper'
import { findAllForExport, type ExportFollowupResult } from './export-db-query'
import type { RowType } from '~~/types/export'
import { getBooleanOrEmpty } from '~/utils/export/getBooleanOrEmpty'
import { formatUserDisplayName } from '~/utils/user'
import {
  followupFieldLabels,
  beneficiaryExportFieldLabels
} from '~~/client/labels'
import { formatMinisterName } from '~/utils/minister'
import { nameOrEmpty } from '~/utils/nameOrEmpty'
import { redirectionExportLabels } from '~~/client/labels/redirection.labels'
import { socialSupportRedirectionTypeKeys } from '~~/client/options/redirection'
import ExcelPkg from 'exceljs'
import type { Column } from 'exceljs'
import { EXPORT_DEFAULT_FONT } from '~/utils/constants/export'
import type { Prisma } from '@prisma/client'

const exportLabels = { ...followupFieldLabels, ...beneficiaryExportFieldLabels }

const FOLLOWUP_EXPORTED_FIELDS: (keyof typeof exportLabels)[] = [
  'status',
  'date',
  'beneficiaryFileNumber',
  'beneficiaryLastName',
  'beneficiaryFirstName',
  'numeroPegase',
  'minister',
  'subjects',
  'supportProgramId',
  'medium',
  'prescribingOrganizationId',
  'firstFollowup',
  // 'endOfSocialSupport',
  'synthesis',
  'classified',
  'documents',
  'dueDate',
  'forwardedToJustice',
  'helpRequested',
  'place',
  'thirdPersonName',
  'updated',
  'createdById',
  'lastUpdatedById',
  'duration',
  'isDuringWalkInSession'
]
const REDIRECTION_EXPORTED_FIELDS: (keyof typeof redirectionExportLabels)[] = [
  'type',
  'redirectionReasonId',
  'partnerOrganizationId',
  'partnerOrganizationContactId',
  'externalStructureName'
]

export async function exportFollowups({
  ctx,
  input
}: {
  ctx: SecurityRuleContext
  input: ExportFollowupsInput
}) {
  const columns = [
    ...FOLLOWUP_EXPORTED_FIELDS.map(key => ({
      key,
      header: exportLabels[key]
    })),
    ...REDIRECTION_EXPORTED_FIELDS.map(key => ({
      key,
      header: redirectionExportLabels[key]
    }))
  ]

  const where = prepareFilters(input.filters)
  const { followups, userMap, partnerMap, contactMap, ministerMap } =
    await getList({ ctx, where })

  const appPermissions = getAppContextPermissions(ctx)

  const rows: RowType[] = []

  for (const followup of followups) {
    const { socialSupport } = followup

    const permissions = getFollowupPermissions({
      ctx,
      familyFile: socialSupport.familyFile,
      socialSupport: {
        structureId: socialSupport.structureId,
        createdById: socialSupport.createdById
      }
    })

    if (!permissions.view) {
      continue
    }

    const conditions = {
      details: permissions.get.details,
      minister: appPermissions.module.ministere
    }

    const filtered = {
      ...filterSocialSupportForExport({ socialSupport, conditions }),
      ...filterFollowupForExport({ followup, conditions }),
      documents: socialSupport.documents
    }

    rows.push({
      ...formatRow(filtered, { userMap, partnerMap, contactMap, ministerMap }),
      supportProgramId:
        socialSupport.supportProgram?.supportProgramName?.name || ''
    })
  }

  return { rows, columns }
}

async function getList({
  ctx,
  where
}: {
  ctx: SecurityRuleContext
  where: Prisma.FollowupWhereInput
}) {
  const [followups, users, partners, ministers] = await Promise.all([
    findAllForExport(ctx.user, where),
    UserRepo.findMany(ctx.user, {
      select: {
        id: true
        //  firstName: true,
        //  lastName: true
      }
    }),
    PartnerOrganizationRepo.findMany(ctx.user, {
      select: {
        id: true,
        name: true,
        contacts: { select: { id: true, name: true } }
      }
    }),
    MinisterRepo.findMany(ctx.user, {
      select: {
        id: true,
        // firstName: true,
        // lastName: true,
        function: true,
        government: true
      }
    })
  ])

  const userMap = new Map(users.map(u => [u.id, u]))
  const partnerMap = new Map(partners.map(p => [p.id, p]))
  const contactMap = new Map(
    partners.flatMap(p => p.contacts.map(c => [c.id, c] as const))
  )
  const ministerMap = new Map(ministers.map(m => [m.id, m]))

  return {
    followups,
    userMap,
    partnerMap,
    contactMap,
    ministerMap
  }
}

type LookupMaps = Omit<Awaited<ReturnType<typeof getList>>, 'followups'>

type FilteredFollowup = ReturnType<typeof filterSocialSupportForExport> &
  ReturnType<typeof filterFollowupForExport> & {
    documents: ExportFollowupResult['socialSupport']['documents']
  }

function formatRow(filtered: FilteredFollowup, maps: LookupMaps): RowType {
  const minister = filtered.ministerId
    ? maps.ministerMap.get(filtered.ministerId)
    : undefined
  const createdBy = filtered.createdById
    ? maps.userMap.get(filtered.createdById)
    : undefined
  const lastUpdatedBy = filtered.lastUpdatedById
    ? maps.userMap.get(filtered.lastUpdatedById)
    : undefined
  const prescribingOrg = filtered.prescribingOrganizationId
    ? maps.partnerMap.get(filtered.prescribingOrganizationId)
    : undefined
  const redirections = filtered.socialSupportRedirections || []

  return {
    date: filtered.date || '',
    firstFollowup: getBooleanOrEmpty(filtered.firstFollowup),
    // endOfSocialSupport: getBooleanOrEmpty(filtered.endOfSocialSupport),
    status: socialSupportStatusKeys.value(filtered.status) || '',
    subjects: filtered.subjects.map(s => s.name).join(', '),
    // beneficiaryFileNumber: filtered.beneficiary.fileNumber || '',
    beneficiaryLastName: '',
    // nameOrEmpty(
    //   filtered.beneficiary.usualName?.toLocaleUpperCase() ||
    //     (filtered.beneficiary.birthName
    //       ? `(${filtered.beneficiary.birthName?.toLocaleUpperCase()})`
    //       : '')
    // ),
    // beneficiaryFirstName: nameOrEmpty(filtered.beneficiary.firstName),
    medium: followupMediumKeys.value(filtered.medium) || '',
    classified: getBooleanOrEmpty(filtered.classified),
    documents:
      filtered.documents
        ?.map(d => (d.confidential ? `${d.name} (confidentiel)` : d.name))
        .join(', ') || '',
    dueDate: filtered.dueDate || '',
    forwardedToJustice: getBooleanOrEmpty(filtered.forwardedToJustice),
    helpRequested: getBooleanOrEmpty(filtered.helpRequested),
    // minister: minister ? formatMinisterName(minister) : '',
    numeroPegase: filtered.numeroPegase || '',
    place: filtered.place || '',
    prescribingOrganizationId: prescribingOrg?.name || '',
    synthesis: filtered.synthesis || '',
    thirdPersonName: filtered.thirdPersonName || '',
    updated: filtered.updated || '',
    // createdById: createdBy ? formatUserDisplayName(createdBy) : '',
    // lastUpdatedById: lastUpdatedBy ? formatUserDisplayName(lastUpdatedBy) : '',
    duration: followupDurationKeys.value(filtered.duration) || '',
    isDuringWalkInSession: getBooleanOrEmpty(filtered.isDuringWalkInSession),
    type: redirections
      .map(r => socialSupportRedirectionTypeKeys.value(r.type))
      .filter((type): type is string => type != null)
      .join(', '),
    redirectionReasonId: redirections
      .map(r => r.redirectionReasonName)
      .filter((name): name is string => name != null)
      .join(', '),
    partnerOrganizationId: redirections
      .map(r =>
        r.partnerOrganizationId
          ? maps.partnerMap.get(r.partnerOrganizationId)?.name
          : null
      )
      .filter((name): name is string => name != null)
      .join(', '),
    partnerOrganizationContactId: redirections
      .map(r =>
        r.partnerOrganizationContactId
          ? maps.contactMap.get(r.partnerOrganizationContactId)?.name
          : null
      )
      .filter((name): name is string => name != null)
      .join(', '),
    externalStructureName: redirections
      .map(r => r.externalStructureName)
      .filter((name): name is string => name != null)
      .join(', ')
  }
}

export async function exportWorkbook({
  ctx,
  input
}: {
  ctx: SecurityRuleContext
  input: ExportFollowupsInput
}) {
  const { rows, columns } = await exportFollowups({ ctx, input })

  const { Workbook: WorkbookConstructor } = ExcelPkg
  const workbook = new WorkbookConstructor()
  const worksheet = workbook.addWorksheet('Entretiens')

  const fullColumns = columns.filter(column => {
    return rows.some(
      row =>
        column.key &&
        !Array.isArray(row) &&
        row[column.key] !== undefined &&
        row[column.key] !== null &&
        row[column.key] !== ''
    )
  }) as Partial<Column>[]

  const DATE_COLUMN_FORMATS: Record<
    string,
    { numFmt: string; parseFormat: string }
  > = {
    date: { numFmt: 'dd/mm/yyyy', parseFormat: 'DD/MM/YYYY' },
    dueDate: { numFmt: 'dd/mm/yyyy', parseFormat: 'DD/MM/YYYY' },
    updated: { numFmt: 'dd/mm/yyyy hh:mm', parseFormat: 'DD/MM/YYYY HH:mm' }
  }

  worksheet.columns = fullColumns
  worksheet.columns.forEach(sheetColumn => {
    sheetColumn.font = EXPORT_DEFAULT_FONT
    sheetColumn.width = 30
    if (sheetColumn.key && sheetColumn.key in DATE_COLUMN_FORMATS) {
      sheetColumn.numFmt = DATE_COLUMN_FORMATS[sheetColumn.key]?.numFmt
    }
  })
  worksheet.getRow(1).font = { ...EXPORT_DEFAULT_FONT, bold: true }

  worksheet.views = [{ state: 'frozen', ySplit: 1 }]
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columnCount }
  }

  rows.forEach(row => {
    const excelRow: RowType = { ...row }
    const newRow = worksheet.addRow(excelRow)
    if ((row as RowType).bold) {
      newRow.font = { bold: true }
    }
  })

  return workbook
}
