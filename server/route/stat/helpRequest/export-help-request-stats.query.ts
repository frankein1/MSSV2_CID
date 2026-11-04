import { StructureType } from '@prisma/client'
import { createQuery } from '~~/server/route'
import {
  socialSupportStatusKeys,
  fileInstructionTypeKeys
} from '~~/client/options'
import {
  getHelpRequestCountQuery,
  getHelpRequestSubjectsStatsQuery,
  getHelpRequestMinistreStatsQuery,
  getHelpRequestPrescribingOrganizationStatsQuery,
  getHelpRequestStatusStatsQuery,
  getFileInstructionTypeStatsQuery,
  getHelpRequestAmountsAllocatedQuery,
  getHelpRequestAmountsByInstructorOrganizationQuery,
  getHelpRequestAmountsBySubjectQuery,
  getHelpRequestHousingStatsQuery,
  getHelpRequestRedirectionsStatsQuery,
  getHelpRequestRedirectionReasonsStatsQuery
} from '~~/server/query/stats'
import type { StatFilterInput } from '~~/server/schema'
import { statFilterSchema } from '~~/server/schema'
import type { ProtectedAppContext } from '~~/server/trpc'
import { createExportFromWorkbook } from '~/utils/export/createExport'
import { AllowSecurityCheck } from '~~/server/security/rules/types'
import { getHelpRequestInstructionsStats } from '~~/server/query/stats/helpRequest/getHelpRequestInstructionsStats'
import { STATS_NULL_LABEL } from '~/utils/constants/stats'
import ExcelPkg from 'exceljs'
import type { Workbook } from 'exceljs'

const CURRENCY_FORMAT = '#,##0.00 "€"'

type StatsRow = { label: string; number: number | null; percent: number | null }
type AmountsRow = {
  label: string
  allocated: number | null
  asked: number | null
  percent: number | null
}
type AmountsBySubjectRow = { label: string; allocated: number | null }

const toRatio = (count: number, total: number): number | null =>
  total > 0 ? count / total : null

function addStatsWorksheet(workbook: Workbook, name: string, rows: StatsRow[]) {
  const worksheet = workbook.addWorksheet(name)
  worksheet.columns = [
    { key: 'label', header: name, width: 32 },
    { key: 'number', header: 'Nombre', width: 14, style: { numFmt: '0' } },
    {
      key: 'percent',
      header: 'Pourcentage',
      width: 14,
      style: { numFmt: '0.00%' }
    }
  ]
  worksheet.getRow(1).font = { bold: true }
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columnCount }
  }
  rows.forEach(rowData => worksheet.addRow(rowData))
}

function addAmountsWorksheet(
  workbook: Workbook,
  name: string,
  labelHeader: string,
  rows: AmountsRow[]
) {
  const worksheet = workbook.addWorksheet(name)
  worksheet.columns = [
    { key: 'label', header: labelHeader, width: 32 },
    {
      key: 'allocated',
      header: 'Montant délivré',
      width: 18,
      style: { numFmt: CURRENCY_FORMAT }
    },
    {
      key: 'asked',
      header: 'Montant demandé',
      width: 18,
      style: { numFmt: CURRENCY_FORMAT }
    },
    {
      key: 'percent',
      header: 'Pourcentage',
      width: 14,
      style: { numFmt: '0.00%' }
    }
  ]
  worksheet.getRow(1).font = { bold: true }
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columnCount }
  }
  rows.forEach(rowData => worksheet.addRow(rowData))
}

function addAmountsBySubjectWorksheet(
  workbook: Workbook,
  rows: AmountsBySubjectRow[]
) {
  const worksheet = workbook.addWorksheet("Montants objet d'accompagnement")
  worksheet.columns = [
    { key: 'label', header: "Objet d'accompagnement", width: 32 },
    {
      key: 'allocated',
      header: 'Montant délivré',
      width: 18,
      style: { numFmt: CURRENCY_FORMAT }
    }
  ]
  worksheet.getRow(1).font = { bold: true }
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columnCount }
  }
  rows.forEach(rowData => worksheet.addRow(rowData))
}

const securityCheck = AllowSecurityCheck

const handler = async ({
  input,
  ctx: { user, structure }
}: {
  input: StatFilterInput
  ctx: ProtectedAppContext
}) => {
  const { Workbook: WorkbookConstructor } = ExcelPkg
  const workbook = new WorkbookConstructor()

  const isMinistere = structure.type === StructureType.Ministere
  const [
    helpRequestCount,
    fileInstructionType,
    subjectsData,
    helpRequestStatusData,
    helpRequestMinistreData,
    helpRequestPrescribingOrganizationData,
    instructions,
    amountsAllocated,
    amountsByInstructorOrganization,
    amountsBySubject,
    helpRequestRedirectionsData,
    helpRequestRedirectionReasonsData,
    housingRequest
  ] = await Promise.all([
    getHelpRequestCountQuery(user, input),
    getFileInstructionTypeStatsQuery(user, input),
    getHelpRequestSubjectsStatsQuery(user, input),
    getHelpRequestStatusStatsQuery(user, input),
    isMinistere ? getHelpRequestMinistreStatsQuery(user, input) : [],
    getHelpRequestPrescribingOrganizationStatsQuery(user, input),
    getHelpRequestInstructionsStats(user, input),
    getHelpRequestAmountsAllocatedQuery(user, input),
    getHelpRequestAmountsByInstructorOrganizationQuery(user, input),
    getHelpRequestAmountsBySubjectQuery(user, input),
    getHelpRequestRedirectionsStatsQuery(user, input),
    getHelpRequestRedirectionReasonsStatsQuery(user, input),
    getHelpRequestHousingStatsQuery(user, input)
  ])

  // Instruction type
  const instructionTypeRows: StatsRow[] = fileInstructionType.map(item => ({
    label: item.subject
      ? fileInstructionTypeKeys.byKey[item.subject]
      : STATS_NULL_LABEL,
    number: item._count,
    percent: toRatio(item._count, helpRequestCount)
  }))
  instructionTypeRows.push({
    label: 'Total',
    number: helpRequestCount,
    percent: 1
  })
  addStatsWorksheet(workbook, "Thématique d'instruction", instructionTypeRows)

  // Subject
  const subjectRows: StatsRow[] = subjectsData
    .filter(item => item._count.socialSupports > 0)
    .map(item => ({
      label: item.name || STATS_NULL_LABEL,
      number: item._count.socialSupports,
      percent: toRatio(item._count.socialSupports, helpRequestCount)
    }))
  subjectRows.push({
    label: 'Total',
    number: helpRequestCount,
    percent: 1
  })
  addStatsWorksheet(workbook, "Objet d'accompagnement", subjectRows)

  // Status
  const helpRequestStatusRows: StatsRow[] = helpRequestStatusData.map(item => ({
    label: socialSupportStatusKeys.byKey[item.status] || STATS_NULL_LABEL,
    number: item._count,
    percent: toRatio(item._count, helpRequestCount)
  }))
  helpRequestStatusRows.push({
    label: 'Total',
    number: helpRequestCount,
    percent: 1
  })
  addStatsWorksheet(workbook, 'Statuts', helpRequestStatusRows)

  if (isMinistere) {
    // Ministre
    const helpRequestMinistreRows: StatsRow[] = helpRequestMinistreData.map(
      item => ({
        label: item.minister || STATS_NULL_LABEL,
        number: item._count ?? null,
        percent: item._count ? toRatio(item._count, helpRequestCount) : null
      })
    )
    helpRequestMinistreRows.push({
      label: 'Total',
      number: helpRequestCount,
      percent: 1
    })
    addStatsWorksheet(workbook, 'Ministres', helpRequestMinistreRows)
  }

  // Prescribing organizations
  let prescribingTotal = 0
  let prescribingSubTotal = 0
  helpRequestPrescribingOrganizationData.forEach(item => {
    prescribingTotal += item._count
    if (item.prescribingOrganizationId !== 'null') {
      prescribingSubTotal += item._count
    }
  })
  const prescribingOrganizationRows: StatsRow[] = [
    {
      label: "Dossiers d'instruction avec prescripteur renseigné",
      number: prescribingSubTotal,
      percent: toRatio(prescribingSubTotal, prescribingTotal)
    },
    ...(helpRequestPrescribingOrganizationData.length > 0
      ? [
          {
            label: 'RÉPARTITION DES ORGANISMES PRESCRIPTEURS',
            number: null,
            percent: null
          },
          {
            label:
              'Pourcentage calculé sur le nombre total des instructions de dossiers.',
            number: null,
            percent: null
          }
        ]
      : []),
    ...helpRequestPrescribingOrganizationData.map(item => ({
      label: item.prescribingOrganization,
      number: item._count,
      percent: toRatio(item._count, prescribingTotal)
    }))
  ]
  addStatsWorksheet(
    workbook,
    'Organismes prescripteurs',
    prescribingOrganizationRows
  )

  // Instructions
  const externalCount = instructions.fileInstructions.externalStructure._count
  const externalTotalCount =
    instructions.fileInstructions.instructorOrganization.reduce(
      (total, item) => total + item._count,
      0
    )
  const instructionRows: StatsRow[] = [
    {
      label: 'Instructions en externe',
      number: externalCount,
      percent: toRatio(externalCount, instructions.fileInstructions._count)
    },
    {
      label: 'Instructions en interne',
      number: instructions.fileInstructions.internalStructure._count,
      percent: toRatio(
        instructions.fileInstructions.internalStructure._count,
        instructions.fileInstructions._count
      )
    },
    ...(instructions.fileInstructions.instructorOrganization.length > 0
      ? [
          {
            label: 'RÉPARTITION DES INSTRUCTIONS EXTERNES',
            number: null,
            percent: null
          },
          {
            label:
              'Pourcentage calculé sur le nombre de dossiers instruits en externe.',
            number: null,
            percent: null
          }
        ]
      : []),
    ...instructions.fileInstructions.instructorOrganization.map(item => ({
      label: item.name,
      number: item._count,
      percent: toRatio(item._count, externalTotalCount)
    }))
  ]
  addStatsWorksheet(workbook, 'Instructions', instructionRows)

  // Amounts allocated
  addAmountsWorksheet(
    workbook,
    'Montants des aides délivrées',
    '',
    amountsAllocated.breakdown.map(breakdown => ({
      label: breakdown.label,
      allocated: breakdown.count,
      asked: breakdown.subCount,
      percent: toRatio(breakdown.count, breakdown.subCount)
    }))
  )

  // Amounts allocated by instructor organization
  const totalAllocated = amountsByInstructorOrganization.reduce(
    (acc, cur) => acc + cur.count,
    0
  )
  const totalAsked = amountsByInstructorOrganization.reduce(
    (acc, cur) => acc + cur.subCount,
    0
  )
  const amountsByInstructorRows: AmountsRow[] =
    amountsByInstructorOrganization.map(amount => ({
      label: amount.label,
      allocated: amount.count,
      asked: amount.subCount,
      percent: toRatio(amount.count, amount.subCount)
    }))
  amountsByInstructorRows.push({
    label: 'TOTAL',
    allocated: totalAllocated,
    asked: totalAsked,
    percent: 1
  })
  addAmountsWorksheet(
    workbook,
    'Montants organisme instructeur',
    'Organisme instructeur',
    amountsByInstructorRows
  )

  // Amounts allocated by social support subject
  const totalBySubject = amountsBySubject.reduce(
    (acc, cur) => acc + cur.count,
    0
  )
  const amountsBySubjectRows: AmountsBySubjectRow[] = amountsBySubject.map(
    amount => ({ label: amount.label, allocated: amount.count })
  )
  amountsBySubjectRows.push({ label: 'TOTAL', allocated: totalBySubject })
  addAmountsBySubjectWorksheet(workbook, amountsBySubjectRows)

  // Redirections
  const redirectionsBase =
    helpRequestRedirectionsData.helpRequestsWithRedirections._count
  const helpRequestRedirectionsRows: StatsRow[] = [
    {
      label: 'Instructions de dossiers avec au moins une réorientation',
      number: redirectionsBase,
      percent: toRatio(redirectionsBase, helpRequestCount)
    },
    {
      label: 'Redirections avec partenaire renseigné',
      number: helpRequestRedirectionsData.withTypeIsPartners._count,
      percent: toRatio(
        helpRequestRedirectionsData.withTypeIsPartners._count,
        redirectionsBase
      )
    },
    ...helpRequestRedirectionsData.withTypeIsPartners.partners.map(partner => ({
      label: partner.name,
      number: partner._count,
      percent: toRatio(partner._count, redirectionsBase)
    })),
    {
      label: 'Redirections internes',
      number: helpRequestRedirectionsData.withTypeIsIntern._count,
      percent: toRatio(
        helpRequestRedirectionsData.withTypeIsIntern._count,
        redirectionsBase
      )
    },
    {
      label: 'Autres redirections',
      number: helpRequestRedirectionsData.withTypeIsOther._count,
      percent: toRatio(
        helpRequestRedirectionsData.withTypeIsOther._count,
        redirectionsBase
      )
    }
  ]
  addStatsWorksheet(workbook, 'Réorientations', helpRequestRedirectionsRows)

  // Redirection reasons
  const redirectionReasonsBase =
    helpRequestRedirectionReasonsData.helpRequestsWithReason._count
  const redirectionReasonsRows: StatsRow[] = [
    {
      label: 'Instructions de dossiers avec au moins un motif de réorientation',
      number: redirectionReasonsBase,
      percent: toRatio(redirectionReasonsBase, helpRequestCount)
    },
    ...helpRequestRedirectionReasonsData.reasons.map(reason => ({
      label: reason.name,
      number: reason._count,
      percent: toRatio(reason._count, helpRequestCount)
    }))
  ]
  addStatsWorksheet(workbook, 'Motifs de réorientation', redirectionReasonsRows)

  // Housing request
  const contextValue = (value: boolean | null) => {
    switch (value) {
      case true:
        return '1ère demande'
      case false:
        return 'Renouvellement'
      case null:
        return STATS_NULL_LABEL
    }
  }
  const housingRows: StatsRow[] = [
    ...housingRequest.housingHelpRequestContextCount.map(item => ({
      label: contextValue(item.isFirst),
      number: item._count,
      percent: toRatio(item._count, housingRequest.housingHelpRequestCount)
    })),
    { label: 'Motif des demandes de logement', number: null, percent: null },
    ...housingRequest.housingHelpRequestReasonCount.map(item => ({
      label: item.reason || STATS_NULL_LABEL,
      number: item._count,
      percent: toRatio(item._count, housingRequest.housingHelpRequestCount)
    }))
  ]
  addStatsWorksheet(workbook, 'Demandes de logement', housingRows)

  const stream = await createExportFromWorkbook(user.id, workbook)

  return { data: stream.toString('base64') }
}

export const exportHelpRequestStatsQuery = createQuery({
  inputValidation: statFilterSchema,
  securityCheck,
  handler
})
