/**
 * Country names for form suggestions, built from the ISO 3166-1 alpha-2 codes
 * and the browser's own localised region names, so spelling is never ours to
 * get wrong. African states are listed first; the rest follow alphabetically.
 */
const AFRICA = [
  'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CV', 'CM', 'CF', 'TD', 'KM', 'CG', 'CD', 'CI', 'DJ', 'EG', 'GQ', 'ER', 'SZ', 'ET',
  'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW',
  'ST', 'SN', 'SC', 'SL', 'SO', 'ZA', 'SS', 'SD', 'TZ', 'TG', 'TN', 'UG', 'EH', 'ZM', 'ZW',
];

const REST_OF_WORLD = [
  'AF', 'AL', 'AD', 'AG', 'AR', 'AM', 'AU', 'AT', 'AZ', 'BS', 'BH', 'BD', 'BB', 'BY', 'BE', 'BZ', 'BT', 'BO', 'BA', 'BR',
  'BN', 'BG', 'KH', 'CA', 'CL', 'CN', 'CO', 'CR', 'HR', 'CU', 'CY', 'CZ', 'DK', 'DM', 'DO', 'EC', 'SV', 'EE', 'FJ', 'FI',
  'FR', 'GE', 'DE', 'GR', 'GD', 'GT', 'GY', 'HT', 'HN', 'HK', 'HU', 'IS', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IL', 'IT', 'JM',
  'JP', 'JO', 'KZ', 'KI', 'KW', 'KG', 'LA', 'LV', 'LB', 'LI', 'LT', 'LU', 'MY', 'MV', 'MT', 'MH', 'MX', 'FM', 'MD', 'MC',
  'MN', 'ME', 'MM', 'NR', 'NP', 'NL', 'NZ', 'NI', 'KP', 'MK', 'NO', 'OM', 'PK', 'PW', 'PS', 'PA', 'PG', 'PY', 'PE', 'PH',
  'PL', 'PT', 'PR', 'QA', 'RO', 'RU', 'KN', 'LC', 'VC', 'WS', 'SM', 'SA', 'RS', 'SG', 'SK', 'SI', 'SB', 'KR', 'ES', 'LK',
  'SR', 'SE', 'CH', 'SY', 'TW', 'TJ', 'TH', 'TL', 'TO', 'TT', 'TR', 'TM', 'TV', 'UA', 'AE', 'GB', 'US', 'UY', 'UZ', 'VU',
  'VA', 'VE', 'VN', 'YE',
];

let cached: string[] | undefined;

export function countryNames(): string[] {
  if (cached) {
    return cached;
  }
  let display: Intl.DisplayNames | undefined;
  try {
    display = new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    display = undefined;
  }
  const name = (code: string) => display?.of(code) ?? code;
  const african = AFRICA.map(name).sort((a, b) => a.localeCompare(b));
  const others = REST_OF_WORLD.map(name).sort((a, b) => a.localeCompare(b));
  cached = [...african, ...others];
  return cached;
}
