import ExcelPkg from 'exceljs'
import type { Column, Workbook } from 'exceljs'
import { createQuery } from '~~/server/route'
import type { ProtectedAppContext } from '~~/server/trpc'
import type { SupportProgramStatFilterInput } from '~~/server/schema'
import { supportProgramStatFilterSchema } from '~~/server/schema'
import { AllowSecurityCheck } from '~~/server/security/rules/types'
import { getStatLabel, supportProgramOutcomeKeys } from '~~/client/options'
import { STATS_NULL_LABEL } from '~/utils/constants/stats'
import { createExportFromWorkbook } from '~/utils/export/createExport'
import { getSupportProgramEntriesExits } from './get-support-program-entries-exits-stats.query'
import { getSupportProgramOutcome } from './get-support-program-outcome-stats.query'
import { getSupportProgramNames } from './get-support-program-name-stats.query'
import { getSupportProgramPartners } from './get-support-program-partner-stats.query'
import { getSupportProgramExitReasons } from './get-support-program-exit-reason-stats.query'

type StatsRow = { label: string; number: number; percent: number | null }

const toRatio = (count: number, total: number): number | null =>
  total > 0 ? count / total : null

function addWorksheet(
  workbook: Workbook,
  name: string,
  columns: Partial<Column>[],
  rows: object[]
) {
  const worksheet = workbook.addWorksheet(name)
  worksheet.columns = columns
  worksheet.getRow(1).font = { bold: true }
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columnCount }
  }
  rows.forEach(rowData => worksheet.addRow(rowData))
}

function addStatsWorksheet(
  workbook: Workbook,
  name: string,
  labelHeader: string,
  rows: StatsRow[]
) {
  addWorksheet(
    workbook,
    name,
    [
      { key: 'label', header: labelHeader, width: 40 },
      { key: 'number', header: 'Nombre', width: 14, style: { numFmt: '0' } },
      {
        key: 'percent',
        header: 'Pourcentage',
        width: 14,
        style: { numFmt: '0.00%' }
      }
    ],
    rows
  )
}

const securityCheck = AllowSecurityCheck

const handler = async ({
  input,
  ctx
}: {
  input: SupportProgramStatFilterInput
  ctx: ProtectedAppContext
}) => {
  const { Workbook: WorkbookConstructor } = ExcelPkg
  const workbook = new WorkbookConstructor()

  const [entriesExits, outcomes, names, partners, exitReasons] =
    await Promise.all([
      getSupportProgramEntriesExits(input, ctx),
      getSupportProgramOutcome(input, ctx),
      getSupportProgramNames(input, ctx),
      getSupportProgramPartners(input, ctx),
      getSupportProgramExitReasons(input, ctx)
    ])

  // Entries and exits
  addWorksheet(
    workbook,
    'Entrées et sorties',
    [
      { key: 'name', header: 'Dispositif', width: 40 },
      { key: 'entries', header: 'Entrées', width: 14, style: { numFmt: '0' } },
      { key: 'exits', header: 'Sorties', width: 14, style: { numFmt: '0' } },
      { key: 'ongoing', header: 'En cours', width: 14, style: { numFmt: '0' } }
    ],
    entriesExits.map(({ name, entries, exits, ongoing }) => ({
      name,
      entries,
      exits,
      ongoing
    }))
  )

  // Outcome
  const outcomeTotal = outcomes.reduce((acc, { _count }) => acc + _count, 0)
  addStatsWorksheet(
    workbook,
    'Atteinte des objectifs',
    'Atteinte des objectifs',
    outcomes.map(({ outcome, _count }) => ({
      label: getStatLabel(supportProgramOutcomeKeys.byKey, outcome),
      number: _count,
      percent: toRatio(_count, outcomeTotal)
    }))
  )

  // Beneficiaries per support program name, a beneficiary can be counted
  // several times so the ratio is computed on distinct beneficiaries
  addStatsWorksheet(
    workbook,
    'Bénéficiaires par dispositif',
    'Dispositif',
    names.supportProgramNames.map(({ name, _count }) => ({
      label: name,
      number: _count,
      percent: toRatio(_count, names.total)
    }))
  )

  // Beneficiaries per partner, same as above
  addStatsWorksheet(
    workbook,
    'Bénéficiaires par partenaire',
    'Partenaire',
    partners.partners.map(({ name, _count }) => ({
      label: name ?? STATS_NULL_LABEL,
      number: _count,
      percent: toRatio(_count, partners.total)
    }))
  )

  // Exit reasons
  const exitReasonTotal = exitReasons.reduce(
    (acc, { _count }) => acc + _count,
    0
  )
  addStatsWorksheet(
    workbook,
    'Motif de sortie',
    'Motif de sortie',
    exitReasons.map(({ name, _count }) => ({
      label: name ?? STATS_NULL_LABEL,
      number: _count,
      percent: toRatio(_count, exitReasonTotal)
    }))
  )

  const stream = await createExportFromWorkbook(ctx.user.id, workbook)
  return { data: stream.toString('base64') }
}

export const exportSupportProgramStatsQuery = createQuery({
  inputValidation: supportProgramStatFilterSchema,
  securityCheck,
  handler
})
