import { findSocialSupportSubject } from './findSocialSupportSubject.query'
import { getActiveSocialSupportSubjects } from './getActiveSocialSupportSubjects.query'
import { getActiveOrUsedSocialSupportSubjects } from './getActiveOrUsedSocialSupportSubjects.query'

import { getSocialSupportSubjects } from './getSocialSupportSubjects.query'
import { getStructure } from './getStructure.query'
import { makeInactiveSocialSupportSubject } from './makeInactiveSocialSupportSubject.mutation'
import { submitStructureTypeSurvey } from './submitStructureTypeSurvey.mutation'
import { updateStructureInfo } from './updateStructureInfo.mutation'
import { updateStructureSubject } from './updateSocialSupportSubject.mutation'
import { updateSocialSupportSubjects } from './updateSocialSupportSubjects.mutation'

export const structureRoutes = {
  findSocialSupportSubject,
  getActiveSocialSupportSubjects,
  getActiveOrUsedSocialSupportSubjects,
  getSocialSupportSubjects,
  getStructure,
  makeInactiveSocialSupportSubject,
  submitStructureTypeSurvey,
  updateStructureInfo,
  updateStructureSubject,
  updateSocialSupportSubjects
}
