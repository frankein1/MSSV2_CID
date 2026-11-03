import { StructureType } from '@prisma/client'
import { createQuery } from '~~/server/route'
import {
  followupDurationKeys,
  followupMediumKeys,
  socialSupportStatusKeys
} from '~~/client/options'
import {
  getFollowupCountQuery,
  getFollowupSubjectsStatsQuery,
  getFollowupMediumStatsQuery,
  getFollowupMinistreStatsQuery,
  getFollowupPrescribingOrganizationStatsQuery,
  getFollowupStatusStatsQuery,
  getFollowupDurationStatsQuery,
  getFollowupMeanTimeStatsQuery,
  getFollowupRedirectionsStatsQuery,
  getFollowupRedirectionReasonsStatsQuery
} from '~~/server/query/stats'
import type { StatFilterInput } from '~~/server/schema'
import { statFilterSchema } from '~~/server/schema'
import type { ProtectedAppContext } from '~~/server/trpc'
import { createExportFromWorkbook } from '~/utils/export/createExport'
import { AllowSecurityCheck } from '~~/server/security/rules/types'
import { STATS_NULL_LABEL } from '~/utils/constants/stats'
import ExcelPkg from 'exceljs'
import type { Workbook } from 'exceljs'

type StatsRow = { label: string; number: number | null; percent: number | null }
type DurationRow = { label: string; number: number | null }

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

function addDurationWorksheet(workbook: Workbook, rows: DurationRow[]) {
  const worksheet = workbook.addWorksheet("Durée moyenne par obj d'acc.")
  worksheet.columns = [
    { key: 'label', header: "Objet d'accompagnement", width: 40 },
    {
      key: 'number',
      header: 'Durée en minutes',
      width: 18,
      style: { numFmt: '0.00' }
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

  const followupCount = await getFollowupCountQuery(user, input)

  // Subjects
  const subjectsData = await getFollowupSubjectsStatsQuery(user, input)
  const subjectCountTotal = subjectsData.reduce(
    (total, { _count }) => total + _count.socialSupports,
    0
  )
  let totalSubjectRatio = 0
  const subjectRows: StatsRow[] = subjectsData
    .filter(subject => subject._count.socialSupports > 0)
    .map(subject => {
      const ratio = toRatio(subject._count.socialSupports, followupCount)
      totalSubjectRatio += ratio ?? 0
      return {
        label: subject.name || STATS_NULL_LABEL,
        number: subject._count.socialSupports,
        percent: ratio
      }
    })
  subjectRows.push({
    label: 'Total',
    number: subjectCountTotal,
    percent: totalSubjectRatio
  })
  addStatsWorksheet(workbook, "Objets d'accompagnement", subjectRows)

  // Followup medium
  const followupMediumData = await getFollowupMediumStatsQuery(user, input)
  const followupMediumRows: StatsRow[] = followupMediumData.map(item => ({
    label: (followupMediumKeys.value(item.medium) ||
      STATS_NULL_LABEL) as string,
    number: item._count,
    percent: toRatio(item._count, followupCount)
  }))
  followupMediumRows.push({ label: 'Total', number: followupCount, percent: 1 })
  addStatsWorksheet(workbook, "Types d'entretien", followupMediumRows)

  if (structure.type === StructureType.Ministere) {
    // Ministre
    const followupMinistreData = await getFollowupMinistreStatsQuery(
      user,
      input
    )
    const followupMinistreRows: StatsRow[] = followupMinistreData.map(item => ({
      label: item.minister || STATS_NULL_LABEL,
      number: item._count ?? null,
      percent: item._count ? toRatio(item._count, followupCount) : null
    }))
    followupMinistreRows.push({
      label: 'Total',
      number: followupCount,
      percent: 1
    })
    addStatsWorksheet(workbook, 'Ministres', followupMinistreRows)
  }

  // Status
  const followupStatusData = await getFollowupStatusStatsQuery(user, input)
  const followupStatusRows: StatsRow[] = followupStatusData.map(item => ({
    label: socialSupportStatusKeys.byKey[item.status] || STATS_NULL_LABEL,
    number: item._count,
    percent: toRatio(item._count, followupCount)
  }))
  followupStatusRows.push({ label: 'Total', number: followupCount, percent: 1 })
  addStatsWorksheet(workbook, 'Statuts', followupStatusRows)

  // Redirection
  const followupRedirectionsData = await getFollowupRedirectionsStatsQuery(
    user,
    input
  )
  const redirectionsBase =
    followupRedirectionsData.followupsWithRedirections._count
  const followupsRedirectionsRows: StatsRow[] = [
    {
      label: 'Entretiens avec au moins une réorientation',
      number: redirectionsBase,
      percent: toRatio(redirectionsBase, followupCount)
    },
    {
      label: 'Redirections avec partenaire renseigné',
      number: followupRedirectionsData.withTypeIsPartners._count,
      percent: toRatio(
        followupRedirectionsData.withTypeIsPartners._count,
        redirectionsBase
      )
    },
    ...followupRedirectionsData.withTypeIsPartners.partners.map(partner => ({
      label: partner.name,
      number: partner._count,
      percent: toRatio(partner._count, redirectionsBase)
    })),
    {
      label: 'Redirections internes',
      number: followupRedirectionsData.withTypeIsIntern._count,
      percent: toRatio(
        followupRedirectionsData.withTypeIsIntern._count,
        redirectionsBase
      )
    },
    {
      label: 'Autres redirections',
      number: followupRedirectionsData.withTypeIsOther._count,
      percent: toRatio(
        followupRedirectionsData.withTypeIsOther._count,
        redirectionsBase
      )
    }
  ]
  addStatsWorksheet(workbook, 'Réorientations', followupsRedirectionsRows)

  // Redirection reasons
  const followupRedirectionReasonsData =
    await getFollowupRedirectionReasonsStatsQuery(user, input)
  const redirectionReasonsBase =
    followupRedirectionReasonsData.followupsWithReason._count
  const redirectionReasonsRows: StatsRow[] = [
    {
      label: 'Entretiens avec au moins un motif de réorientation',
      number: redirectionReasonsBase,
      percent: toRatio(redirectionReasonsBase, followupCount)
    },
    ...followupRedirectionReasonsData.reasons.map(reason => ({
      label: reason.name,
      number: reason._count,
      percent: toRatio(reason._count, followupCount)
    }))
  ]
  addStatsWorksheet(workbook, 'Motifs de réorientation', redirectionReasonsRows)

  // Prescribing Organizations
  const followupPrescribingOrganizationData =
    await getFollowupPrescribingOrganizationStatsQuery(user, input)
  let prescribingTotal = 0
  let prescribingSubTotal = 0
  followupPrescribingOrganizationData.forEach(item => {
    prescribingTotal += item._count
    if (item.prescribingOrganizationId !== 'null') {
      prescribingSubTotal += item._count
    }
  })
  const prescribingOrganizationRows: StatsRow[] = [
    {
      label: 'Entretiens avec prescripteur renseigné',
      number: prescribingSubTotal,
      percent: toRatio(prescribingSubTotal, prescribingTotal)
    },
    ...(followupPrescribingOrganizationData.length > 0
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
    ...followupPrescribingOrganizationData.map(item => ({
      label: item.prescribingOrganization,
      number: item._count,
      percent: toRatio(item._count, prescribingTotal)
    })),
    { label: 'Total', number: followupCount, percent: 1 }
  ]
  addStatsWorksheet(
    workbook,
    'Organismes prescripteurs',
    prescribingOrganizationRows
  )

  // Duration
  const followupDuration = await getFollowupDurationStatsQuery(user, input)
  addStatsWorksheet(
    workbook,
    'Durée des entretiens',
    followupDuration.map(item => ({
      label: item.duration
        ? followupDurationKeys.byKey[item.duration]
        : STATS_NULL_LABEL,
      number: item._count,
      percent: toRatio(item._count, followupCount)
    }))
  )

  // Mean time
  const followupMeanTime = await getFollowupMeanTimeStatsQuery(user, input)
  const meanTimeRows: DurationRow[] = followupMeanTime.map(item => ({
    label: item.name,
    number: Math.round(item.meanDuration)
  }))
  const meanTimeValue =
    meanTimeRows.length > 0
      ? meanTimeRows.reduce((total, item) => total + (item.number ?? 0), 0) /
        meanTimeRows.length
      : null
  addDurationWorksheet(workbook, [
    { label: 'Durée moyenne des entretiens', number: meanTimeValue },
    { label: '', number: null },
    ...meanTimeRows
  ])

  const stream = await createExportFromWorkbook(user.id, workbook)

  return { data: stream.toString('base64') }
}

export const exportFollowupStatsQuery = createQuery({
  inputValidation: statFilterSchema,
  securityCheck,
  handler
})
