'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { loadImage, drawImageContained, drawImageCover, canvasToBlob, getCollageLayout } from '@/utils/canvasUtils';
import { applyColorMatrix, applyAdjustments, getFilterByName } from '@/utils/imageFilters';

export function EditorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 600 });
  const [imageLoaded, setImageLoaded] = useState<HTMLImageElement | null>(null);
  const [allLoadedImages, setAllLoadedImages] = useState<HTMLImageElement[]>([]);

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
  const collage = useEditorStore((s) => s.collage);
  const isCollage = collage.layout !== '1x1' && sourceImages.length > 1;

  // ─── Load image(s) ──────────────────────────────────

  useEffect(() => {
    if (!sourceImages.length) return;
    let cancelled = false;

    if (isCollage) {
      Promise.all(sourceImages.map((f) => loadImage(f)))
        .then((images) => {
          if (!cancelled) {
            setAllLoadedImages(images.filter(Boolean));
            setCanvasSize({ width: 1080, height: 1080 });
            setImageLoaded(null);
          }
        })
        .catch(() => {});
    } else {
      const file = sourceImages[activeImageIndex];
      if (!file) return;

      loadImage(file)
        .then((img) => {
          if (!cancelled) {
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
            setAllLoadedImages([]);
          }
        })
        .catch(() => {});
    }

    return () => { cancelled = true; };
  }, [sourceImages, activeImageIndex, isCollage]);

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

  // ─── Render main canvas ───────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isCollage && allLoadedImages.length > 0) {
      const cells = getCollageLayout(collage.layout, canvasSize.width, canvasSize.height, collage.gap);
      const imageCount = Math.min(cells.length, allLoadedImages.length);

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];

        if (i < imageCount) {
          const img = allLoadedImages[i];
          ctx.save();
          ctx.translate(cell.x, cell.y);
          ctx.beginPath();
          ctx.rect(0, 0, cell.width, cell.height);
          ctx.clip();
          drawImageCover(ctx, img, cell.width, cell.height);
          ctx.restore();

          if (filter.activePreset !== 'Normal' || filter.brightness !== 0 || filter.contrast !== 0 || filter.saturation !== 0) {
            try {
              const imageData = ctx.getImageData(cell.x, cell.y, cell.width, cell.height);
              if (filter.activePreset !== 'Normal') {
                const preset = getFilterByName(filter.activePreset);
                applyColorMatrix(imageData, preset.data);
              }
              if (filter.brightness !== 0 || filter.contrast !== 0 || filter.saturation !== 0) {
                applyAdjustments(imageData, filter.brightness, filter.contrast, filter.saturation);
              }
              ctx.putImageData(imageData, cell.x, cell.y);
            } catch {}
          }
        } else {
          ctx.fillStyle = '#111';
          ctx.fillRect(cell.x, cell.y, cell.width, cell.height);
        }

        if (collage.gap > 0) {
          ctx.strokeStyle = '#222';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(cell.x, cell.y, cell.width, cell.height);
        }
      }
    } else if (imageLoaded) {
      drawImageContained(ctx, imageLoaded, canvasSize.width, canvasSize.height);

      if (filter.activePreset !== 'Normal' || filter.brightness !== 0 || filter.contrast !== 0 || filter.saturation !== 0) {
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          if (filter.activePreset !== 'Normal') {
            const preset = getFilterByName(filter.activePreset);
            applyColorMatrix(imageData, preset.data);
          }
          if (filter.brightness !== 0 || filter.contrast !== 0 || filter.saturation !== 0) {
            applyAdjustments(imageData, filter.brightness, filter.contrast, filter.saturation);
          }
          ctx.putImageData(imageData, 0, 0);
        } catch {}
      }
    }
  }, [imageLoaded, allLoadedImages, canvasSize, filter, isCollage, collage.layout, collage.gap]);

  // ─── Render overlay canvas (stickers + text + doodles) ──

  useEffect(() => {
    const canvas = overlayRef.current;
    if (!canvas) return;

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    for (const text of textOverlays) {
      ctx.save();
      ctx.translate(text.x, text.y);
      ctx.rotate(text.rotation);
      ctx.scale(text.scale, text.scale);
      ctx.globalAlpha = text.opacity;
      ctx.font = `bold ${text.fontSize}px ${text.fontFamily}, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      if (text.strokeWidth > 0) {
        ctx.strokeStyle = text.strokeColor;
        ctx.lineWidth = text.strokeWidth;
        ctx.lineJoin = 'round';
        ctx.strokeText(text.text, 0, 0);
      }
      ctx.fillStyle = text.color;
      ctx.shadowBlur = 0;
      ctx.fillText(text.text, 0, 0);
      ctx.restore();
    }
  }, [canvasSize, stickers, textOverlays, doodleStrokes]);

  // ─── Export composited image with crop/rotation ──

  const handleExport = useCallback(async (): Promise<Blob | null> => {
    const mainCanvas = canvasRef.current;
    const overlayCanvas = overlayRef.current;
    if (!mainCanvas || !overlayCanvas) return null;

    const store = useEditorStore.getState();
    const rot = store.rotation;
    const hFlip = store.flipH;
    const vFlip = store.flipV;
    const cropState = store.crop;

    const merged = document.createElement('canvas');
    merged.width = mainCanvas.width;
    merged.height = mainCanvas.height;
    const mCtx = merged.getContext('2d')!;
    mCtx.drawImage(mainCanvas, 0, 0);
    mCtx.drawImage(overlayCanvas, 0, 0);

    let sourceCanvas = merged;

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
        0, 0, Math.round(cw), Math.round(ch)
      );
      sourceCanvas = cropCanvas;
    }

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

    const blob = await canvasToBlob(sourceCanvas, 'image/jpeg', 0.85);
    return blob;
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      (el as any).__exportEditorCanvas = handleExport;
    }
    return () => {
      if (el) delete (el as any).__exportEditorCanvas;
    };
  }, [handleExport]);

  const isLoading = !imageLoaded && allLoadedImages.length === 0 && sourceImages.length > 0;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 flex items-center justify-center bg-black/40 overflow-hidden min-h-[400px]"
      style={{ touchAction: 'none' }}
    >
      {isLoading && (
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <span>{isCollage ? 'Loading images...' : 'Loading image...'}</span>
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
          />
        )}

        {isCollage && activeTool === 'collage' && (
          <CanvasGridOverlay
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
          />
        )}
      </div>
    </div>
  );
}

// ─── Doodle Overlay ───────────────────────────────────────────────

function DoodleCanvasOverlay({
  canvasWidth, canvasHeight, overlayRef,
}: {
  canvasWidth: number; canvasHeight: number;
  overlayRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  const isDrawing = useRef(false);
  const currentPoints = useRef<Array<{ x: number; y: number }>>([]);
  const addDoodleStroke = useEditorStore((s) => s.addDoodleStroke);
  const brushColor = useEditorStore((s) => s.brush.color);
  const brushSize = useEditorStore((s) => s.brush.size);
  const brushEraser = useEditorStore((s) => s.brush.eraser);

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = overlayRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }, [overlayRef]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const canvas = overlayRef.current;
    if (!canvas) return;
    isDrawing.current = true;
    currentPoints.current = [getCanvasCoords(e.clientX, e.clientY)];
    canvas.setPointerCapture(e.pointerId);
  }, [overlayRef, getCanvasCoords]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    currentPoints.current.push(getCanvasCoords(e.clientX, e.clientY));
  }, [getCanvasCoords]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
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
  }, [addDoodleStroke]);

  return (
    <div
      className="absolute inset-0 cursor-crosshair z-10"
      style={{ width: canvasWidth, height: canvasHeight, maxWidth: '100%', maxHeight: '100%', touchAction: 'none', pointerEvents: 'auto' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}

// ─── Interactive Crop Overlay ─────────────────────────────────────

type Corner = 'tl' | 'tr' | 'bl' | 'br';

function CropOverlay({
  canvasWidth, canvasHeight,
}: {
  canvasWidth: number; canvasHeight: number;
}) {
  const crop = useEditorStore((s) => s.crop);
  const setCrop = useEditorStore((s) => s.setCrop);
  const overlayRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef<{
    corner: Corner;
    startPointer: { x: number; y: number };
    startCrop: { x: number; y: number; width: number; height: number };
  } | null>(null);

  const MIN_CROP = 0.05; // minimum 5% of canvas on each side (relative coords)

  const getRelativeCoords = useCallback((clientX: number, clientY: number) => {
    const el = overlayRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    };
  }, []);

  const handleCornerPointerDown = useCallback((
    e: React.PointerEvent,
    corner: Corner
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!crop) return;
    dragRef.current = {
      corner,
      startPointer: getRelativeCoords(e.clientX, e.clientY),
      startCrop: { ...crop },
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [crop, getRelativeCoords]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || !crop) return;
    e.preventDefault();

    const drag = dragRef.current;
    const pointer = getRelativeCoords(e.clientX, e.clientY);
    const deltaX = pointer.x - drag.startPointer.x;
    const deltaY = pointer.y - drag.startPointer.y;
    const start = drag.startCrop;
    const ar = crop.aspectRatio;

    let x = start.x;
    let y = start.y;
    let w = start.width;
    let h = start.height;

    switch (drag.corner) {
      case 'tl': {
        x = Math.max(0, start.x + deltaX);
        y = Math.max(0, start.y + deltaY);
        w = start.width + (start.x - x);
        h = start.height + (start.y - y);
        break;
      }
      case 'tr': {
        y = Math.max(0, start.y + deltaY);
        w = Math.max(0.1, start.width + deltaX);
        h = start.height + (start.y - y);
        break;
      }
      case 'bl': {
        x = Math.max(0, start.x + deltaX);
        w = start.width + (start.x - x);
        h = Math.max(0.1, start.height + deltaY);
        break;
      }
      case 'br': {
        w = Math.max(0.1, start.width + deltaX);
        h = Math.max(0.1, start.height + deltaY);
        break;
      }
    }

    // Enforce minimum size
    if (w < MIN_CROP) {
      if (drag.corner === 'tl' || drag.corner === 'bl') {
        x = start.x + start.width - MIN_CROP;
      }
      w = MIN_CROP;
    }
    if (h < MIN_CROP) {
      if (drag.corner === 'tl' || drag.corner === 'tr') {
        y = start.y + start.height - MIN_CROP;
      }
      h = MIN_CROP;
    }

    // Enforce aspect ratio
    if (ar !== null && ar > 0) {
      const newRatio = w / h;
      if (newRatio > ar) {
        // Too wide, constrain width
        w = h * ar;
      } else if (newRatio < ar) {
        // Too tall, constrain height
        h = w / ar;
      }

      // Recalculate position based on corner
      switch (drag.corner) {
        case 'tl': {
          x = start.x + start.width - w;
          y = start.y + start.height - h;
          break;
        }
        case 'tr': {
          y = start.y + start.height - h;
          break;
        }
        case 'bl': {
          x = start.x + start.width - w;
          break;
        }
        case 'br':
          break;
      }

      // Clamp top-left to canvas
      if (x < 0) { x = 0; w = Math.min(w, 1); }
      if (y < 0) { y = 0; h = Math.min(h, 1); }
    }

    // Clamp to canvas bounds
    if (x + w > 1) { w = 1 - x; if (w < MIN_CROP) w = MIN_CROP; }
    if (y + h > 1) { h = 1 - y; if (h < MIN_CROP) h = MIN_CROP; }
    if (x < 0) { x = 0; w = Math.min(w, 1); }
    if (y < 0) { y = 0; h = Math.min(h, 1); }

    setCrop({
      x: Math.round(x * 1000) / 1000,
      y: Math.round(y * 1000) / 1000,
      width: Math.round(w * 1000) / 1000,
      height: Math.round(h * 1000) / 1000,
      aspectRatio: ar,
    });
  }, [crop, getRelativeCoords, setCrop]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    e.preventDefault();
    dragRef.current = null;
  }, []);

  if (!crop) return null;

  const px = (v: number) => Math.round(v * canvasWidth);
  const py = (v: number) => Math.round(v * canvasHeight);

  const left = px(crop.x);
  const top = py(crop.y);
  const cw = px(crop.width);
  const ch = py(crop.height);
  const right = canvasWidth - left - cw;
  const bottom = canvasHeight - top - ch;

  const cursorMap: Record<Corner, string> = {
    tl: 'nwse-resize',
    tr: 'nesw-resize',
    bl: 'nesw-resize',
    br: 'nwse-resize',
  };

  const HANDLE_SIZE = 20;

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 z-10"
      style={{ touchAction: 'none' }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Darkened edges */}
      <div className="absolute top-0 left-0 right-0 bg-black/50" style={{ height: top }} />
      <div className="absolute bottom-0 left-0 right-0 bg-black/50" style={{ height: bottom }} />
      <div className="absolute bg-black/50" style={{ top, bottom, left: 0, width: left }} />
      <div className="absolute bg-black/50" style={{ top, bottom, right: 0, width: right }} />

      {/* Crop border */}
      <div className="absolute border-2 border-white/70" style={{ top, left, width: cw, height: ch }} />

      {/* Corner handles */}
      <CornerHandle
        corner="tl"
        style={{ top: top - HANDLE_SIZE / 2, left: left - HANDLE_SIZE / 2, cursor: cursorMap.tl }}
        onPointerDown={handleCornerPointerDown}
      />
      <CornerHandle
        corner="tr"
        style={{ top: top - HANDLE_SIZE / 2, left: left + cw - HANDLE_SIZE / 2, cursor: cursorMap.tr }}
        onPointerDown={handleCornerPointerDown}
      />
      <CornerHandle
        corner="bl"
        style={{ top: top + ch - HANDLE_SIZE / 2, left: left - HANDLE_SIZE / 2, cursor: cursorMap.bl }}
        onPointerDown={handleCornerPointerDown}
      />
      <CornerHandle
        corner="br"
        style={{ top: top + ch - HANDLE_SIZE / 2, left: left + cw - HANDLE_SIZE / 2, cursor: cursorMap.br }}
        onPointerDown={handleCornerPointerDown}
      />

      {/* Center label */}
      <div
        className="absolute text-white/60 text-[11px] font-medium"
        style={{ top: top + ch / 2 - 8, left: left + cw / 2 - 24 }}
      >
        {crop.aspectRatio ? `${crop.width.toFixed(2)}:${crop.height.toFixed(2)}` : 'Free'}
      </div>
    </div>
  );
}

function CornerHandle({
  corner, style, onPointerDown,
}: {
  corner: Corner;
  style: React.CSSProperties;
  onPointerDown: (e: React.PointerEvent, corner: Corner) => void;
}) {
  return (
    <div
      className="absolute z-20 flex items-center justify-center"
      style={{
        width: 20,
        height: 20,
        ...style,
        touchAction: 'none',
      }}
      onPointerDown={(e) => onPointerDown(e, corner)}
    >
      {/* Handle target (larger invisible hit area) */}
      <div
        className="absolute inset-0"
        style={{ touchAction: 'none' }}
      />
      {/* Visible diamond */}
      <div
        className="bg-white border-2 border-black/30 shadow-lg"
        style={{
          width: 14,
          height: 14,
          transform: 'rotate(45deg)',
          borderRadius: 2,
        }}
      />
    </div>
  );
}

// ─── Drag Overlay for Text & Stickers ────────────────────────────

function DragOverlay({
  canvasWidth, canvasHeight, overlayRef,
}: {
  canvasWidth: number; canvasHeight: number;
  overlayRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const dragTarget = useRef<'text' | 'sticker' | null>(null);
  const dragId = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  const textOverlays = useEditorStore((s) => s.textOverlays);
  const stickers = useEditorStore((s) => s.stickers);
  const updateTextOverlay = useEditorStore((s) => s.updateTextOverlay);
  const updateSticker = useEditorStore((s) => s.updateSticker);

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = overlayRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }, [overlayRef]);

  const measureTextWidth = useCallback((text: string, fontSize: number, fontFamily: string): number => {
    const canvas = overlayRef.current;
    if (!canvas) return text.length * fontSize * 0.4;
    const ctx = canvas.getContext('2d');
    if (!ctx) return text.length * fontSize * 0.4;
    ctx.font = `bold ${fontSize}px ${fontFamily}, sans-serif`;
    return ctx.measureText(text).width;
  }, [overlayRef]);

  const hitTestText = useCallback((cx: number, cy: number): string | null => {
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
  }, [textOverlays, measureTextWidth]);

  const hitTestSticker = useCallback((cx: number, cy: number): string | null => {
    for (let i = stickers.length - 1; i >= 0; i--) {
      const s = stickers[i];
      const halfW = (s.width * s.scale) / 2;
      const halfH = (s.height * s.scale) / 2;
      if (cx >= s.x - halfW && cx <= s.x + halfW && cy >= s.y - halfH && cy <= s.y + halfH) {
        return s.id;
      }
    }
    return null;
  }, [stickers]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const coords = getCanvasCoords(e.clientX, e.clientY);

    const hitSticker = hitTestSticker(coords.x, coords.y);
    if (hitSticker) {
      setIsDragging(true);
      dragTarget.current = 'sticker';
      dragId.current = hitSticker;
      const s = stickers.find((st) => st.id === hitSticker);
      if (s) dragOffset.current = { x: coords.x - s.x, y: coords.y - s.y };
      return;
    }

    const hitText = hitTestText(coords.x, coords.y);
    if (hitText) {
      setIsDragging(true);
      dragTarget.current = 'text';
      dragId.current = hitText;
      const t = textOverlays.find((ot) => ot.id === hitText);
      if (t) dragOffset.current = { x: coords.x - t.x, y: coords.y - t.y };
    }
  }, [getCanvasCoords, hitTestSticker, hitTestText, stickers, textOverlays]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
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
  }, [isDragging, getCanvasCoords, updateTextOverlay, updateSticker]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    dragTarget.current = null;
    dragId.current = null;
  }, []);

  return (
    <div
      className="absolute inset-0 z-10"
      style={{
        width: canvasWidth, height: canvasHeight, maxWidth: '100%', maxHeight: '100%',
        touchAction: 'none', pointerEvents: 'auto',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}

// ─── Canvas Grid Overlay for Collage ──────────────────────────────

function CanvasGridOverlay({
  canvasWidth, canvasHeight,
}: {
  canvasWidth: number; canvasHeight: number;
}) {
  const collageLayout = useEditorStore((s) => s.collage.layout);
  const collageGap = useEditorStore((s) => s.collage.gap);
  const cells = getCollageLayout(collageLayout, canvasWidth, canvasHeight, collageGap);

  return (
    <div className="absolute inset-0 z-10 pointer-events-none" style={{ touchAction: 'none' }}>
      {cells.map((cell, i) => (
        <div
          key={i}
          className="absolute border border-white/20 bg-white/5"
          style={{ left: cell.x, top: cell.y, width: cell.width, height: cell.height }}
        >
          <span className="absolute bottom-1 right-1 text-[10px] text-white/20 font-mono">{i + 1}</span>
        </div>
      ))}
    </div>
  );
}
