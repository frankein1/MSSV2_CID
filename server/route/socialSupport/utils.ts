import {
  getAppContextPermissions,
  getSocialSupportPermissions
} from '~~/server/security'
import type { FamilyFileSecurityTarget } from '~~/server/services'
import {
  filterComments,
  filterDocuments,
  filterFileInstruction,
  filterFollowup,
  filterHelpRequest,
  filterHousingHelpRequest,
  filterSocialSupport
} from '~~/server/services/helper'
import type { ProtectedAppContext } from '~~/server/trpc'
import type { SocialSupportDetail } from './getDetails.query'

export function formatSocialSupportDetail(
  socialSupport: SocialSupportDetail,
  ctx: ProtectedAppContext,
  familyFile: FamilyFileSecurityTarget
) {
  const { _count } = socialSupport

  const socialSupportPermissions = getSocialSupportPermissions({
    ctx,
    familyFile,
    socialSupport
  })

  const appPermissions = getAppContextPermissions(ctx)

  const { followup, fileInstruction, minister, documents, comments } =
    socialSupport

  const conditions = {
    minister: appPermissions.module.ministere,
    details: socialSupportPermissions.get.details,
    privateSynthesis: socialSupportPermissions.get.privateSynthesis
  }

  const { familyFile: ff, ...ss } = socialSupport

  const filteredSocialSupport = filterSocialSupport({
    socialSupport: {
      familyFile: { id: ff.id, structureId: ff.structureId },
      ...ss
    },
    conditions
  })

  const filteredFileInstruction = fileInstruction
    ? filterFileInstruction({
        fileInstruction,
        conditions
      })
    : null

  const helpRequest = fileInstruction?.helpRequest
  const housingHelpRequest = fileInstruction?.housingHelpRequest

  const filteredHousingHelpRequest = housingHelpRequest
    ? filterHousingHelpRequest({
        housingHelpRequest,
        conditions
      })
    : null
  const filteredHelpRequest = helpRequest
    ? filterHelpRequest({
        helpRequest,
        conditions
      })
    : null

  const filteredFollowup = followup
    ? filterFollowup({
        followup,
        conditions
      })
    : null

  const documentItems = filterDocuments({
    documents,
    conditions,
    ctx,
    familyFile
  })

  // const commentItems = filterComments({ comments, ctx })

  return {
    data: {
      ...filteredSocialSupport,
      minister: minister,
      // comments: commentItems,
      documents: documentItems,
      hasUnreadNotifications: !!_count.notifications,
      followup: filteredFollowup,
      fileInstruction: {
        ...filteredFileInstruction,
        helpRequest: filteredHelpRequest,
        housingHelpRequest: filteredHousingHelpRequest
      }
    },
    permissions: socialSupportPermissions
  }
}
