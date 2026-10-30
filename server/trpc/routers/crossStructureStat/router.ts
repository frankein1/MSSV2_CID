import { statRoutes as routes } from '~~/server/route'
import * as crossStructureRoutes from '~~/server/route/crossStructureStat'
import {
  mergeRedirectionReasonStats,
  mergeRedirectionStats,
  mergeSubjectStats,
  mergeSupportProgramEntriesExitsStats,
  mergeSupportProgramPartnerStats
} from '~~/server/route/crossStructureStat/merge-by-name'
import { crossStructureProcedure, router } from '~~/server/trpc'
import {
  getBeneficiariesCitiesQuery,
  getBeneficiariesSchoolsQuery
} from '~~/server/route/config'

/**
 * Review app only: cross-structure statistics panel.
 *
 * Reuses the structure-side stat routes through `crossStructureProcedure`.
 * Only queries; never wire an export or a mutation here.
 */
export const crossStructureStatRouter = router({
  // Filter options
  getStructureList: crossStructureProcedure
    .input(crossStructureRoutes.getStructureListQuery.inputValidation)
    .query(crossStructureRoutes.getStructureListQuery.execute),
  getSocialSupportSubjectNameList: crossStructureProcedure
    .input(
      crossStructureRoutes.getSocialSupportSubjectNameListQuery.inputValidation
    )
    .query(crossStructureRoutes.getSocialSupportSubjectNameListQuery.execute),
  getSupportProgramNameList: crossStructureProcedure
    .input(crossStructureRoutes.getSupportProgramNameListQuery.inputValidation)
    .query(crossStructureRoutes.getSupportProgramNameListQuery.execute),
  getBeneficiariesCities: crossStructureProcedure
    .input(getBeneficiariesCitiesQuery.inputValidation)
    .query(getBeneficiariesCitiesQuery.execute),
  getBeneficiariesSchools: crossStructureProcedure
    .input(getBeneficiariesSchoolsQuery.inputValidation)
    .query(getBeneficiariesSchoolsQuery.execute),

  // Bénéficiaires
  getBeneficiaryCount: crossStructureProcedure
    .input(routes.getBeneficiaryCountQ.inputValidation)
    .query(routes.getBeneficiaryCountQ.execute),
  getGenderStats: crossStructureProcedure
    .input(routes.getGenderStatsQ.inputValidation)
    .query(routes.getGenderStatsQ.execute),
  getSchoolClassStats: crossStructureProcedure
    .input(routes.getSchoolClassStatsQ.inputValidation)
    .query(routes.getSchoolClassStatsQ.execute),
  getRepClassificationStats: crossStructureProcedure
    .input(routes.getRepClassificationStatsQ.inputValidation)
    .query(routes.getRepClassificationStatsQ.execute),
  getSocialSupportCountPerBeneficiaryStats: crossStructureProcedure
    .input(routes.getSocialSupportCountPerBeneficiaryStatsQ.inputValidation)
    .query(routes.getSocialSupportCountPerBeneficiaryStatsQ.execute),

  // Instructions de dossier
  getHelpRequestCountStats: crossStructureProcedure
    .input(routes.getHelpRequestCountStatsQuery.inputValidation)
    .query(routes.getHelpRequestCountStatsQuery.execute),
  // One subject row per structure: regroup by name
  getHelpRequestSubjectStats: crossStructureProcedure
    .input(routes.getHelpRequestSubjectsStatsQ.inputValidation)
    .query(async opts =>
      mergeSubjectStats(await routes.getHelpRequestSubjectsStatsQ.execute(opts))
    ),
  // One redirection reason row per structure: regroup by name
  getHelpRequestRedirectionReasonsStats: crossStructureProcedure
    .input(routes.getHelpRequestRedirectionReasonsStatsQ.inputValidation)
    .query(async opts =>
      mergeRedirectionReasonStats(
        await routes.getHelpRequestRedirectionReasonsStatsQ.execute(opts)
      )
    ),
  // One partner organisation row per structure: regroup partners by name
  getHelpRequestRedirectionsStats: crossStructureProcedure
    .input(routes.getHelpRequestRedirectionsStatsQ.inputValidation)
    .query(async opts =>
      mergeRedirectionStats(
        await routes.getHelpRequestRedirectionsStatsQ.execute(opts)
      )
    ),

  // Entretiens
  getFollowupCountStats: crossStructureProcedure
    .input(routes.getFollowupCountStatsQuery.inputValidation)
    .query(routes.getFollowupCountStatsQuery.execute),
  // One subject row per structure: regroup by name
  getFollowupSubjectStats: crossStructureProcedure
    .input(routes.getFollowupSubjectsStatsQ.inputValidation)
    .query(async opts =>
      mergeSubjectStats(await routes.getFollowupSubjectsStatsQ.execute(opts))
    ),

  // Dispositifs
  // One support program name row per structure: regroup by name
  getSupportProgramEntriesExitsStats: crossStructureProcedure
    .input(routes.getSupportProgramEntriesExitsStatsQuery.inputValidation)
    .query(async opts =>
      mergeSupportProgramEntriesExitsStats(
        await routes.getSupportProgramEntriesExitsStatsQuery.execute(opts)
      )
    ),
  getSupportProgramMeanDurationStats: crossStructureProcedure
    .input(routes.getSupportProgramMeanDurationStatsQuery.inputValidation)
    .query(routes.getSupportProgramMeanDurationStatsQuery.execute),
  // One partner organisation row per structure: regroup by name
  getSupportProgramPartnerStats: crossStructureProcedure
    .input(routes.getSupportProgramPartnerStatsQuery.inputValidation)
    .query(async opts =>
      mergeSupportProgramPartnerStats(
        await routes.getSupportProgramPartnerStatsQuery.execute(opts)
      )
    )
})
