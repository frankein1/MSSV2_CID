import { nameOrEmpty } from '~/utils/nameOrEmpty'

export function formatBeneficiaryDisplayName(
  beneficiary: Record<string, unknown> & {
    firstName?: string | null
    usualName?: string | null
    birthName?: string | null
  },
  lastNameFirst?: boolean
): string {
  let lastname = ''
  if (beneficiary.usualName) {
    lastname = beneficiary.usualName
  } else if (beneficiary.birthName) {
    lastname = `(${beneficiary.birthName})`
  }
  if (lastNameFirst) {
    return `${nameOrEmpty(lastname.toUpperCase())} ${nameOrEmpty(beneficiary.firstName)}`
  }
  return `${nameOrEmpty(beneficiary.firstName)} ${nameOrEmpty(lastname.toUpperCase())}`
}
