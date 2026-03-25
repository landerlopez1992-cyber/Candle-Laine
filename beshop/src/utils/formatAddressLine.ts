import type {UserAddressRow} from '../types/address';

/** Single-line summary for list views (no geo library — keeps main bundle small). */
export function formatAddressLine(row: Pick<
  UserAddressRow,
  'country_iso2' | 'state_code' | 'municipality' | 'street' | 'zip'
>): string {
  return [row.street, row.municipality, row.state_code, row.zip, row.country_iso2]
    .map((p) => (p ?? '').trim())
    .filter((p) => p.length > 0)
    .join(', ');
}
