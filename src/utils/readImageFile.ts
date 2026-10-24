/** Keep logos small — stored in IndexedDB on the user's device. */
export const MAX_BILL_LOGO_BYTES = 128 * 1024

const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'])

export async function readImageAsDataUrl(
  file: File,
  options?: { maxBytes?: number },
): Promise<string> {
  const maxBytes = options?.maxBytes ?? MAX_BILL_LOGO_BYTES

  if (!allowedMime.has(file.type)) {
    throw new Error('Use a JPEG, PNG, WebP, GIF, or SVG image.')
  }
  if (file.size > maxBytes) {
    throw new Error(`Image must be ${Math.round(maxBytes / 1024)} KB or smaller.`)
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('Could not read the image.'))
    }
    reader.onerror = () => reject(new Error('Could not read the image.'))
    reader.readAsDataURL(file)
  })
}
