/**
 * The frame every university email is drawn in. Table-based and inline-styled
 * because that is what Outlook, Gmail and phone mail apps render reliably.
 * Every interpolated value passes through `esc`.
 */
const NAVY = '#0a3254';
const INK = '#102a43';
const MUTED = '#4a647d';
const GOLD = '#b8860b';
const RULE = '#e0ebf6';
const PAPER = '#f6f8fb';

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Plain text with line breaks preserved, safe for HTML. */
export function escMultiline(value: string): string {
  return esc(value).replace(/\n/g, '<br />');
}

export interface EmailParts {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

export interface LayoutInput {
  readonly preheader: string;
  readonly eyebrow: string;
  readonly heading: string;
  /** Pre-escaped HTML for the body. */
  readonly bodyHtml: string;
  readonly action?: { readonly label: string; readonly url: string };
  readonly footnote?: string;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:${INK};">${text}</p>`;
}

/** A two-column list of facts: reference, office, date. */
export function factTable(rows: ReadonlyArray<readonly [string, string]>): string {
  const cells = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${RULE};font-size:13px;color:${MUTED};width:38%;vertical-align:top;">${esc(label)}</td>
          <td style="padding:10px 0;border-bottom:1px solid ${RULE};font-size:14px;color:${INK};font-weight:600;vertical-align:top;">${esc(value)}</td>
        </tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 24px;">${cells}</table>`;
}

/** A quoted block, used to echo back what someone wrote to us. */
export function quote(text: string): string {
  return `<div style="margin:0 0 24px;padding:16px 18px;border-left:3px solid ${GOLD};background:${PAPER};font-size:14px;line-height:1.6;color:${INK};">${escMultiline(text)}</div>`;
}

export function layout(input: LayoutInput): string {
  const action = input.action
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;">
        <tr><td style="border-radius:999px;background:${NAVY};">
          <a href="${esc(input.action.url)}" style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:999px;">${esc(input.action.label)}</a>
        </td></tr>
      </table>`
    : '';
  const footnote = input.footnote
    ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:${MUTED};">${input.footnote}</p>`
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>${esc(input.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};font-family:Segoe UI,Helvetica,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(input.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${RULE};border-radius:16px;">
      <tr><td style="padding:28px 32px 0;">
        <div style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:${GOLD};font-weight:700;">Sankofa Alkebulan University</div>
        <div style="height:1px;background:${RULE};margin:18px 0 24px;"></div>
        <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};font-weight:600;margin-bottom:8px;">${esc(input.eyebrow)}</div>
        <h1 style="margin:0 0 20px;font-size:24px;line-height:1.25;color:${NAVY};font-weight:700;">${esc(input.heading)}</h1>
        ${input.bodyHtml}
        ${action}
      </td></tr>
      <tr><td style="padding:0 32px 28px;">
        ${footnote}
        <div style="height:1px;background:${RULE};margin:24px 0 16px;"></div>
        <p style="margin:0;font-size:12px;line-height:1.6;color:${MUTED};">Return &middot; Restore &middot; Reimagine</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}
