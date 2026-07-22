'use client';

import { useCallback } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { Undo2, Trash2, Eraser } from 'lucide-react';

const BRUSH_COLORS = [
  '#ffffff', '#000000', '#ff4444', '#ff8800', '#ffdd00',
  '#44cc44', '#4488ff', '#8844ff', '#ff44ff',
];

const BRUSH_SIZES = [2, 4, 6, 10, 16, 24];

export function DoodleTool() {
  const brushColor = useEditorStore((s) => s.brush.color);
  const brushSize = useEditorStore((s) => s.brush.size);
  const brushEraser = useEditorStore((s) => s.brush.eraser);
  const setBrushColor = useEditorStore((s) => s.setBrushColor);
  const setBrushSize = useEditorStore((s) => s.setBrushSize);
  const setBrushEraser = useEditorStore((s) => s.setBrushEraser);

  const doodleStrokes = useEditorStore((s) => s.doodleStrokes);
  const removeDoodleStroke = useEditorStore((s) => s.removeDoodleStroke);
  const clearDoodleStrokes = useEditorStore((s) => s.clearDoodleStrokes);

  const handleUndo = useCallback(() => {
    const strokes = doodleStrokes;
    if (strokes.length > 0) {
      removeDoodleStroke(strokes[strokes.length - 1].id);
    }
  }, [doodleStrokes, removeDoodleStroke]);

  return (
    <div className="px-4 py-4 space-y-4 max-h-[260px] overflow-y-auto">
      {/* Brush colors */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-white/40 mr-1">Color:</span>
        {BRUSH_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => {
              setBrushColor(c);
              setBrushEraser(false);
            }}
            className={`w-7 h-7 rounded-full transition-all ${
              brushColor === c && !brushEraser
                ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110'
                : 'hover:scale-110'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      {/* Brush sizes */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-white/40">Size:</span>
        {BRUSH_SIZES.map((s) => (
          <button
            key={s}
            onClick={() => setBrushSize(s)}
            className={`rounded-full transition-all ${
              brushSize === s ? 'bg-white/20 ring-1 ring-white' : 'bg-white/10 hover:bg-white/20'
            }`}
            style={{
              width: Math.max(20, s + 10),
              height: Math.max(20, s + 10),
            }}
          >
            <div
              className="rounded-full bg-white mx-auto"
              style={{ width: s, height: s }}
            />
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setBrushEraser(!brushEraser)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            brushEraser
              ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          <Eraser className="h-4 w-4" />
          Eraser
        </button>

        <button
          onClick={handleUndo}
          disabled={doodleStrokes.length === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
            bg-white/10 text-white/60 hover:bg-white/20 transition-all disabled:opacity-30"
        >
          <Undo2 className="h-4 w-4" />
          Undo
        </button>

        <button
          onClick={clearDoodleStrokes}
          disabled={doodleStrokes.length === 0}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
            bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-30"
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </button>

        <span className="text-xs text-white/30 ml-auto">
          {doodleStrokes.length} stroke{doodleStrokes.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
