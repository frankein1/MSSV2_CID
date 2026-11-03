type AddressFields = {
  street?: string | null
  zipcode?: string | null
  city?: string | null
  region?: string | null
}

function hasAddress(beneficiary: AddressFields) {
  return (
    beneficiary.street ||
    beneficiary.zipcode ||
    beneficiary.city ||
    beneficiary.region
  )
}

export function hasPhoneOrAddress(
  beneficiary: AddressFields & {
    noPhone?: boolean
    phone1?: string | null
    phone2?: string | null
  }
) {
  return (
    beneficiary.noPhone ||
    beneficiary.phone1 ||
    beneficiary.phone2 ||
    hasAddress(beneficiary)
  )
}

export function hasEmailOrAddressComplement(
  beneficiary: AddressFields & {
    noPhone?: boolean
    phone1?: string | null
    phone2?: string | null
    email?: string | null
    addressComplement?: string | null
  }
) {
  return (
    beneficiary.email ||
    (hasAddress(beneficiary) && beneficiary.addressComplement)
  )
}

export function hasCoordinatesInformations(
  beneficiary: AddressFields & {
    noPhone?: boolean
    phone1?: string | null
    phone2?: string | null
    email?: string | null
    addressComplement?: string | null
  }
) {
  return (
    hasPhoneOrAddress(beneficiary) || hasEmailOrAddressComplement(beneficiary)
  )
}
