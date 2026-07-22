/**
 * Image filter presets and Canvas pixel manipulation utilities.
 * Each filter is a 4x5 color matrix applied per-pixel via Canvas ImageData.
 *
 * Matrix layout (row-major):
 *   [R']   [ a  b  c  d  e ]   [R]
 *   [G'] = [ f  g  h  i  j ] * [G]
 *   [B']   [ k  l  m  n  o ]   [B]
 *   [A']   [ p  q  r  s  t ]   [A]
 *                               [1]
 */

export interface FilterMatrix {
  name: string;
  label: string;
  data: number[];
}

/**
 * Apply a color matrix to an ImageData buffer in-place.
 */
export function applyColorMatrix(
  imageData: ImageData,
  matrix: number[]
): void {
  const data = imageData.data;
  const m = matrix;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    data[i] = clamp(m[0] * r + m[1] * g + m[2] * b + m[3] * a + m[4]);
    data[i + 1] = clamp(m[5] * r + m[6] * g + m[7] * b + m[8] * a + m[9]);
    data[i + 2] = clamp(m[10] * r + m[11] * g + m[12] * b + m[13] * a + m[14]);
    data[i + 3] = clamp(m[15] * r + m[16] * g + m[17] * b + m[18] * a + m[19]);
  }
}

/**
 * Apply brightness, contrast, and saturation adjustments.
 * Fixed: no longer strips colors. Each adjustment is applied independently
 * and only if the value is non-zero.
 */
export function applyAdjustments(
  imageData: ImageData,
  brightness: number = 0,
  contrast: number = 0,
  saturation: number = 0
): void {
  const data = imageData.data;

  // Normalize to [-1, 1] range for calculations
  const bNorm = brightness / 100;

  // Contrast factor: 1 = no change, <1 reduces, >1 increases
  const cFactor = contrast >= 0
    ? (255 + contrast) / 255
    : 255 / (255 - contrast);

  // Saturation factor: 0 = grayscale, 1 = no change, >1 increases
  const sFactor = 1 + saturation / 100;

  // Precompute luminance weights
  const RW = 0.299;
  const GW = 0.587;
  const BW = 0.114;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // 1. Brightness (additive shift)
    if (brightness !== 0) {
      r += bNorm * 255;
      g += bNorm * 255;
      b += bNorm * 255;
    }

    // 2. Contrast (multiplicative, centered around 128)
    if (contrast !== 0) {
      r = (r - 128) * cFactor + 128;
      g = (g - 128) * cFactor + 128;
      b = (b - 128) * cFactor + 128;
    }

    // 3. Saturation (blend with luminance)
    if (saturation !== 0) {
      const luminance = RW * r + GW * g + BW * b;
      r = luminance + sFactor * (r - luminance);
      g = luminance + sFactor * (g - luminance);
      b = luminance + sFactor * (b - luminance);
    }

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

/**
 * Filter preset definitions — Instagram-style matrices.
 */
export const FILTER_PRESETS: FilterMatrix[] = [
  {
    name: 'Normal',
    label: 'Normal',
    data: [
      1, 0, 0, 0, 0,
      0, 1, 0, 0, 0,
      0, 0, 1, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
  {
    name: 'Clarendon',
    label: 'Bright',
    data: [
      1.15, 0.02, -0.02, 0, 5,
      0.01, 1.12, 0.01, 0, 3,
      -0.01, 0.02, 1.08, 0, -2,
      0, 0, 0, 1, 0,
    ],
  },
  {
    name: 'Gingham',
    label: 'Soft',
    data: [
      0.85, 0.10, 0.05, 0, 10,
      0.05, 0.90, 0.05, 0, 8,
      0.05, 0.08, 0.85, 0, 12,
      0, 0, 0, 1, 0,
    ],
  },
  {
    name: 'Lark',
    label: 'Cool',
    data: [
      0.95, 0, 0.05, 0, 0,
      0, 1.05, 0, 0, 0,
      0.05, 0, 1.20, 0, 5,
      0, 0, 0, 1, 0,
    ],
  },
  {
    name: 'Juno',
    label: 'Warm',
    data: [
      1.10, 0.05, 0, 0, 10,
      0.05, 1.05, 0.02, 0, 5,
      0, 0.02, 0.90, 0, -5,
      0, 0, 0, 1, 0,
    ],
  },
  {
    name: 'Valencia',
    label: 'Vintage',
    data: [
      1.08, 0.04, 0.02, 0, 8,
      -0.02, 1.02, 0.04, 0, 4,
      0.02, -0.02, 0.85, 0, 6,
      0, 0, 0, 1, 0,
    ],
  },
  {
    name: 'X-Pro II',
    label: 'Film',
    data: [
      1.10, 0.08, -0.05, 0, 5,
      -0.05, 1.05, 0.05, 0, 0,
      -0.10, 0.05, 0.95, 0, 10,
      0, 0, 0, 1, 0,
    ],
  },
  {
    name: 'Grayscale',
    label: 'B&W',
    data: [
      0.33, 0.59, 0.11, 0, 0,
      0.33, 0.59, 0.11, 0, 0,
      0.33, 0.59, 0.11, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
  {
    name: 'Noir',
    label: 'Noir',
    data: [
      0.50, 0.40, 0.10, 0, 0,
      0.50, 0.40, 0.10, 0, 0,
      0.50, 0.40, 0.10, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
  {
    name: 'Sepia',
    label: 'Sepia',
    data: [
      0.39, 0.77, 0.19, 0, 0,
      0.35, 0.69, 0.17, 0, 0,
      0.27, 0.53, 0.13, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
  {
    name: 'Kodachrome',
    label: 'Chrome',
    data: [
      1.13, -0.06, 0.05, 0, 0,
      -0.17, 1.19, -0.06, 0, 0,
      0.01, -0.12, 1.14, 0, 0,
      0, 0, 0, 1, 0,
    ],
  },
  {
    name: 'Hudson',
    label: 'Hudson',
    data: [
      1.05, 0.05, 0.02, 0, 8,
      0.02, 1.08, 0.02, 0, 5,
      -0.02, 0.02, 0.95, 0, 2,
      0, 0, 0, 1, 0,
    ],
  },
  {
    name: 'Rise',
    label: 'Rise',
    data: [
      1.10, 0.02, -0.02, 0, 10,
      0.01, 1.05, 0.01, 0, 5,
      -0.01, -0.01, 0.92, 0, -3,
      0, 0, 0, 1, 0,
    ],
  },
];

/**
 * Get a filter preset by name. Returns Normal if not found.
 */
export function getFilterByName(name: string): FilterMatrix {
  return FILTER_PRESETS.find((f) => f.name === name) || FILTER_PRESETS[0];
}

/**
 * Apply a CSS-based filter string for quick preview.
 */
export function getCSSFilterForPreset(name: string): string {
  switch (name) {
    case 'Grayscale': return 'grayscale(1)';
    case 'Sepia': return 'sepia(0.8)';
    case 'Noir': return 'grayscale(1) contrast(1.2) brightness(0.9)';
    case 'Clarendon': return 'brightness(1.1) contrast(1.1) saturate(1.2)';
    case 'Valencia': return 'sepia(0.15) saturate(1.1) brightness(1.05)';
    case 'Lark': return 'brightness(1.05) saturate(0.9) hue-rotate(-10deg)';
    case 'Juno': return 'saturate(1.2) hue-rotate(5deg) brightness(1.05)';
    case 'Rise': return 'brightness(1.1) saturate(1.1) sepia(0.1)';
    default: return 'none';
  }
}
