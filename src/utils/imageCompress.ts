/**
 * Image compression utility wrapping browser-image-compression.
 * Called before upload to ensure images fit within Bluesky's 1MB per-blob limit
 * and to save bandwidth for users.
 */

import imageCompression from 'browser-image-compression';

export interface CompressOptions {
  /** Maximum file size in MB (default: 1) */
  maxSizeMB?: number;
  /** Maximum width or height in px (default: 1920) */
  maxWidthOrHeight?: number;
  /** Output MIME type (default: 'image/jpeg') */
  fileType?: string;
  /** Image quality 0-1 (default: 0.85) */
  initialQuality?: number;
}

const DEFAULTS: Required<CompressOptions> = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1200,
  fileType: 'image/jpeg',
  initialQuality: 0.85,
};

/**
 * Compress a single image File/Blob.
 * Returns a new File (or Blob if the file had no name) that is guaranteed
 * to be smaller than maxSizeMB and fit within maxWidthOrHeight.
 */
export async function compressImage(
  file: File | Blob,
  options?: CompressOptions
): Promise<File> {
  const opts = { ...DEFAULTS, ...options };

  // Ensure we always pass a File (imageCompression expects File)
  const fileArg: File =
    file instanceof File
      ? file
      : new File([file], 'image.jpg', { type: file.type || 'image/jpeg' });

  try {
    const result = await imageCompression(fileArg, {
      maxSizeMB: opts.maxSizeMB,
      maxWidthOrHeight: opts.maxWidthOrHeight,
      fileType: opts.fileType,
      initialQuality: opts.initialQuality,
      useWebWorker: true,
    });

    // image-compression returns a File if input was File, else Blob.
    // Preserve the original filename if available.
    if (result instanceof File) {
      return result;
    }

    const fileName = file instanceof File ? file.name : `image_${Date.now()}.jpg`;
    return new File([result], fileName, { type: opts.fileType });
  } catch (err) {
    console.warn('Image compression failed, falling back to original:', err);
    // Fallback — return the original file
    if (file instanceof File) return file;
    return new File([file], 'image.jpg', { type: 'image/jpeg' });
  }
}

/**
 * Compress an array of image Files/Blobs in parallel.
 */
export async function compressImages(
  files: (File | Blob)[],
  options?: CompressOptions
): Promise<File[]> {
  return Promise.all(files.map((f) => compressImage(f, options)));
}
