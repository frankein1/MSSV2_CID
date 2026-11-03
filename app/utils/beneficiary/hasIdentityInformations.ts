export function hasIdentityInformations(beneficiary: {
  title?: unknown
  usualName?: string | null
  firstName?: string | null
  birthDate?: Date | null
  birthPlace?: string | null
  gender?: unknown
  birthName?: string | null
  deathDate?: Date | null
  numeroPegase?: string | null
  nationality?: unknown
}) {
  return (
    beneficiary.title ||
    beneficiary.usualName ||
    beneficiary.firstName ||
    beneficiary.birthDate ||
    beneficiary.birthPlace ||
    beneficiary.gender ||
    beneficiary.birthName ||
    beneficiary.nationality ||
    beneficiary.deathDate ||
    beneficiary.numeroPegase
  )
}
