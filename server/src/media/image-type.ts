export type ImageType = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * What an upload really is, read from its first bytes rather than from the
 * type the browser claimed. Anything that is not one of the four photo
 * formats (SVG and HTML above all, which could carry script) is refused.
 */
export function sniffImageType(bytes: Uint8Array): ImageType | null {
  const starts = (...signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  if (bytes.length >= 3 && starts(0xff, 0xd8, 0xff)) {
    return 'image/jpeg';
  }
  if (bytes.length >= 8 && starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) {
    return 'image/png';
  }
  if (bytes.length >= 12 && starts(0x52, 0x49, 0x46, 0x46) && ascii(bytes, 8, 4) === 'WEBP') {
    return 'image/webp';
  }
  if (bytes.length >= 6 && (ascii(bytes, 0, 6) === 'GIF87a' || ascii(bytes, 0, 6) === 'GIF89a')) {
    return 'image/gif';
  }
  return null;
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}
