import { z } from 'zod'
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const imageFileSchema = z.object({
  type: z.enum(['image/jpeg', 'image/png', 'image/webp'], { error: 'Choose a JPEG, PNG, or WebP image.' }),
  size: z.number().int().positive('The image is empty.').max(MAX_IMAGE_BYTES, 'Images must be 4 MB or smaller.'),
})
