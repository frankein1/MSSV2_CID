import { calculateAge } from './calculateAge'
import { formatDate } from '../formatDate'

export function formatBeneficiaryBirthInfo(info: {
  birthDate?: Date | null
  birthPlace?: string | null
}) {
  if (!info.birthDate && !info.birthPlace) {
    return ''
  }
  const res = ['Né(e)']
  if (info.birthDate) {
    res.push('le')
    res.push(formatDate(info.birthDate))
    const age = calculateAge(info.birthDate)
    res.push(`(${age} an${age > 1 ? 's' : ''})`)
  }
  if (info.birthPlace) {
    res.push('à')
    res.push(info.birthPlace)
  }
  return res.join(' ')
}
