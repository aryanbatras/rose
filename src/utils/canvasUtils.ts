/**
 * Canvas utility functions for the image editor.
 * Covers loading images, compositing layers, exporting to blob, cropping, EXIF handling.
 */

/**
 * Load an image from a File, Blob, or string URL into an HTMLImageElement.
 * Returns a Promise that resolves once the image is fully decoded.
 */
export function loadImage(src: string | File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.crossOrigin = 'anonymous';

    if (src instanceof File || src instanceof Blob) {
      img.src = URL.createObjectURL(src);
    } else {
      img.src = src;
    }
  });
}

/**
 * Draw an image onto a canvas, fitting it within the specified max dimensions
 * while maintaining aspect ratio (object-fit: contain equivalent).
 */
export function drawImageContained(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; width: number; height: number } {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth: number;
  let drawHeight: number;
  let drawX: number;
  let drawY: number;

  if (imgRatio > canvasRatio) {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    drawX = 0;
    drawY = (canvasHeight - drawHeight) / 2;
  } else {
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imgRatio;
    drawX = (canvasWidth - drawWidth) / 2;
    drawY = 0;
  }

  // Clear and draw
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

  return { x: drawX, y: drawY, width: drawWidth, height: drawHeight };
}

/**
 * Draw an image onto a canvas, filling the canvas (object-fit: cover equivalent).
 */
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number
): void {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = canvasWidth / canvasHeight;

  let drawWidth: number;
  let drawHeight: number;
  let drawX: number;
  let drawY: number;

  if (imgRatio > canvasRatio) {
    drawHeight = canvasHeight;
    drawWidth = canvasHeight * imgRatio;
    drawX = (canvasWidth - drawWidth) / 2;
    drawY = 0;
  } else {
    drawWidth = canvasWidth;
    drawHeight = canvasWidth / imgRatio;
    drawX = 0;
    drawY = (canvasHeight - drawHeight) / 2;
  }

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
}

/**
 * Resize canvas to a maximum dimension while preserving aspect ratio.
 * Returns a new canvas element.
 */
export function resizeCanvas(
  source: HTMLCanvasElement | HTMLImageElement,
  maxWidth: number = 2048,
  maxHeight: number = 2048
): HTMLCanvasElement {
  let width: number;
  let height: number;

  const srcWidth = source instanceof HTMLCanvasElement ? source.width : source.naturalWidth;
  const srcHeight = source instanceof HTMLCanvasElement ? source.height : source.naturalHeight;

  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight, 1);
  width = Math.round(srcWidth * ratio);
  height = Math.round(srcHeight * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source as CanvasImageSource, 0, 0, width, height);

  return canvas;
}

/**
 * Export a canvas to a Blob with quality control.
 * Defaults to JPEG at 0.9 quality (good for photo uploads).
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string = 'image/jpeg',
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      },
      type,
      quality
    );
  });
}

/**
 * Composite multiple image data operations onto a single canvas.
 * Useful for merging filtered result + stickers + text + doodles.
 */
export function createCompositeCanvas(
  width: number,
  height: number,
  layers: Array<{
    draw: (ctx: CanvasRenderingContext2D) => void;
    opacity?: number;
    blendMode?: GlobalCompositeOperation;
  }>
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  for (const layer of layers) {
    ctx.save();
    ctx.globalAlpha = layer.opacity ?? 1.0;
    ctx.globalCompositeOperation = layer.blendMode ?? 'source-over';
    layer.draw(ctx);
    ctx.restore();
  }

  return canvas;
}

/**
 * Apply a CSS filter string to an ImageData by rendering to/from a temp canvas.
 * This is faster than per-pixel for simple filters (brightness, contrast).
 */
export function applyCSSFilter(
  imageData: ImageData,
  filterString: string
): ImageData {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imageData.width;
  tempCanvas.height = imageData.height;
  const tempCtx = tempCanvas.getContext('2d')!;

  tempCtx.putImageData(imageData, 0, 0);
  tempCtx.filter = filterString;
  tempCtx.drawImage(tempCanvas, 0, 0);

  return tempCtx.getImageData(0, 0, imageData.width, imageData.height);
}

/**
 * Get EXIF orientation from a file (handles mobile photo rotation).
 * Reads the TIFF/EXIF IFD0 Orientation tag (0x0112).
 * Returns 1-8 orientation value or null if not found.
 */
export async function getEXIFOrientation(file: File): Promise<number | null> {
  try {
    const buffer = await file.slice(0, 131072).arrayBuffer();
    const view = new DataView(buffer);

    // Check for JPEG SOI marker
    if (view.getUint16(0, false) !== 0xffd8) return null;

    let offset = 2;
    while (offset < view.byteLength - 2) {
      const marker = view.getUint16(offset, false);
      offset += 2;

      // SOS (Start of Scan) — no more metadata
      if (marker === 0xffda) break;

      // APP1 marker — potential EXIF
      if (marker === 0xffe1) {
        const segmentLength = view.getUint16(offset, false);
        offset += 2;

        // Check for "Exif\0\0"
        if (
          segmentLength >= 8 &&
          view.getUint32(offset, false) === 0x45786966 && // "Exif"
          view.getUint16(offset + 4, false) === 0x0000
        ) {
          offset += 6;
          // TIFF header
          const littleEndian = view.getUint16(offset, false) === 0x4949;
          offset += 2;
          // Check TIFF magic
          if (view.getUint16(offset, littleEndian) !== 0x002a) return null;
          offset += 2;

          // IFD0 offset
          const ifd0Offset = view.getUint32(offset, littleEndian);
          offset += 4;

          // Number of IFD0 entries
          const entries = view.getUint16(offset + ifd0Offset, littleEndian);
          for (let i = 0; i < entries; i++) {
            const entryOffset = offset + ifd0Offset + 2 + i * 12;
            const tag = view.getUint16(entryOffset, littleEndian);
            if (tag === 0x0112) {
              // Orientation tag
              const format = view.getUint16(entryOffset + 2, littleEndian);
              if (format === 3) {
                // SHORT
                return view.getUint16(entryOffset + 8, littleEndian);
              }
            }
          }
        }
        break;
      }

      offset += view.getUint16(offset, false);
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Apply EXIF orientation transformation to a canvas.
 * Rotates/flips the canvas so the image is upright.
 */
export function applyOrientation(
  canvas: HTMLCanvasElement,
  orientation: number
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;

  // Create a new canvas with swapped dimensions if rotated 90 or 270
  const isRotated = orientation >= 5 && orientation <= 8;
  const newCanvas = document.createElement('canvas');
  newCanvas.width = isRotated ? height : width;
  newCanvas.height = isRotated ? width : height;
  const newCtx = newCanvas.getContext('2d')!;

  // Save current canvas data before clearing original
  const imageData = ctx.getImageData(0, 0, width, height);
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  tempCanvas.getContext('2d')!.putImageData(imageData, 0, 0);

  newCtx.save();

  switch (orientation) {
    case 2: // Flip horizontal
      newCtx.scale(-1, 1);
      newCtx.drawImage(tempCanvas, -width, 0);
      break;
    case 3: // Rotate 180
      newCtx.translate(width, height);
      newCtx.rotate(Math.PI);
      newCtx.drawImage(tempCanvas, 0, 0);
      break;
    case 4: // Flip vertical
      newCtx.scale(1, -1);
      newCtx.drawImage(tempCanvas, 0, -height);
      break;
    case 5: // Transpose
      newCtx.translate(0, width);
      newCtx.rotate(-Math.PI / 2);
      newCtx.drawImage(tempCanvas, 0, 0);
      break;
    case 6: // Rotate 90 CW
      newCtx.translate(height, 0);
      newCtx.rotate(Math.PI / 2);
      newCtx.drawImage(tempCanvas, 0, 0);
      break;
    case 7: // Transverse
      newCtx.translate(height, width);
      newCtx.rotate(Math.PI / 2);
      newCtx.scale(-1, 1);
      newCtx.drawImage(tempCanvas, 0, 0);
      break;
    case 8: // Rotate 270 CW
      newCtx.translate(0, height);
      newCtx.rotate(-Math.PI / 2);
      newCtx.drawImage(tempCanvas, 0, 0);
      break;
    default:
      // No transformation
      newCtx.drawImage(tempCanvas, 0, 0);
  }

  newCtx.restore();
  return newCanvas;
}

/**
 * Create a collage layout grid of images.
 * Supported layouts: '1x1', '1x2', '2x1', '2x2', '3x1', '1x3'
 */
export interface CollageCell {
  x: number;
  y: number;
  width: number;
  height: number;
  gap: number;
}

const COLLAGE_LAYOUTS: Record<string, (gw: number, gh: number, gap: number) => CollageCell[]> = {
  '1x1': (gw, gh, g) => [{ x: 0, y: 0, width: gw, height: gh, gap: g }],
  '1x2': (gw, gh, g) => [
    { x: 0, y: 0, width: gw, height: (gh - g) / 2, gap: g },
    { x: 0, y: (gh + g) / 2, width: gw, height: (gh - g) / 2, gap: g },
  ],
  '2x1': (gw, gh, g) => [
    { x: 0, y: 0, width: (gw - g) / 2, height: gh, gap: g },
    { x: (gw + g) / 2, y: 0, width: (gw - g) / 2, height: gh, gap: g },
  ],
  '2x2': (gw, gh, g) => [
    { x: 0, y: 0, width: (gw - g) / 2, height: (gh - g) / 2, gap: g },
    { x: (gw + g) / 2, y: 0, width: (gw - g) / 2, height: (gh - g) / 2, gap: g },
    { x: 0, y: (gh + g) / 2, width: (gw - g) / 2, height: (gh - g) / 2, gap: g },
    { x: (gw + g) / 2, y: (gh + g) / 2, width: (gw - g) / 2, height: (gh - g) / 2, gap: g },
  ],
  '3x1': (gw, gh, g) => [
    { x: 0, y: 0, width: (gw - g * 2) / 3, height: gh, gap: g },
    { x: (gw + g) / 3, y: 0, width: (gw - g * 2) / 3, height: gh, gap: g },
    { x: (gw + g * 2) / 3 + (gw - g * 2) / 3, y: 0, width: (gw - g * 2) / 3, height: gh, gap: g },
  ],
  '1x3': (gw, gh, g) => [
    { x: 0, y: 0, width: gw, height: (gh - g * 2) / 3, gap: g },
    { x: 0, y: (gh + g) / 3, width: gw, height: (gh - g * 2) / 3, gap: g },
    { x: 0, y: (gh + g * 2) / 3 + (gh - g * 2) / 3, width: gw, height: (gh - g * 2) / 3, gap: g },
  ],
};

export function getCollageLayout(
  layoutName: string,
  canvasWidth: number,
  canvasHeight: number,
  gap: number = 4
): CollageCell[] {
  const layoutFn = COLLAGE_LAYOUTS[layoutName];
  if (!layoutFn) return COLLAGE_LAYOUTS['1x1'](canvasWidth, canvasHeight, gap);
  return layoutFn(canvasWidth, canvasHeight, gap);
}

export const COLLAGE_PRESETS = Object.keys(COLLAGE_LAYOUTS);
