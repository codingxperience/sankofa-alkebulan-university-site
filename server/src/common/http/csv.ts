import type { Response } from 'express';

/**
 * Spreadsheet apps execute cells that begin with these characters as
 * formulas. A visitor who types `=HYPERLINK(...)` into a form must not be able
 * to run it on a staff member's computer, so such cells are prefixed with a quote.
 */
const FORMULA_START = /^[=+\-@\t\r]/;
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

function cell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  let text = value instanceof Date ? value.toISOString() : Array.isArray(value) ? value.join('; ') : String(value);
  if (FORMULA_START.test(text)) {
    text = `'${text}`;
  }
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: readonly string[], rows: ReadonlyArray<readonly unknown[]>): string {
  // The byte-order mark makes Excel read UTF-8 correctly (names like Ngũgĩ, Wa Thiong'o).
  return BYTE_ORDER_MARK + [headers, ...rows].map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n';
}

export function sendCsv(res: Response, filename: string, csv: string): void {
  const safeName = filename.replace(/[^A-Za-z0-9._-]/g, '-');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(csv);
}
