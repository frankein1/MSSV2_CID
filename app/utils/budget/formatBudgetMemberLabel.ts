import { taxHouseHoldRelationshipKeys } from '~~/client/options'

export const formatBudgetMemberLabel = (
  income: {
    relationship?: unknown
    firstName?: string | null
    lastName?: string | null
  } & {
    beneficiary: {
      relationship?: unknown
      firstName?: string | null
      usualName?: string | null
    } | null
  }
) => {
  const beneficiary = income.beneficiary
  const names = []
  const firstName = beneficiary?.firstName || income.firstName || ''
  const lastName = beneficiary?.usualName || income.lastName || ''
  names.push(`${firstName} ${lastName}`)
  const relationship = beneficiary?.relationship || income.relationship
  if (relationship) {
    names.push(taxHouseHoldRelationshipKeys.value(relationship as string))
  }
  return `${names.join(' - ')} (${beneficiary ? 'Bénéficiaire' : 'Membre du foyer'})`
}
