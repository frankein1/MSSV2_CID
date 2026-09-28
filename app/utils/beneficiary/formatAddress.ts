export function formatAddress(address: {
  street?: string | null
  zipcode?: string | null
  city?: string | null
  region?: string | null
}) {
  return [address.street, address.zipcode, address.city, address.region]
    .filter(Boolean)
    .join(', ')
}
