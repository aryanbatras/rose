'use client';

import { useCallback } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { RotateCw, RotateCcw, FlipHorizontal, FlipVertical, Crop, Maximize } from 'lucide-react';

const ASPECT_RATIOS = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '3:2', value: 3 / 2 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
];

export function CropTool() {
  const crop = useEditorStore((s) => s.crop);
  const setCrop = useEditorStore((s) => s.setCrop);
  const rotation = useEditorStore((s) => s.rotation);
  const setRotation = useEditorStore((s) => s.setRotation);
  const flipH = useEditorStore((s) => s.flipH);
  const setFlipH = useEditorStore((s) => s.setFlipH);
  const flipV = useEditorStore((s) => s.flipV);
  const setFlipV = useEditorStore((s) => s.setFlipV);

  // Rotate 90° clockwise
  const handleRotateCW = useCallback(() => {
    setRotation((rotation + 90) % 360);
  }, [rotation, setRotation]);

  // Rotate 90° counter-clockwise
  const handleRotateCCW = useCallback(() => {
    setRotation((rotation - 90 + 360) % 360);
  }, [rotation, setRotation]);

  // Toggle flipping
  const handleFlipH = useCallback(() => setFlipH(!flipH), [flipH, setFlipH]);
  const handleFlipV = useCallback(() => setFlipV(!flipV), [flipV, setFlipV]);

  // Apply crop — set a default crop region if not already set
  const handleApplyCrop = useCallback(() => {
    if (!crop) {
      setCrop({ x: 0.1, y: 0.1, width: 0.8, height: 0.8, aspectRatio: null });
    }
  }, [crop, setCrop]);

  // Clear crop
  const handleClearCrop = useCallback(() => {
    setCrop(null);
  }, [setCrop]);

  return (
    <div className="px-4 py-4 space-y-4 max-h-[260px] overflow-y-auto">
      {/* Rotate & Flip buttons */}
      <div>
        <h3 className="text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">Transform</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleRotateCCW}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all text-xs font-medium"
          >
            <RotateCcw className="h-4 w-4" />
            Rotate Left
          </button>
          <button
            onClick={handleRotateCW}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-all text-xs font-medium"
          >
            <RotateCw className="h-4 w-4" />
            Rotate Right
          </button>
          <button
            onClick={handleFlipH}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-medium ${
              flipH
                ? 'bg-brand text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            <FlipHorizontal className="h-4 w-4" />
            Flip H
          </button>
          <button
            onClick={handleFlipV}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-xs font-medium ${
              flipV
                ? 'bg-brand text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
            }`}
          >
            <FlipVertical className="h-4 w-4" />
            Flip V
          </button>
        </div>
      </div>

      {/* Aspect ratio presets */}
      <div>
        <h3 className="text-xs font-semibold text-white/60 mb-2 uppercase tracking-wider">Aspect Ratio</h3>
        <div className="flex gap-2 flex-wrap">
          {ASPECT_RATIOS.map((ar) => {
            const isActive = crop?.aspectRatio === ar.value;
            return (
              <button
                key={ar.label}
                onClick={() => {
                  if (crop) {
                    setCrop({ ...crop, aspectRatio: ar.value });
                  } else {
                    // Set default crop region with this aspect ratio
                    setCrop({ x: 0.1, y: 0.1, width: 0.8, height: 0.8, aspectRatio: ar.value });
                  }
                }}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white/80'
                }`}
              >
                {ar.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Apply / Clear crop */}
      <div className="flex gap-2">
        <button
          onClick={handleApplyCrop}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            crop
              ? 'bg-brand text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          <Crop className="h-4 w-4" />
          {crop ? 'Edit Crop' : 'Crop Image'}
        </button>

        {crop && (
          <button
            onClick={handleClearCrop}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-xs font-medium"
          >
            <Maximize className="h-4 w-4" />
            Clear Crop
          </button>
        )}

        <div className="flex items-center gap-2 ml-auto text-xs text-white/30">
          <span className="tabular-nums">{rotation}°</span>
          {flipH && <FlipHorizontal className="h-3 w-3" />}
          {flipV && <FlipVertical className="h-3 w-3" />}
        </div>
      </div>
    </div>
  );
}
