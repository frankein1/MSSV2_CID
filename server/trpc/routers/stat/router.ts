import { statRoutes as routes } from '~~/server/route'
import { protectedProcedure, router } from '~~/server/trpc'

export const statRouter = router({
  getAccommodationZoneStats: protectedProcedure
    .input(routes.getAccommodationZoneStatsQ.inputValidation)
    .query(routes.getAccommodationZoneStatsQ.execute),
  getAccommodationModeStats: protectedProcedure
    .input(routes.getAccommodationModeStatsQ.inputValidation)
    .query(routes.getAccommodationModeStatsQ.execute),
  getAgeStats: protectedProcedure
    .input(routes.getAgeStatsQ.inputValidation)
    .query(routes.getAgeStatsQ.execute),
  getBeneficiaryCount: protectedProcedure
    .input(routes.getBeneficiaryCountQ.inputValidation)
    .query(routes.getBeneficiaryCountQ.execute),
  getFamilyFileCount: protectedProcedure
    .input(routes.getFamilyFileCountQ.inputValidation)
    .query(routes.getFamilyFileCountQ.execute),
  getCSPStats: protectedProcedure
    .input(routes.getCSPStatsQ.inputValidation)
    .query(routes.getCSPStatsQ.execute),
  getSchoolClassStats: protectedProcedure
    .input(routes.getSchoolClassStatsQ.inputValidation)
    .query(routes.getSchoolClassStatsQ.execute),
  getRepClassificationStats: protectedProcedure
    .input(routes.getRepClassificationStatsQ.inputValidation)
    .query(routes.getRepClassificationStatsQ.execute),
  getSocialSupportCountPerBeneficiaryStats: protectedProcedure
    .input(routes.getSocialSupportCountPerBeneficiaryStatsQ.inputValidation)
    .query(routes.getSocialSupportCountPerBeneficiaryStatsQ.execute),
  getFamilyStats: protectedProcedure
    .input(routes.getFamilyStatsQ.inputValidation)
    .query(routes.getFamilyStatsQ.execute),
  getHousingHelpRequestsStats: protectedProcedure
    .input(routes.getHousingHelpRequestsStatsQ.inputValidation)
    .query(routes.getHousingHelpRequestsStatsQ.execute),
  getFollowupActionsEntreprisesStats: protectedProcedure
    .input(routes.getFollowupActionsEntreprisesStatsQ.inputValidation)
    .query(routes.getFollowupActionsEntreprisesStatsQ.execute),
  getFollowupRedirectionsStats: protectedProcedure
    .input(routes.getRedirectionsStatsQ.inputValidation)
    .query(routes.getRedirectionsStatsQ.execute),
  getFollowupRedirectionReasonsStats: protectedProcedure
    .input(routes.getFollowupRedirectionReasonsStatsQ.inputValidation)
    .query(routes.getFollowupRedirectionReasonsStatsQ.execute),
  getFollowupMediumStats: protectedProcedure
    .input(routes.getFollowupMediumStatsQ.inputValidation)
    .query(routes.getFollowupMediumStatsQ.execute),
  getFollowupMinistreStats: protectedProcedure
    .input(routes.getFollowupMinistreStatsQ.inputValidation)
    .query(routes.getFollowupMinistreStatsQ.execute),
  getFollowupPrescribingOrganizationStats: protectedProcedure
    .input(routes.getFollowupPrescribingOrganizationStatsQ.inputValidation)
    .query(routes.getFollowupPrescribingOrganizationStatsQ.execute),
  getFollowupStatusStats: protectedProcedure
    .input(routes.getFollowupStatusStatsQ.inputValidation)
    .query(routes.getFollowupStatusStatsQ.execute),
  getGenderStats: protectedProcedure
    .input(routes.getGenderStatsQ.inputValidation)
    .query(routes.getGenderStatsQ.execute),
  getHelpRequestMinistreStats: protectedProcedure
    .input(routes.getHelpRequestMinistreStatsQ.inputValidation)
    .query(routes.getHelpRequestMinistreStatsQ.execute),
  getHelpRequestPrescribingOrganizationStats: protectedProcedure
    .input(routes.getHelpRequestPrescribingOrganizationStatsQ.inputValidation)
    .query(routes.getHelpRequestPrescribingOrganizationStatsQ.execute),
  getHelpRequestAmountsBySubject: protectedProcedure
    .input(routes.getHelpRequestAmountsBySubjectQ.inputValidation)
    .query(routes.getHelpRequestAmountsBySubjectQ.execute),
  getHelpRequestInstructionsStats: protectedProcedure
    .input(routes.getHelpRequestInstructionsStatsQ.inputValidation)
    .query(routes.getHelpRequestInstructionsStatsQ.execute),
  getHelpRequestRedirectionsStats: protectedProcedure
    .input(routes.getHelpRequestRedirectionsStatsQ.inputValidation)
    .query(routes.getHelpRequestRedirectionsStatsQ.execute),
  getHelpRequestRedirectionReasonsStats: protectedProcedure
    .input(routes.getHelpRequestRedirectionReasonsStatsQ.inputValidation)
    .query(routes.getHelpRequestRedirectionReasonsStatsQ.execute),
  getHelpRequestStatusStats: protectedProcedure
    .input(routes.getHelpRequestStatusStatsQ.inputValidation)
    .query(routes.getHelpRequestStatusStatsQ.execute),
  getHelpRequestAmountsByInstructorOrganization: protectedProcedure
    .input(
      routes.getHelpRequestAmountsByInstructorOrganizationQ.inputValidation
    )
    .query(routes.getHelpRequestAmountsByInstructorOrganizationQ.execute),
  getHelpRequestAmountsAllocated: protectedProcedure
    .input(routes.getHelpRequestAmountsAllocatedQ.inputValidation)
    .query(routes.getHelpRequestAmountsAllocatedQ.execute),
  getFileInstructionTypeStats: protectedProcedure
    .input(routes.getFileInstructionTypeStatsQ.inputValidation)
    .query(routes.getFileInstructionTypeStatsQ.execute),
  getFollowupCountStats: protectedProcedure
    .input(routes.getFollowupCountStatsQuery.inputValidation)
    .query(routes.getFollowupCountStatsQuery.execute),
  getHelpRequestCountStats: protectedProcedure
    .input(routes.getHelpRequestCountStatsQuery.inputValidation)
    .query(routes.getHelpRequestCountStatsQuery.execute),
  getMobilityStats: protectedProcedure
    .input(routes.getMobilityStatsQ.inputValidation)
    .query(routes.getMobilityStatsQ.execute),
  getCityStats: protectedProcedure
    .input(routes.getCityStatsQ.inputValidation)
    .query(routes.getCityStatsQ.execute),
  getDepartmentStats: protectedProcedure
    .input(routes.getDepartmentStatsQ.inputValidation)
    .query(routes.getDepartmentStatsQ.execute),
  getRegionStats: protectedProcedure
    .input(routes.getRegionStatsQ.inputValidation)
    .query(routes.getRegionStatsQ.execute),
  getFollowupSubjectStats: protectedProcedure
    .input(routes.getFollowupSubjectsStatsQ.inputValidation)
    .query(routes.getFollowupSubjectsStatsQ.execute),
  getFollowupDurationStats: protectedProcedure
    .input(routes.getFollowupDurationStatsQ.inputValidation)
    .query(routes.getFollowupDurationStatsQ.execute),
  getFollowupMeanTimeStats: protectedProcedure
    .input(routes.getFollowupMeanTimeStatsQ.inputValidation)
    .query(routes.getFollowupMeanTimeStatsQ.execute),
  getHelpRequestSubjectStats: protectedProcedure
    .input(routes.getHelpRequestSubjectsStatsQ.inputValidation)
    .query(routes.getHelpRequestSubjectsStatsQ.execute),
  getMinistereStructure: protectedProcedure
    .input(routes.getMinistereStructureStatsQ.inputValidation)
    .query(routes.getMinistereStructureStatsQ.execute),
  getMinistereCategorie: protectedProcedure
    .input(routes.getMinistereCategorieStatsQ.inputValidation)
    .query(routes.getMinistereCategorieStatsQ.execute),
  getMinistereInterpellation: protectedProcedure
    .input(routes.getMinistereInterpellationStatsQ.inputValidation)
    .query(routes.getMinistereInterpellationStatsQ.execute),
  getMinistereDepartementServiceAc: protectedProcedure
    .input(routes.getMinistereDepartementServiceAcStatsQ.inputValidation)
    .query(routes.getMinistereDepartementServiceAcStatsQ.execute),
  exportBeneficiaryStats: protectedProcedure
    .input(routes.exportBeneficiaryStatsQuery.inputValidation)
    .mutation(routes.exportBeneficiaryStatsQuery.execute),
  exportHelpRequestStats: protectedProcedure
    .input(routes.exportHelpRequestStatsQuery.inputValidation)
    .mutation(routes.exportHelpRequestStatsQuery.execute),
  exportFollowupStats: protectedProcedure
    .input(routes.exportFollowupStatsQuery.inputValidation)
    .mutation(routes.exportFollowupStatsQuery.execute),
  getWorkshopNameStats: protectedProcedure
    .input(routes.getWorkshopNameStatsQuery.inputValidation)
    .query(routes.getWorkshopNameStatsQuery.execute),
  getWorkshopPartnerStats: protectedProcedure
    .input(routes.getWorkshopPartnerStatsQuery.inputValidation)
    .query(routes.getWorkshopPartnerStatsQuery.execute),
  getWorkshopAttendeeGenderStats: protectedProcedure
    .input(routes.getWorkshopAttendeeGenderStatsQuery.inputValidation)
    .query(routes.getWorkshopAttendeeGenderStatsQuery.execute),
  getWorkshopAttendanceStats: protectedProcedure
    .input(routes.getWorkshopAttendanceStatsQuery.inputValidation)
    .query(routes.getWorkshopAttendanceStatsQuery.execute),
  getWorkshopCountStats: protectedProcedure
    .input(routes.getWorkshopCountStatsQuery.inputValidation)
    .query(routes.getWorkshopCountStatsQuery.execute),
  getWorkshopAttendeeCountStats: protectedProcedure
    .input(routes.getWorkshopAttendeeCountStatsQuery.inputValidation)
    .query(routes.getWorkshopAttendeeCountStatsQuery.execute),
  getWorkshopAttendeeAgeStats: protectedProcedure
    .input(routes.getWorkshopAttendeeAgeStatsQuery.inputValidation)
    .query(routes.getWorkshopAttendeeAgeStatsQuery.execute),
  getWorkshopAttendeeCityStats: protectedProcedure
    .input(routes.getWorkshopAttendeeCityStatsQuery.inputValidation)
    .query(routes.getWorkshopAttendeeCityStatsQuery.execute),
  exportWorkshopStats: protectedProcedure
    .input(routes.exportWorkshopStatsQuery.inputValidation)
    .mutation(routes.exportWorkshopStatsQuery.execute),
  getSupportProgramCountStats: protectedProcedure
    .input(routes.getSupportProgramCountStatsQuery.inputValidation)
    .query(routes.getSupportProgramCountStatsQuery.execute),
  getSupportProgramMeanDurationStats: protectedProcedure
    .input(routes.getSupportProgramMeanDurationStatsQuery.inputValidation)
    .query(routes.getSupportProgramMeanDurationStatsQuery.execute),
  getSupportProgramOutcomeStats: protectedProcedure
    .input(routes.getSupportProgramOutcomeStatsQuery.inputValidation)
    .query(routes.getSupportProgramOutcomeStatsQuery.execute),
  getSupportProgramPartnerStats: protectedProcedure
    .input(routes.getSupportProgramPartnerStatsQuery.inputValidation)
    .query(routes.getSupportProgramPartnerStatsQuery.execute),
  getSupportProgramEntriesExitsStats: protectedProcedure
    .input(routes.getSupportProgramEntriesExitsStatsQuery.inputValidation)
    .query(routes.getSupportProgramEntriesExitsStatsQuery.execute),
  getSupportProgramNameStats: protectedProcedure
    .input(routes.getSupportProgramNameStatsQuery.inputValidation)
    .query(routes.getSupportProgramNameStatsQuery.execute),
  getSupportProgramExitReasonStats: protectedProcedure
    .input(routes.getSupportProgramExitReasonStatsQuery.inputValidation)
    .query(routes.getSupportProgramExitReasonStatsQuery.execute),
  exportSupportProgramStats: protectedProcedure
    .input(routes.exportSupportProgramStatsQuery.inputValidation)
    .mutation(routes.exportSupportProgramStatsQuery.execute)
})
