/**
 * The university admits students in January, May and September (the intakes
 * the admissions form has always offered). Applicants choose from the next
 * few, computed from today's date so the list never goes stale.
 */
const INTAKE_MONTHS = [
  { name: 'January', index: 0 },
  { name: 'May', index: 4 },
  { name: 'September', index: 8 },
] as const;

export function upcomingIntakes(now = new Date(), count = 3): string[] {
  const out: string[] = [];
  let year = now.getUTCFullYear();
  while (out.length < count) {
    for (const month of INTAKE_MONTHS) {
      // An intake stays open for applications until its month begins.
      if (Date.UTC(year, month.index, 1) > now.getTime() && out.length < count) {
        out.push(`${month.name} ${year}`);
      }
    }
    year += 1;
  }
  return out;
}
