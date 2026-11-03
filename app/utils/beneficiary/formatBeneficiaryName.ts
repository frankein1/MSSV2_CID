import { beneficiaryTitleKeys } from '~~/client/options'

export function formatBeneficiaryName(names: {
  firstName?: string | null
  usualName?: string | null
  title?: string | null
}) {
  return [
    beneficiaryTitleKeys.value(names.title),
    names.firstName,
    names.usualName
  ]
    .filter(Boolean)
    .join(' ')
}
