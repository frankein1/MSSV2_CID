export function hasAddressInformations(beneficiary: {
  accommodationMode?: unknown
  accommodationAdditionalInformation?: string | null
  accommodationZone?: unknown
  street?: string | null
  zipcode?: string | null
  city?: string | null
  region?: string | null
  department?: string | null
  qpv?: boolean | null
}) {
  return (
    beneficiary.accommodationMode ||
    beneficiary.accommodationAdditionalInformation ||
    beneficiary.accommodationZone ||
    beneficiary.street ||
    beneficiary.zipcode ||
    beneficiary.city ||
    beneficiary.region ||
    beneficiary.department ||
    beneficiary.qpv
  )
}
