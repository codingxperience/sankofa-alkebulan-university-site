// The bundled copy (scripts/bundle-vendor.mjs): the published package cannot be
// loaded on Vercel, because its HTML parser is an ES module.
import sanitizeHtml from '#sanitize-html';

/**
 * Article bodies are HTML written in the console or imported from the old
 * journal. Before storage, everything outside a small editorial vocabulary is
 * removed: no scripts, no inline styles, no event handlers, no unknown
 * attributes. Links to other sites open safely in a new tab.
 */
export function cleanArticleHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'hr', 'h2', 'h3', 'h4', 'blockquote', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'u', 's', 'sup', 'sub',
      'a', 'img', 'figure', 'figcaption', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'cite', 'abbr',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      abbr: ['title'],
      th: ['scope', 'colspan', 'rowspan'],
      td: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowedSchemesByTag: { img: ['https'] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const external = /^https?:\/\//i.test(attribs.href ?? '');
        return {
          tagName,
          attribs: external ? { ...attribs, target: '_blank', rel: 'noopener noreferrer' } : { href: attribs.href ?? '', ...(attribs.title ? { title: attribs.title } : {}) },
        };
      },
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, src: normaliseAssetPath(attribs.src ?? ''), loading: 'lazy' } }),
      h1: 'h2',
    },
    exclusiveFilter: (frame) => frame.tag === 'p' && !frame.text.trim() && !frame.mediaChildren.length,
  }).trim();
}

/** Site-relative asset paths become root-relative, so they resolve from any article URL. */
export function normaliseAssetPath(src: string): string {
  const trimmed = src.trim();
  if (!trimmed || /^https:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
    return trimmed;
  }
  return `/${trimmed.replace(/^\.\//, '')}`;
}

/** Where one block of text ends and the next begins; removing these tags must leave a space behind. */
const BLOCK_BOUNDARY = /<(?:br\s*\/?|\/(?:p|h[1-6]|li|blockquote|figcaption|div|td|th|tr|pre))>/gi;

export function plainText(html: string): string {
  return sanitizeHtml(html.replace(BLOCK_BOUNDARY, '$& '), { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
}

export function readingMinutes(html: string): number {
  const words = plainText(html).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
