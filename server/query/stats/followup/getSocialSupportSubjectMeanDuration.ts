import { FollowupDuration } from '@prisma/client'

type SocialSupport = {
  followup: {
    duration: FollowupDuration | null
  } | null
}

export const getSocialSupportSubjectMeanDuration = (
  socialSupports: SocialSupport[]
) => {
  if (socialSupports.length === 0) {
    return 0
  }
  return (
    socialSupports.reduce(
      (total, support) =>
        total + convertDurationInMinutes(support.followup?.duration || null),
      0
    ) / socialSupports.length
  )
}

export const convertDurationInMinutes = (
  duration: FollowupDuration | null
): number => {
  switch (duration) {
    case FollowupDuration.LessThanQuarter:
      return 8 // arbitrary average
    case FollowupDuration.Half:
      return 30
    case FollowupDuration.Hour:
      return 60
    case FollowupDuration.MoreThanHour:
      return 90 // arbitrary average
    case FollowupDuration.Quarter:
      return 15
    case FollowupDuration.ThreeQuarter:
      return 45
    default:
      return 0
  }
}
