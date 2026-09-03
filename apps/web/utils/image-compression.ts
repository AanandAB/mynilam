/**
 * Client-side image compression and validation.
 *
 * Limits:
 *  - Max file size: 5 MB (after compression)
 *  - Max dimensions: 1920 px on the longest side
 *  - Max images: 10
 *  - Accepted types: image/jpeg, image/png, image/webp
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const MAX_DIMENSION = 1920
const MAX_IMAGES = 10
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const JPEG_QUALITY = 0.82

export interface ImageValidationError {
  file: string
  message: string
}

export interface CompressionResult {
  file: File
  originalSize: number
  compressedSize: number
}

/**
 * Validate a list of image files before compression.
 * Returns an array of errors (empty = all valid).
 */
export function validateImages(files: File[]): ImageValidationError[] {
  const errors: ImageValidationError[] = []

  if (files.length > MAX_IMAGES) {
    errors.push({
      file: 'batch',
      message: `Maximum ${MAX_IMAGES} images allowed. You selected ${files.length}.`,
    })
  }

  for (const file of files) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      errors.push({
        file: file.name,
        message: `"${file.name}" is not a supported image type. Use JPEG, PNG, or WebP.`,
      })
    }
    if (file.size > MAX_FILE_SIZE * 2) {
      // Allow slightly larger originals — compression will shrink them
      errors.push({
        file: file.name,
        message: `"${file.name}" is too large (${formatBytes(file.size)}). Maximum is 10 MB.`,
      })
    }
  }

  return errors
}

/**
 * Compress a single image file:
 *  1. Resize to MAX_DIMENSION on the longest side (preserving aspect ratio)
 *  2. Re-encode as JPEG at JPEG_QUALITY
 *  3. Returns the compressed File if smaller, or the original if compression didn't help
 */
export function compressImage(file: File): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error(`"${file.name}" is not an image`))
      return
    }

    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Resize if either dimension exceeds MAX_DIMENSION
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        // Fallback: return original if canvas not supported
        resolve({ file, originalSize: file.size, compressedSize: file.size })
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({ file, originalSize: file.size, compressedSize: file.size })
            return
          }

          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })

          // Only use compressed version if it's actually smaller
          if (compressedFile.size < file.size) {
            resolve({
              file: compressedFile,
              originalSize: file.size,
              compressedSize: compressedFile.size,
            })
          } else {
            resolve({ file, originalSize: file.size, compressedSize: file.size })
          }
        },
        'image/jpeg',
        JPEG_QUALITY
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Failed to load "${file.name}" for compression`))
    }

    img.src = url
  })
}

/**
 * Compress multiple images in parallel (with concurrency limit).
 */
export async function compressImages(
  files: File[],
  onProgress?: (completed: number, total: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = []
  // Process 3 at a time to avoid memory pressure
  const concurrency = 3

  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(compressImage))
    results.push(...batchResults)
    onProgress?.(Math.min(i + concurrency, files.length), files.length)
  }

  return results
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatBytesExport(bytes: number): string {
  return formatBytes(bytes)
}

export { MAX_FILE_SIZE, MAX_IMAGES, ACCEPTED_TYPES }
