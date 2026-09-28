export const formatUserDisplayName = (user: {
  firstName?: string | null
  lastName?: string | null
}): string => {
  return `${user.firstName ?? ''} ${user.lastName?.toUpperCase() || ''}`.trim()
}
