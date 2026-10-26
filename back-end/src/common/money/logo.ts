import { BadRequestException } from '@nestjs/common';

export const MAX_BILL_LOGO_BYTES = 131072;

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

export type ParsedLogo = {
  mediaType: string;
  bytes: Buffer;
};

export function parseLogoDataUrl(dataUrl: string): ParsedLogo {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(
    dataUrl.trim(),
  );
  if (!match) {
    throw new BadRequestException('Logo must be a base64 data URL');
  }

  const mediaType = match[1].toLowerCase();
  if (!ALLOWED_TYPES.has(mediaType)) {
    throw new BadRequestException('Logo must be JPEG, PNG, WebP, or GIF');
  }

  const bytes = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (bytes.length < 1 || bytes.length > MAX_BILL_LOGO_BYTES) {
    throw new BadRequestException('Logo must be between 1 byte and 128 KB');
  }

  return { mediaType, bytes };
}

export async function upsertBillLogo(
  query: (text: string, values?: unknown[]) => Promise<unknown>,
  billId: string,
  dataUrl: string,
): Promise<void> {
  const logo = parseLogoDataUrl(dataUrl);
  await query(
    `INSERT INTO bill_logos (bill_id, media_type, bytes)
     VALUES ($1, $2, $3)
     ON CONFLICT (bill_id) DO UPDATE
        SET media_type = EXCLUDED.media_type,
            bytes = EXCLUDED.bytes`,
    [billId, logo.mediaType, logo.bytes],
  );
}
