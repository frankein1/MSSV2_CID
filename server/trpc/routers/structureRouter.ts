import { protectedProcedure, router } from '~~/server/trpc'
import { structureRoutes } from '~~/server/route/structure'

export const structureRouter = router({
  getStructure: protectedProcedure
    .input(structureRoutes.getStructure.inputValidation)
    .query(structureRoutes.getStructure.execute),
  updateStructureInfo: protectedProcedure
    .input(structureRoutes.updateStructureInfo.inputValidation)
    .mutation(structureRoutes.updateStructureInfo.execute),
  submitStructureTypeSurvey: protectedProcedure
    .input(structureRoutes.submitStructureTypeSurvey.inputValidation)
    .mutation(structureRoutes.submitStructureTypeSurvey.execute),
  findSocialSupportSubject: protectedProcedure
    .input(structureRoutes.findSocialSupportSubject.inputValidation)
    .query(structureRoutes.findSocialSupportSubject.execute),
  updateSocialSupportSubjects: protectedProcedure
    .input(structureRoutes.updateSocialSupportSubjects.inputValidation)
    .mutation(structureRoutes.updateSocialSupportSubjects.execute),
  getSocialSupportSubjects: protectedProcedure
    .input(structureRoutes.getSocialSupportSubjects.inputValidation)
    .query(structureRoutes.getSocialSupportSubjects.execute),
  makeInactiveSocialSupportSubject: protectedProcedure
    .input(structureRoutes.makeInactiveSocialSupportSubject.inputValidation)
    .mutation(structureRoutes.makeInactiveSocialSupportSubject.execute),
  updateSocialSupportSubject: protectedProcedure
    .input(structureRoutes.updateStructureSubject.inputValidation)
    .mutation(structureRoutes.updateStructureSubject.execute),
  getActiveSocialSupportSubjects: protectedProcedure
    .input(structureRoutes.getActiveSocialSupportSubjects.inputValidation)
    .query(structureRoutes.getActiveSocialSupportSubjects.execute),
  getActiveOrUsedSocialSupportSubjects: protectedProcedure
    .input(structureRoutes.getActiveOrUsedSocialSupportSubjects.inputValidation)
    .query(structureRoutes.getActiveOrUsedSocialSupportSubjects.execute)
})
