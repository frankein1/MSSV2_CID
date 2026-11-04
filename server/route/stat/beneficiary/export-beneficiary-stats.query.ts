import { StructureType } from '@prisma/client'
import { createQuery } from '~~/server/route'
import {
  beneficiaryAccommodationModeKeys,
  beneficiaryAccommodationZoneKeys,
  beneficiaryGenderKeys,
  beneficiaryMobilityKeys,
  beneficiarySchoolClassKeys,
  beneficiarySocioProfessionalCategoryKeys,
  familySituationKeys,
  ageGroupKeys,
  ministereCategorieKeys,
  ministereDepartmentServiceAcKeys,
  ministereStructureKeys,
  getStatLabel,
  AgeGroup
} from '~~/client/options'
import { repClassificationStatLabels } from '~~/client/labels/school.labels'
import {
  getBeneficiaryCountQuery,
  getGenderStatsQuery,
  getAgeStatsQuery,
  getFamilyStatsQuery,
  getCityStatsQuery,
  getRegionStatsQuery,
  getAccommodationZoneStatsQuery,
  getAccommodationModeStatsQuery,
  getMobilityStatsQuery,
  getCSPStatsQuery,
  getSchoolClassStatsQuery,
  getRepClassificationStatsQuery,
  getMinistereStructureStatsQuery,
  getMinistereDepartementServiceAcStatsQuery,
  getMinistereCategorieStatsQuery,
  getDepartmentStatsQuery,
  getMinistereInterpellationStatsQuery,
  getSocialSupportCountPerBeneficiaryStatsQuery
} from '~~/server/query/stats'
import type { StatFilterInput } from '~~/server/schema'
import { statFilterSchema } from '~~/server/schema'
import type { ProtectedAppContext } from '~~/server/trpc'
import { createExportFromWorkbook } from '~/utils/export/createExport'
import { STATS_NULL_LABEL } from '~/utils/constants/stats'
import { AllowSecurityCheck } from '~~/server/security/rules/types'
import { getCustomAgeGroupLabel } from '~/utils/stats'
import ExcelPkg from 'exceljs'
import type { Workbook } from 'exceljs'

type StatsRow = { label: string; number: number; percent: number | null }

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
    beneficiaryCount,
    genders,
    ages,
    situations,
    cities,
    departments,
    regions,
    zones,
    modes,
    mobilities,
    csps,
    schoolClasses,
    repClassifications,
    socialSupportCounts,
    structures,
    services,
    categories,
    interpellations
  ] = await Promise.all([
    getBeneficiaryCountQuery(user, input),
    getGenderStatsQuery(user, input),
    getAgeStatsQuery(user, input),
    getFamilyStatsQuery(user, input),
    getCityStatsQuery(user, input),
    getDepartmentStatsQuery(user, input),
    getRegionStatsQuery(user, input),
    isMinistere ? getAccommodationZoneStatsQuery(user, input) : [],
    getAccommodationModeStatsQuery(user, input),
    getMobilityStatsQuery(user, input),
    getCSPStatsQuery(user, input),
    getSchoolClassStatsQuery(user, input),
    getRepClassificationStatsQuery(user, input),
    getSocialSupportCountPerBeneficiaryStatsQuery(user, input),
    isMinistere ? getMinistereStructureStatsQuery(user, input) : [],
    isMinistere ? getMinistereDepartementServiceAcStatsQuery(user, input) : [],
    isMinistere ? getMinistereCategorieStatsQuery(user, input) : [],
    isMinistere ? getMinistereInterpellationStatsQuery(user, input) : []
  ])

  // Gender
  addStatsWorksheet(
    workbook,
    'Genre',
    genders.map(({ gender, _count }) => ({
      label: beneficiaryGenderKeys.value(gender) || STATS_NULL_LABEL,
      number: _count,
      percent: toRatio(_count, beneficiaryCount.count)
    }))
  )

  // Age
  addStatsWorksheet(
    workbook,
    "Tranches d'âge",
    ages.map(({ ageGroup, _count, fromAge, toAge }) => ({
      label:
        ageGroup === AgeGroup.Custom
          ? getCustomAgeGroupLabel(fromAge, toAge)
          : getStatLabel(ageGroupKeys.byKey, ageGroup),
      number: _count,
      percent: toRatio(_count, beneficiaryCount.count)
    }))
  )

  // Family situation
  addStatsWorksheet(
    workbook,
    'Types de situations familiales',
    situations.map(({ familySituation, _count }) => ({
      label: familySituationKeys.value(familySituation) || STATS_NULL_LABEL,
      number: _count,
      percent: toRatio(_count, beneficiaryCount.count)
    }))
  )

  // Cities
  addStatsWorksheet(
    workbook,
    'Villes',
    cities.map(({ city, _count }) => ({
      label: city || STATS_NULL_LABEL,
      number: _count,
      percent: toRatio(_count, beneficiaryCount.count)
    }))
  )

  // Departments
  addStatsWorksheet(
    workbook,
    'Départements',
    departments.map(({ department, _count }) => ({
      label: department || STATS_NULL_LABEL,
      number: _count,
      percent: toRatio(_count, beneficiaryCount.count)
    }))
  )

  // Regions
  addStatsWorksheet(
    workbook,
    'Régions',
    regions.map(({ region, _count }) => ({
      label: region || STATS_NULL_LABEL,
      number: _count,
      percent: toRatio(_count, beneficiaryCount.count)
    }))
  )

  if (isMinistere) {
    // Accommodation zone
    addStatsWorksheet(
      workbook,
      "Zones d'hébergement",
      zones.map(({ accommodationZone, _count }) => ({
        label:
          beneficiaryAccommodationZoneKeys.value(accommodationZone) ||
          STATS_NULL_LABEL,
        number: _count,
        percent: toRatio(_count, beneficiaryCount.count)
      }))
    )
  }

  // Accommodation mode
  addStatsWorksheet(
    workbook,
    "Modes d'hébergement",
    modes.map(({ accommodationMode, _count }) => ({
      label:
        beneficiaryAccommodationModeKeys.value(accommodationMode) ||
        STATS_NULL_LABEL,
      number: _count,
      percent: toRatio(_count, beneficiaryCount.count)
    }))
  )

  // Mobility data
  addStatsWorksheet(
    workbook,
    'Données mobilité',
    mobilities.map(({ mobility, _count }) => ({
      label: beneficiaryMobilityKeys.value(mobility) || STATS_NULL_LABEL,
      number: _count,
      percent: toRatio(_count, beneficiaryCount.count)
    }))
  )

  // CSP
  addStatsWorksheet(
    workbook,
    'CSP',
    csps.map(({ socioProfessionalCategory, _count }) => ({
      label:
        beneficiarySocioProfessionalCategoryKeys.value(
          socioProfessionalCategory
        ) || STATS_NULL_LABEL,
      number: _count,
      percent: toRatio(_count, beneficiaryCount.count)
    }))
  )

  // School class
  addStatsWorksheet(
    workbook,
    'Classes fréquentées',
    schoolClasses.map(({ schoolClass, _count }) => ({
      label: getStatLabel(beneficiarySchoolClassKeys.byKey, schoolClass),
      number: _count,
      percent: toRatio(_count, beneficiaryCount.count)
    }))
  )

  // REP classification
  addStatsWorksheet(
    workbook,
    'Fréquentation REP',
    repClassifications.map(({ repClassification, _count }) => ({
      label: repClassificationStatLabels[repClassification],
      number: _count,
      percent: toRatio(_count, beneficiaryCount.count)
    }))
  )

  // Social support count per beneficiary
  const socialSupportCountTotal = socialSupportCounts.reduce(
    (acc, cur) => acc + cur._count,
    0
  )
  addStatsWorksheet(
    workbook,
    'Suivis par bénéficiaire',
    socialSupportCounts
      .filter(({ _count }) => _count > 0)
      .map(({ label, _count }) => ({
        label,
        number: _count,
        percent: toRatio(_count, socialSupportCountTotal)
      }))
  )

  if (isMinistere) {
    // Ministere structure
    addStatsWorksheet(
      workbook,
      'Structures de rattachement',
      structures.map(({ ministereStructure, _count }) => ({
        label:
          ministereStructureKeys.value(ministereStructure) || STATS_NULL_LABEL,
        number: _count,
        percent: toRatio(_count, beneficiaryCount.count)
      }))
    )

    // Ministere departement service
    addStatsWorksheet(
      workbook,
      "Départements de l'AC",
      services.map(({ ministereDepartementServiceAc, _count }) => ({
        label:
          ministereDepartmentServiceAcKeys.value(
            ministereDepartementServiceAc
          ) || STATS_NULL_LABEL,
        number: _count,
        percent: toRatio(_count, beneficiaryCount.count)
      }))
    )

    // Ministere category
    addStatsWorksheet(
      workbook,
      'Catégories',
      categories.map(({ ministereCategorie, _count }) => ({
        label:
          ministereCategorieKeys.value(ministereCategorie) || STATS_NULL_LABEL,
        number: _count,
        percent: toRatio(_count, beneficiaryCount.count)
      }))
    )

    // Minister interpellations
    const totalCount = interpellations.reduce((acc, cur) => acc + cur._count, 0)
    addStatsWorksheet(
      workbook,
      'Interpellations de ministre',
      interpellations.map(({ minister, _count }) => ({
        label: minister || STATS_NULL_LABEL,
        number: _count,
        percent: toRatio(_count, totalCount)
      }))
    )
  }

  const stream = await createExportFromWorkbook(user.id, workbook)

  return { data: stream.toString('base64') }
}

export const exportBeneficiaryStatsQuery = createQuery({
  inputValidation: statFilterSchema,
  securityCheck,
  handler
})
