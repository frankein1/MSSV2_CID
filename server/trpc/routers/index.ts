import type { TRPCClientError } from '@trpc/client'
import type { inferRouterOutputs } from '@trpc/server'
import { beneficiaryRouter } from './beneficiary/router'
import { budgetRouter } from './budgetRouter'
import { configRouter } from './configRouter'
import { followupRouter } from './followup/router'
import { statRouter } from './stat'
import { userRouter } from './userRouter'
import { structureRouter } from './structureRouter'
import { helpRequestRouter } from './helpRequest/router'
import { fileInstructionRouter } from './fileInstruction/router'
import {
  notificationRouter,
  archiveNotificationRouter
} from './notification/router'
import { adminRouter } from './admin/router'
import { documentRouter } from './documentRouter'
import { commentRouter } from './commentRouter'
import { socialSupportRouter } from './socialSupport/router'
import { housingHelpRequestRouter } from './housingHelpRequest/router'
import { partnerRouter } from './partnerRouter/router'
import { dataInclusionRouter } from './dataInclusionRouter'
import { fileRouter } from './familyFile/router'
import { supportProgramRouter } from './supportProgram/router'
import { rdvspRouter } from './rdvspRouter'
import { router } from '~~/server/trpc'
import { workshopRouter } from './workshop/router'
import { ministerRouter } from './minister/router'
import { redirectionRouter } from './redirection/router'
import { dataEducationRouter } from './dataEducationRouter'
import { crossStructureStatRouter } from './crossStructureStat/router'

export const appRouter = router({
  admin: adminRouter,
  beneficiary: beneficiaryRouter,
  budget: budgetRouter,
  crossStructureStat: crossStructureStatRouter,
  dataEducation: dataEducationRouter,
  dataInclusion: dataInclusionRouter,
  notification: notificationRouter,
  archiveNotification: archiveNotificationRouter,
  config: configRouter,
  partner: partnerRouter,
  followup: followupRouter,
  stat: statRouter,
  structure: structureRouter,
  user: userRouter,
  helpRequest: helpRequestRouter,
  fileInstruction: fileInstructionRouter,
  documents: documentRouter,
  comment: commentRouter,
  socialSupport: socialSupportRouter,
  housingHelpRequest: housingHelpRequestRouter,
  file: fileRouter,
  supportProgram: supportProgramRouter,
  rdvsp: rdvspRouter,
  workshop: workshopRouter,
  minister: ministerRouter,
  redirection: redirectionRouter
})
// export type definition of API
export type AppRouter = typeof appRouter

export type RouterOutput = inferRouterOutputs<AppRouter>
export type ErrorOutput = TRPCClientError<AppRouter>

export * from '~~/server/trpc/routers/housingHelpRequest'
export * from '~~/server/trpc/routers/notification'
export * from '~~/server/trpc/routers/beneficiary'
export * from '~~/server/trpc/routers/followup'
export * from '~~/server/trpc/routers/fileInstruction'
