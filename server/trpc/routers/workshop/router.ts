import { workshopRoutes as routes } from '~~/server/route'
import { protectedProcedure, router } from '~~/server/trpc'

export const workshopRouter = router({
  createWorkshop: protectedProcedure
    .input(routes.createWorkshop.inputValidation)
    .mutation(routes.createWorkshop.execute),
  duplicateWorkshop: protectedProcedure
    .input(routes.duplicateWorkshop.inputValidation)
    .mutation(routes.duplicateWorkshop.execute),
  getPage: protectedProcedure
    .input(routes.getPageQuery.inputValidation)
    .query(routes.getPageQuery.execute),
  getWorkshopNameList: protectedProcedure
    .input(routes.getWorkshopNameList.inputValidation)
    .query(routes.getWorkshopNameList.execute),
  getOne: protectedProcedure
    .input(routes.getQuery.inputValidation)
    .query(routes.getQuery.execute),
  delete: protectedProcedure
    .input(routes.deleteWorkshop.inputValidation)
    .mutation(routes.deleteWorkshop.execute),
  updateWorkshop: protectedProcedure
    .input(routes.updateWorkshop.inputValidation)
    .mutation(routes.updateWorkshop.execute),
  createBeneficiaryAttendee: protectedProcedure
    .input(routes.createBeneficiaryAttendee.inputValidation)
    .mutation(routes.createBeneficiaryAttendee.execute),
  createExternalAttendee: protectedProcedure
    .input(routes.createExternalAttendee.inputValidation)
    .mutation(routes.createExternalAttendee.execute),
  updateAttendeeListType: protectedProcedure
    .input(routes.updateAttendeeListType.inputValidation)
    .mutation(routes.updateAttendeeListType.execute),
  deleteAttendee: protectedProcedure
    .input(routes.deleteAttendee.inputValidation)
    .mutation(routes.deleteAttendee.execute),
  updateAttendeeAttendance: protectedProcedure
    .input(routes.updateAttendeeAttendance.inputValidation)
    .mutation(routes.updateAttendeeAttendance.execute),
  getExportedAttendance: protectedProcedure
    .input(routes.getExportedAttendance.inputValidation)
    .query(routes.getExportedAttendance.execute),
  updateAttendee: protectedProcedure
    .input(routes.updateAttendee.inputValidation)
    .mutation(routes.updateAttendee.execute)
})
