/**
 * Zustand store for the image editor state.
 * Manages: images, active tool, layers, filters, text overlays, stickers, doodle paths, undo/redo.
 */
import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────

export type EditorTool =
  | 'filters'
  | 'adjust'
  | 'text'
  | 'stickers'
  | 'doodle'
  | 'crop'
  | 'collage';

export interface FilterState {
  /** Name of the active filter preset (from imageFilters.ts) */
  activePreset: string;
  brightness: number;
  contrast: number;
  saturation: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  rotation: number;
  scale: number;
}

export interface StickerItem {
  id: string;
  /** Emoji or URL for the sticker */
  src: string;
  /** 'emoji' | 'image' */
  type: 'emoji' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  opacity: number;
}

export interface DoodleStroke {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  opacity: number;
  blendMode?: GlobalCompositeOperation;
}

export interface CropState {
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio: number | null;
}

export interface CollageState {
  layout: string;
  gap: number;
}

export interface BrushSettings {
  color: string;
  size: number;
  eraser: boolean;
}

export interface EditorState {
  /** The original source images (Files) being edited */
  sourceImages: File[];

  /** Index of the currently active image being edited */
  activeImageIndex: number;

  /** Current editing tool */
  activeTool: EditorTool;

  /** Whether the editor modal is open */
  isOpen: boolean;

  /** Filter state */
  filter: FilterState;

  /** Text overlays on the current image */
  textOverlays: TextOverlay[];

  /** Stickers on the current image */
  stickers: StickerItem[];

  /** Doodle strokes on the current image */
  doodleStrokes: DoodleStroke[];

  /** Crop state (null = not cropping) */
  crop: CropState | null;

  /** Rotation in degrees (increments of 45, typically 0, 90, 180, 270) */
  rotation: number;

  /** Horizontal flip */
  flipH: boolean;

  /** Vertical flip */
  flipV: boolean;

  /** Collage state */
  collage: CollageState;

  /** Doodle brush settings */
  brush: BrushSettings;

  isProcessing: boolean;
}

// ─── Actions ───────────────────────────────────────────────────────

export interface EditorActions {
  // Modal
  openEditor: (files: File[]) => void;
  closeEditor: () => void;

  // Image navigation
  setActiveImageIndex: (index: number) => void;
  nextImage: () => void;
  prevImage: () => void;

  // Active tool
  setActiveTool: (tool: EditorTool) => void;

  // Filters
  setFilterPreset: (preset: string) => void;
  setBrightness: (value: number) => void;
  setContrast: (value: number) => void;
  setSaturation: (value: number) => void;

  // Text overlays
  addTextOverlay: (overlay: Omit<TextOverlay, 'id'>) => void;
  updateTextOverlay: (id: string, updates: Partial<TextOverlay>) => void;
  removeTextOverlay: (id: string) => void;
  clearTextOverlays: () => void;

  // Stickers
  addSticker: (sticker: Omit<StickerItem, 'id'>) => void;
  updateSticker: (id: string, updates: Partial<StickerItem>) => void;
  removeSticker: (id: string) => void;
  clearStickers: () => void;

  // Doodles
  addDoodleStroke: (stroke: Omit<DoodleStroke, 'id'>) => void;
  removeDoodleStroke: (id: string) => void;
  clearDoodleStrokes: () => void;

  // Doodle brush settings
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setBrushEraser: (eraser: boolean) => void;

  // Collage
  setCollageLayout: (layout: string) => void;
  setCollageGap: (gap: number) => void;

  // Crop & Transform
  setCrop: (crop: CropState | null) => void;
  setRotation: (degrees: number) => void;
  setFlipH: (flip: boolean) => void;
  setFlipV: (flip: boolean) => void;

  // Processing
  setProcessing: (processing: boolean) => void;

  // Reset
  resetAll: () => void;
}

// ─── Helpers ───────────────────────────────────────────────────────

let _idCounter = 0;
export function generateId(): string {
  _idCounter += 1;
  return `editor_${Date.now()}_${_idCounter}`;
}

const DEFAULT_FILTER: FilterState = {
  activePreset: 'Normal',
  brightness: 0,
  contrast: 0,
  saturation: 0,
};

const DEFAULT_COLLAGE: CollageState = {
  layout: '1x1',
  gap: 4,
};

const DEFAULT_BRUSH: BrushSettings = {
  color: '#ffffff',
  size: 4,
  eraser: false,
};

// ─── Store ─────────────────────────────────────────────────────────

export const useEditorStore = create<EditorState & EditorActions>()(
  (set, get) => ({
    // ─── State ────────────────────────────────────────
    sourceImages: [],
    activeImageIndex: 0,
    activeTool: 'filters',
    isOpen: false,
    filter: { ...DEFAULT_FILTER },
    textOverlays: [],
    stickers: [],
    doodleStrokes: [],
    crop: null,
    rotation: 0,
    flipH: false,
    flipV: false,
    collage: { ...DEFAULT_COLLAGE },
    brush: { ...DEFAULT_BRUSH },
    isProcessing: false,

    // ─── Actions ─────────────────────────────────────

    openEditor: (files) =>
      set({
        sourceImages: files,
        activeImageIndex: 0,
        activeTool: 'filters',
        isOpen: true,
        filter: { ...DEFAULT_FILTER },
        textOverlays: [],
        stickers: [],
        doodleStrokes: [],
        crop: null,
        rotation: 0,
        flipH: false,
        flipV: false,
        collage: { ...DEFAULT_COLLAGE },
        brush: { ...DEFAULT_BRUSH },
      }),

    closeEditor: () => set({ isOpen: false }),

    setActiveImageIndex: (index) =>
      set({
        activeImageIndex: index,
        // Reset edits per-image
        filter: { ...DEFAULT_FILTER },
        textOverlays: [],
        stickers: [],
        doodleStrokes: [],
        crop: null,
        rotation: 0,
        flipH: false,
        flipV: false,
        brush: { ...DEFAULT_BRUSH },
      }),

    nextImage: () => {
      const { activeImageIndex, sourceImages } = get();
      if (activeImageIndex < sourceImages.length - 1) {
        get().setActiveImageIndex(activeImageIndex + 1);
      }
    },

    prevImage: () => {
      const { activeImageIndex } = get();
      if (activeImageIndex > 0) {
        get().setActiveImageIndex(activeImageIndex - 1);
      }
    },

    setActiveTool: (tool) => set({ activeTool: tool }),

    // Filters
    setFilterPreset: (preset) => set({ filter: { ...get().filter, activePreset: preset } }),
    setBrightness: (value) => set({ filter: { ...get().filter, brightness: value } }),
    setContrast: (value) => set({ filter: { ...get().filter, contrast: value } }),
    setSaturation: (value) => set({ filter: { ...get().filter, saturation: value } }),

    // Text overlays
    addTextOverlay: (overlay) =>
      set({ textOverlays: [...get().textOverlays, { ...overlay, id: generateId() }] }),
    updateTextOverlay: (id, updates) =>
      set({
        textOverlays: get().textOverlays.map((o) =>
          o.id === id ? { ...o, ...updates } : o
        ),
      }),
    removeTextOverlay: (id) =>
      set({ textOverlays: get().textOverlays.filter((o) => o.id !== id) }),
    clearTextOverlays: () => set({ textOverlays: [] }),

    // Stickers
    addSticker: (sticker) =>
      set({ stickers: [...get().stickers, { ...sticker, id: generateId() }] }),
    updateSticker: (id, updates) =>
      set({
        stickers: get().stickers.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      }),
    removeSticker: (id) =>
      set({ stickers: get().stickers.filter((s) => s.id !== id) }),
    clearStickers: () => set({ stickers: [] }),

    // Brush settings
    setBrushColor: (color) => set({ brush: { ...get().brush, color } }),
    setBrushSize: (size) => set({ brush: { ...get().brush, size } }),
    setBrushEraser: (eraser) => set({ brush: { ...get().brush, eraser } }),

    // Doodles
    addDoodleStroke: (stroke) =>
      set({
        doodleStrokes: [...get().doodleStrokes, { ...stroke, id: generateId() }],
      }),
    removeDoodleStroke: (id) =>
      set({ doodleStrokes: get().doodleStrokes.filter((s) => s.id !== id) }),
    clearDoodleStrokes: () => set({ doodleStrokes: [] }),

    // Collage
    setCollageLayout: (layout) => set({ collage: { ...get().collage, layout } }),
    setCollageGap: (gap) => set({ collage: { ...get().collage, gap } }),

    // Crop & Transform
    setCrop: (crop) => set({ crop }),
    setRotation: (rotation) => set({ rotation }),
    setFlipH: (flipH) => set({ flipH }),
    setFlipV: (flipV) => set({ flipV }),

    // Processing
    setProcessing: (processing) => set({ isProcessing: processing }),

    resetAll: () =>
      set({
        sourceImages: [],
        activeImageIndex: 0,
        activeTool: 'filters',
        isOpen: false,
        filter: { ...DEFAULT_FILTER },
        textOverlays: [],
        stickers: [],
        doodleStrokes: [],
        crop: null,
        rotation: 0,
        flipH: false,
        flipV: false,
        collage: { ...DEFAULT_COLLAGE },
        isProcessing: false,
        brush: { ...DEFAULT_BRUSH },
      }),
  })
);
