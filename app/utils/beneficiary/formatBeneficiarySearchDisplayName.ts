export function formatBeneficiarySearchDisplayName(
  beneficiary: Record<string, unknown> & {
    firstName?: string | null
    usualName?: string | null
    birthName?: string | null
  }
): string {
  const { firstName, usualName, birthName } = beneficiary
  if (usualName && birthName) {
    return `${usualName.toUpperCase()} (${birthName.toUpperCase()}) ${firstName ?? ''}`
  }
  if (!usualName && birthName) {
    return `${birthName.toUpperCase()} ${firstName ?? ''}`
  }
  if (usualName && !birthName) {
    return `${usualName.toUpperCase()} ${firstName ?? ''}`
  }
  return firstName ?? ''
}
