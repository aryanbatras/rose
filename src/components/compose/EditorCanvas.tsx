'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { loadImage, drawImageContained, canvasToBlob } from '@/utils/canvasUtils';
import { applyColorMatrix, applyAdjustments, getFilterByName } from '@/utils/imageFilters';

interface EditorCanvasProps {
  /** Called when the processed image is exported as a Blob */
  onExport?: (blob: Blob) => void;
}

export function EditorCanvas({ onExport }: EditorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 600 });
  const [imageLoaded, setImageLoaded] = useState<HTMLImageElement | null>(null);

  // Editor state
  const sourceImages = useEditorStore((s) => s.sourceImages);
  const activeImageIndex = useEditorStore((s) => s.activeImageIndex);
  const filter = useEditorStore((s) => s.filter);
  const activeTool = useEditorStore((s) => s.activeTool);
  const textOverlays = useEditorStore((s) => s.textOverlays);
  const stickers = useEditorStore((s) => s.stickers);
  const doodleStrokes = useEditorStore((s) => s.doodleStrokes);
  const rotation = useEditorStore((s) => s.rotation);
  const flipH = useEditorStore((s) => s.flipH);
  const flipV = useEditorStore((s) => s.flipV);
  const crop = useEditorStore((s) => s.crop);

  // ─── Load image ────────────────────────────────────

  useEffect(() => {
    const file = sourceImages[activeImageIndex];
    if (!file) return;

    let cancelled = false;
    loadImage(file).then((img) => {
      if (!cancelled) {
        // Set canvas size based on image (max 1200px)
        const maxDim = 1200;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        setCanvasSize({ width: Math.max(w, 300), height: Math.max(h, 300) });
        setImageLoaded(img);
      }
    });
    return () => { cancelled = true; };
  }, [sourceImages, activeImageIndex]);

  // ─── Resize to container ──────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setCanvasSize((prev) => ({
            width: Math.min(prev.width, width - 4),
            height: Math.min(prev.height, height - 4),
          }));
        }
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // ─── Render main canvas (image + filters) ─────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageLoaded) return;

    const ctx = canvas.getContext('2d')!;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;

    // Draw image
    drawImageContained(ctx, imageLoaded, canvasSize.width, canvasSize.height);

    // Apply filter if not Normal
    if (filter.activePreset !== 'Normal' || filter.brightness !== 0 || filter.contrast !== 0 || filter.saturation !== 0) {
      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Apply preset matrix
        if (filter.activePreset !== 'Normal') {
          const preset = getFilterByName(filter.activePreset);
          applyColorMatrix(imageData, preset.data);
        }

        // Apply adjustments
        if (filter.brightness !== 0 || filter.contrast !== 0 || filter.saturation !== 0) {
          applyAdjustments(imageData, filter.brightness, filter.contrast, filter.saturation);
        }

        ctx.putImageData(imageData, 0, 0);
      } catch {
        // Fallback: just use CSS filter on the whole canvas
      }
    }
  }, [imageLoaded, canvasSize, filter]);

  // ─── Render overlay canvas (stickers + text + doodles) ──

  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw doodle strokes
    for (const stroke of doodleStrokes) {
      if (stroke.points.length < 2) continue;
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = stroke.opacity;
      ctx.globalCompositeOperation = stroke.blendMode ?? 'source-over';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        const prev = stroke.points[i - 1];
        const midX = (prev.x + p.x) / 2;
        const midY = (prev.y + p.y) / 2;
        ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Draw stickers
    for (const sticker of stickers) {
      ctx.save();
      ctx.translate(sticker.x, sticker.y);
      ctx.rotate(sticker.rotation);
      ctx.scale(sticker.scale, sticker.scale);
      ctx.globalAlpha = sticker.opacity;

      if (sticker.type === 'emoji') {
        ctx.font = `${sticker.width}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sticker.src, 0, 0);
      }
      ctx.restore();
    }

    // Draw text overlays
    for (const text of textOverlays) {
      ctx.save();
      ctx.translate(text.x, text.y);
      ctx.rotate(text.rotation);
      ctx.scale(text.scale, text.scale);
      ctx.globalAlpha = text.opacity;
      ctx.font = `bold ${text.fontSize}px ${text.fontFamily}, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Text shadow
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Stroke (outline)
      if (text.strokeWidth > 0) {
        ctx.strokeStyle = text.strokeColor;
        ctx.lineWidth = text.strokeWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(text.text, 0, 0);
      }

      // Fill
      ctx.fillStyle = text.color;
      ctx.shadowBlur = 0;
      ctx.fillText(text.text, 0, 0);
      ctx.restore();
    }
  }, [canvasSize, stickers, textOverlays, doodleStrokes]);

  // ─── Export composited image with crop/rotation ──
  // Strategy: composite main + overlay FIRST, then apply crop + transform
  const handleExport = useCallback(async (): Promise<Blob | null> => {
    const mainCanvas = canvasRef.current;
    const overlayCanvas = overlayRef.current;
    if (!mainCanvas || !overlayCanvas) return null;

    const store = useEditorStore.getState();
    const rot = store.rotation;
    const hFlip = store.flipH;
    const vFlip = store.flipV;
    const cropState = store.crop;

    // Step 1: Merge main + overlay into one canvas
    const merged = document.createElement('canvas');
    merged.width = mainCanvas.width;
    merged.height = mainCanvas.height;
    const mCtx = merged.getContext('2d')!;
    mCtx.drawImage(mainCanvas, 0, 0);
    mCtx.drawImage(overlayCanvas, 0, 0);

    let sourceCanvas = merged;

    // Step 2: Apply crop if set
    if (cropState) {
      const cropCanvas = document.createElement('canvas');
      const cw = merged.width * cropState.width;
      const ch = merged.height * cropState.height;
      cropCanvas.width = Math.round(cw);
      cropCanvas.height = Math.round(ch);
      const cCtx = cropCanvas.getContext('2d')!;
      cCtx.drawImage(
        merged,
        Math.round(merged.width * cropState.x),
        Math.round(merged.height * cropState.y),
        Math.round(cw),
        Math.round(ch),
        0,
        0,
        Math.round(cw),
        Math.round(ch)
      );
      sourceCanvas = cropCanvas;
    }

    // Step 3: Apply rotation + flip
    const needsTransform = rot !== 0 || hFlip || vFlip;
    if (needsTransform) {
      const transformCanvas = document.createElement('canvas');
      const isSwapped = rot % 180 !== 0;
      const srcW = sourceCanvas.width;
      const srcH = sourceCanvas.height;
      transformCanvas.width = isSwapped ? srcH : srcW;
      transformCanvas.height = isSwapped ? srcW : srcH;
      const tCtx = transformCanvas.getContext('2d')!;
      tCtx.save();
      tCtx.translate(transformCanvas.width / 2, transformCanvas.height / 2);
      tCtx.rotate((rot * Math.PI) / 180);
      tCtx.scale(hFlip ? -1 : 1, vFlip ? -1 : 1);
      tCtx.drawImage(sourceCanvas, -srcW / 2, -srcH / 2);
      tCtx.restore();
      sourceCanvas = transformCanvas;
    }

    const blob = await canvasToBlob(sourceCanvas, 'image/jpeg', 0.92);
    return blob;
  }, []);

  // Expose export method on the container ref
  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      (el as any).__exportEditorCanvas = handleExport;
    }
    return () => {
      if (el) delete (el as any).__exportEditorCanvas;
    };
  }, [handleExport]);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 flex items-center justify-center bg-black/40 overflow-hidden min-h-[400px]"
      style={{ touchAction: 'none' }}
    >
      {!imageLoaded && (
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <span>Loading image...</span>
        </div>
      )}

      <div
        className="relative"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute inset-0 w-full h-full rounded-lg"
          style={{ imageRendering: 'auto' }}
        />
        <canvas
          ref={overlayRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="absolute inset-0 w-full h-full rounded-lg pointer-events-none"
        />

        {activeTool === 'doodle' && (
          <DoodleCanvasOverlay
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            overlayRef={overlayRef}
          />
        )}

        {(activeTool === 'text' || activeTool === 'stickers') && (
          <DragOverlay
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            overlayRef={overlayRef}
          />
        )}

        {activeTool === 'crop' && crop && (
          <CropOverlay
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            crop={crop}
          />
        )}
      </div>
    </div>
  );
}

// ─── Doodle Overlay (separate component for cleaner code) ─────────

function DoodleCanvasOverlay({
  canvasWidth,
  canvasHeight,
  overlayRef,
}: {
  canvasWidth: number;
  canvasHeight: number;
  overlayRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  const isDrawing = useRef(false);
  const currentPoints = useRef<Array<{ x: number; y: number }>>([]);
  const addDoodleStroke = useEditorStore((s) => s.addDoodleStroke);
  const brushColor = useEditorStore((s) => s.brush.color);
  const brushSize = useEditorStore((s) => s.brush.size);
  const brushEraser = useEditorStore((s) => s.brush.eraser);

  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = overlayRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [overlayRef]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const canvas = overlayRef.current;
      if (!canvas) return;
      isDrawing.current = true;
      const coords = getCanvasCoords(e.clientX, e.clientY);
      currentPoints.current = [coords];
      canvas.setPointerCapture(e.pointerId);
    },
    [overlayRef, getCanvasCoords]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      const coords = getCanvasCoords(e.clientX, e.clientY);
      currentPoints.current.push(coords);
    },
    [getCanvasCoords]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      if (currentPoints.current.length >= 2) {
        addDoodleStroke({
          points: [...currentPoints.current],
          color: brushColor,
          width: brushSize,
          opacity: 0.9,
          blendMode: brushEraser ? 'destination-out' : undefined,
        });
      }
      currentPoints.current = [];
    },
    [addDoodleStroke]
  );

  return (
    <div
      className="absolute inset-0 cursor-crosshair z-10"
      style={{
        width: canvasWidth,
        height: canvasHeight,
        maxWidth: '100%',
        maxHeight: '100%',
        touchAction: 'none',
        pointerEvents: 'auto',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}

// ─── Crop Overlay ────────────────────────────────────────────────

function CropOverlay({
  canvasWidth,
  canvasHeight,
  crop,
}: {
  canvasWidth: number;
  canvasHeight: number;
  crop: { x: number; y: number; width: number; height: number; aspectRatio: number | null };
}) {
  const px = (v: number) => Math.round(v * canvasWidth);
  const py = (v: number) => Math.round(v * canvasHeight);

  const left = px(crop.x);
  const top = py(crop.y);
  const right = canvasWidth - px(crop.x + crop.width);
  const bottom = canvasHeight - py(crop.y + crop.height);
  const cw = px(crop.width);
  const ch = py(crop.height);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none" style={{ touchAction: 'none' }}>
      {/* Darkened edges */}
      <div className="absolute top-0 left-0 right-0 bg-black/50" style={{ height: top }} />
      <div className="absolute bottom-0 left-0 right-0 bg-black/50" style={{ height: bottom }} />
      <div className="absolute bg-black/50" style={{ top, bottom, left: 0, width: left }} />
      <div className="absolute bg-black/50" style={{ top, bottom, right: 0, width: right }} />

      {/* Crop region border */}
      <div
        className="absolute border-2 border-white/80"
        style={{ top, left, width: cw, height: ch }}
      />

      {/* Corner handles */}
      <div className="absolute w-6 h-6 border-t-4 border-l-4 border-white" style={{ top: top - 3, left: left - 3 }} />
      <div className="absolute w-6 h-6 border-t-4 border-r-4 border-white" style={{ top: top - 3, right: canvasWidth - right - 3 }} />
      <div className="absolute w-6 h-6 border-b-4 border-l-4 border-white" style={{ bottom: bottom - 3, left: left - 3 }} />
      <div className="absolute w-6 h-6 border-b-4 border-r-4 border-white" style={{ bottom: bottom - 3, right: canvasWidth - right - 3 }} />

      {/* Center label */}
      <div
        className="absolute text-white/60 text-[11px] font-medium"
        style={{ top: top + ch / 2 - 8, left: left + cw / 2 - 20 }}
      >
        {crop.aspectRatio ? `${crop.aspectRatio.toFixed(2)}` : 'Free'}
      </div>
    </div>
  );
}

// ─── Drag Overlay for Text & Stickers ────────────────────────────

function DragOverlay({
  canvasWidth,
  canvasHeight,
  overlayRef,
}: {
  canvasWidth: number;
  canvasHeight: number;
  overlayRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const dragTarget = useRef<'text' | 'sticker' | null>(null);
  const dragId = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const textOverlays = useEditorStore((s) => s.textOverlays);
  const stickers = useEditorStore((s) => s.stickers);
  const updateTextOverlay = useEditorStore((s) => s.updateTextOverlay);
  const updateSticker = useEditorStore((s) => s.updateSticker);

  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = overlayRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    },
    [overlayRef]
  );

  // Use measureText for accurate text hit testing
  const measureTextWidth = useCallback(
    (text: string, fontSize: number, fontFamily: string): number => {
      const canvas = overlayRef.current;
      if (!canvas) return text.length * fontSize * 0.4;
      const ctx = canvas.getContext('2d');
      if (!ctx) return text.length * fontSize * 0.4;
      ctx.font = `bold ${fontSize}px ${fontFamily}, sans-serif`;
      return ctx.measureText(text).width;
    },
    [overlayRef]
  );

  const hitTestText = useCallback(
    (cx: number, cy: number): string | null => {
      for (let i = textOverlays.length - 1; i >= 0; i--) {
        const t = textOverlays[i];
        const textW = measureTextWidth(t.text, t.fontSize, t.fontFamily);
        const halfW = textW / 2;
        const halfH = t.fontSize;
        if (cx >= t.x - halfW && cx <= t.x + halfW && cy >= t.y - halfH && cy <= t.y + halfH) {
          return t.id;
        }
      }
      return null;
    },
    [textOverlays, measureTextWidth]
  );

  const hitTestSticker = useCallback(
    (cx: number, cy: number): string | null => {
      for (let i = stickers.length - 1; i >= 0; i--) {
        const s = stickers[i];
        const halfW = (s.width * s.scale) / 2;
        const halfH = (s.height * s.scale) / 2;
        if (cx >= s.x - halfW && cx <= s.x + halfW && cy >= s.y - halfH && cy <= s.y + halfH) {
          return s.id;
        }
      }
      return null;
    },
    [stickers]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const coords = getCanvasCoords(e.clientX, e.clientY);

      // Try hit-testing stickers first (they render on top), then text
      const hitSticker = hitTestSticker(coords.x, coords.y);
      if (hitSticker) {
        setIsDragging(true);
        setSelectedId(hitSticker);
        dragTarget.current = 'sticker';
        dragId.current = hitSticker;
        const s = stickers.find((st) => st.id === hitSticker);
        if (s) {
          dragOffset.current = { x: coords.x - s.x, y: coords.y - s.y };
        }
        return;
      }

      const hitText = hitTestText(coords.x, coords.y);
      if (hitText) {
        setIsDragging(true);
        setSelectedId(hitText);
        dragTarget.current = 'text';
        dragId.current = hitText;
        const t = textOverlays.find((ot) => ot.id === hitText);
        if (t) {
          dragOffset.current = { x: coords.x - t.x, y: coords.y - t.y };
        }
      }
    },
    [getCanvasCoords, hitTestSticker, hitTestText, stickers, textOverlays]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !dragId.current || !dragTarget.current) return;
      e.preventDefault();
      const coords = getCanvasCoords(e.clientX, e.clientY);
      const newX = coords.x - dragOffset.current.x;
      const newY = coords.y - dragOffset.current.y;

      if (dragTarget.current === 'text') {
        updateTextOverlay(dragId.current, { x: newX, y: newY });
      } else if (dragTarget.current === 'sticker') {
        updateSticker(dragId.current, { x: newX, y: newY });
      }
    },
    [isDragging, getCanvasCoords, updateTextOverlay, updateSticker]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setSelectedId(null);
    dragTarget.current = null;
    dragId.current = null;
  }, []);

  return (
    <div
      className="absolute inset-0 z-10"
      style={{
        width: canvasWidth,
        height: canvasHeight,
        maxWidth: '100%',
        maxHeight: '100%',
        touchAction: 'none',
        pointerEvents: 'auto',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}
