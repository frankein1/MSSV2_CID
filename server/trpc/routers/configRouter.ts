import { protectedProcedure, router } from '~~/server/trpc'
import {
  getAgentsQuery,
  getBeneficiariesCitiesQuery,
  getBeneficiariesEmployersQuery,
  getBeneficiariesSchoolsQuery,
  getExaminationDatesQuery,
  getMultiStructureListQuery
} from '~~/server/route/config'

export const configRouter = router({
  getAgents: protectedProcedure
    .input(getAgentsQuery.inputValidation)
    .query(getAgentsQuery.execute),
  getBeneficiariesCities: protectedProcedure
    .input(getBeneficiariesCitiesQuery.inputValidation)
    .query(getBeneficiariesCitiesQuery.execute),
  getBeneficiariesEmployers: protectedProcedure
    .input(getBeneficiariesEmployersQuery.inputValidation)
    .query(getBeneficiariesEmployersQuery.execute),
  getBeneficiariesSchools: protectedProcedure
    .input(getBeneficiariesSchoolsQuery.inputValidation)
    .query(getBeneficiariesSchoolsQuery.execute),
  getExaminationDates: protectedProcedure
    .input(getExaminationDatesQuery.inputValidation)
    .query(getExaminationDatesQuery.execute),
  getMultiStructureList: protectedProcedure
    .input(getMultiStructureListQuery.inputValidation)
    .query(getMultiStructureListQuery.execute)
})
