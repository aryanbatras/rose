'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditorStore } from '@/stores/editor-store';
import { EditorCanvas } from './EditorCanvas';
import { FilterPanel } from './FilterPanel';
import { TextTool } from './TextTool';
import { StickerPicker } from './StickerPicker';
import { DoodleTool } from './DoodleTool';
import { CollageTool } from './CollageTool';
import { CropTool } from './CropTool';
import { canvasToBlob } from '@/utils/canvasUtils';
import {
  X,
  Sliders,
  Type,
  Sticker,
  Pencil,
  LayoutGrid,
  Crop,
  ChevronLeft,
  ChevronRight,
  Check,
  RotateCcw,
} from 'lucide-react';

interface ImageEditorProps {
  /** Files to edit */
  files: File[];
  /** Called when editing is complete with the processed files */
  onComplete: (processedBlobs: Blob[]) => void;
  /** Called when the user cancels editing */
  onCancel: () => void;
}

const TOOLS = [
  { id: 'filters' as const, icon: Sliders, label: 'Filters' },
  { id: 'adjust' as const, icon: Sliders, label: 'Adjust' },
  { id: 'crop' as const, icon: Crop, label: 'Crop' },
  { id: 'text' as const, icon: Type, label: 'Text' },
  { id: 'stickers' as const, icon: Sticker, label: 'Stickers' },
  { id: 'doodle' as const, icon: Pencil, label: 'Doodle' },
  { id: 'collage' as const, icon: LayoutGrid, label: 'Collage' },
];

/**
 * Full-screen image editor modal with filters, stickers, text, doodles, collage.
 * Matches Instagram-style editing workflow on web.
 */
export function ImageEditor({ files, onComplete, onCancel }: ImageEditorProps) {
  const isOpen = useEditorStore((s) => s.isOpen);
  const openEditor = useEditorStore((s) => s.openEditor);
  const closeEditor = useEditorStore((s) => s.closeEditor);
  const activeTool = useEditorStore((s) => s.activeTool);
  const setActiveTool = useEditorStore((s) => s.setActiveTool);
  const sourceImages = useEditorStore((s) => s.sourceImages);
  const activeImageIndex = useEditorStore((s) => s.activeImageIndex);
  const nextImage = useEditorStore((s) => s.nextImage);
  const prevImage = useEditorStore((s) => s.prevImage);
  const isProcessing = useEditorStore((s) => s.isProcessing);
  const setProcessing = useEditorStore((s) => s.setProcessing);
  const resetAll = useEditorStore((s) => s.resetAll);

  const editorCanvasRef = useRef<HTMLDivElement>(null);
  const [showToolPanel, setShowToolPanel] = useState(false);

  // Open editor on mount
  useEffect(() => {
    openEditor(files);
    return () => { /* keep open */ };
  }, []);

  // Handle tool change — show the tool panel for applicable tools
  useEffect(() => {
    setShowToolPanel(
      activeTool === 'filters' ||
      activeTool === 'adjust' ||
      activeTool === 'crop' ||
      activeTool === 'text' ||
      activeTool === 'stickers' ||
      activeTool === 'doodle' ||
      activeTool === 'collage'
    );
  }, [activeTool]);

  const handleDone = useCallback(async () => {
    setProcessing(true);
    try {
      const container = editorCanvasRef.current;
      if (!container) throw new Error('No editor container');

      // Try the EditorCanvas's export function first (composites all layers)
      const editorCanvasEl = container.firstElementChild as HTMLElement | null;
      const exportFn = (editorCanvasEl as any)?.__exportEditorCanvas;
      if (typeof exportFn === 'function') {
        const blob = await exportFn();
        if (blob) {
          onComplete([blob]);
          closeEditor();
          resetAll();
          return;
        }
      }

      // Fallback: export directly from the first canvas
      const mainCanvas = container.querySelector('canvas');
      if (mainCanvas) {
        const blob = await canvasToBlob(mainCanvas, 'image/jpeg', 0.85);
        onComplete([blob]);
      } else {
        throw new Error('No canvas found');
      }

      closeEditor();
      resetAll();
    } catch {
      onComplete(files.map((f) => new Blob([f], { type: f.type })));
      closeEditor();
      resetAll();
    } finally {
      setProcessing(false);
    }
  }, [onComplete, closeEditor, resetAll, setProcessing, files]);

  const handleReset = useCallback(() => {
    // Reset all edits for current image
    const store = useEditorStore.getState();
    store.setFilterPreset('Normal');
    store.setBrightness(0);
    store.setContrast(0);
    store.setSaturation(0);
    store.clearTextOverlays();
    store.clearStickers();
    store.clearDoodleStrokes();
    store.setCrop(null);
    store.setRotation(0);
    store.setFlipH(false);
    store.setFlipV(false);
  }, []);

  const handleCancel = useCallback(() => {
    closeEditor();
    resetAll();
    onCancel();
  }, [closeEditor, resetAll, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 bg-black flex flex-col"
        >
          {/* ─── Top Bar ──────────────────────────────── */}
          <div className="flex items-center justify-between px-4 h-14 shrink-0 bg-black/90 border-b border-white/10">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
              <span className="hidden sm:inline">Cancel</span>
            </button>

            <div className="flex items-center gap-2">
              {sourceImages.length > 1 && (
                <div className="flex items-center gap-2 mr-4">
                  <button
                    onClick={prevImage}
                    disabled={activeImageIndex === 0}
                    className="p-1.5 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm text-white/60 tabular-nums">
                    {activeImageIndex + 1} / {sourceImages.length}
                  </span>
                  <button
                    onClick={nextImage}
                    disabled={activeImageIndex >= sourceImages.length - 1}
                    className="p-1.5 text-white/60 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              )}

              <button
                onClick={handleDone}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-brand text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50"
              >
                {isProcessing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Done
              </button>
            </div>
          </div>

          {/* ─── Canvas Area ─────────────────────────── */}

          <div ref={editorCanvasRef} className="flex-1 flex">
            <EditorCanvas />
          </div>

          {/* ─── Tool Panel ──────────────────────────── */}

          <AnimatePresence mode="wait">
            {showToolPanel && (
              <motion.div
                key={activeTool}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="shrink-0 bg-black/90 border-t border-white/10"
              >
                {activeTool === 'filters' && <FilterPanel />}
                {activeTool === 'adjust' && <FilterPanel showAdjust />}
                {activeTool === 'text' && <TextTool />}
                {activeTool === 'stickers' && <StickerPicker />}
                {activeTool === 'doodle' && <DoodleTool />}
                {activeTool === 'crop' && <CropTool />}
                {activeTool === 'collage' && <CollageTool />}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Bottom Toolbar ──────────────────────── */}
          <div className="flex items-center justify-around px-4 py-3 shrink-0 bg-black/95 border-t border-white/10">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'text-brand bg-brand/10'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[11px] font-medium">{tool.label}</span>
                </button>
              );
            })}

            {/* Quick actions */}
            <div className="w-px h-8 bg-white/10 mx-2" />

            <button
              onClick={handleReset}
              className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-white/50 hover:text-white/80 hover:bg-white/5 transition-all"
            >
              <RotateCcw className="h-5 w-5" />
              <span className="text-[11px] font-medium">Reset</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
