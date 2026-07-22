'use client';

import { useState, useCallback } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { Check, Trash2 } from 'lucide-react';

const FONTS = [
  { name: 'Arial', value: 'Arial' },
  { name: 'Georgia', value: 'Georgia' },
  { name: 'Impact', value: 'Impact, sans-serif' },
  { name: 'Courier', value: 'Courier New, monospace' },
  { name: 'Times', value: 'Times New Roman, serif' },
];

const COLORS = [
  '#ffffff', '#000000', '#ff4444', '#ff8800', '#ffdd00',
  '#44cc44', '#4488ff', '#8844ff', '#ff44ff', '#44dddd',
];

const FONT_SIZES = [24, 32, 48, 64, 80, 120];

export function TextTool() {
  const [text, setText] = useState('');
  const [fontFamily, setFontFamily] = useState('Arial');
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#ffffff');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [showStrokeOptions, setShowStrokeOptions] = useState(false);

  const addTextOverlay = useEditorStore((s) => s.addTextOverlay);
  const textOverlays = useEditorStore((s) => s.textOverlays);
  const removeTextOverlay = useEditorStore((s) => s.removeTextOverlay);

  const handleAddText = useCallback(() => {
    if (!text.trim()) return;
    addTextOverlay({
      text: text.trim(),
      x: 300,
      y: 300,
      fontSize,
      fontFamily,
      color,
      strokeColor,
      strokeWidth,
      opacity: 1,
      rotation: 0,
      scale: 1,
    });
    setText('');
  }, [text, fontSize, fontFamily, color, strokeColor, strokeWidth, addTextOverlay]);

  return (
    <div className="px-4 py-4 space-y-4 max-h-[260px] overflow-y-auto">
      {/* Text input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
          placeholder="Type your text..."
          className="flex-1 bg-white/10 text-white text-sm rounded-lg px-4 py-2.5
            placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand/50
            border border-white/10"
          maxLength={100}
        />
        <button
          onClick={handleAddText}
          disabled={!text.trim()}
          className="bg-brand text-white p-2.5 rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
        >
          <Check className="h-4 w-4" />
        </button>
      </div>

      {/* Font family */}
      <div className="flex gap-2 flex-wrap">
        {FONTS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFontFamily(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
              fontFamily === f.value
                ? 'bg-brand text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
            style={{ fontFamily: f.value }}
          >
            {f.name}
          </button>
        ))}
      </div>

      {/* Font size */}
      <div className="flex gap-2 flex-wrap">
        {FONT_SIZES.map((s) => (
          <button
            key={s}
            onClick={() => setFontSize(s)}
            className={`w-10 h-8 rounded-lg text-xs transition-all ${
              fontSize === s
                ? 'bg-brand text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Text color */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-white/40 mr-1">Color:</span>
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => setColor(c)}
            className={`w-7 h-7 rounded-full transition-all ${
              color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : ''
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
        />
      </div>

      {/* Stroke toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowStrokeOptions(!showStrokeOptions)}
          className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
            showStrokeOptions
              ? 'bg-brand text-white'
              : 'bg-white/10 text-white/60 hover:bg-white/20'
          }`}
        >
          Outline
        </button>
        <input
          type="range"
          min={0}
          max={8}
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(Number(e.target.value))}
          className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />
        <input
          type="color"
          value={strokeColor}
          onChange={(e) => setStrokeColor(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
        />
      </div>

      {/* Existing text overlays */}
      {textOverlays.length > 0 && (
        <div className="border-t border-white/10 pt-3 space-y-2">
          <p className="text-xs text-white/40">Added text:</p>
          {textOverlays.map((t) => (
            <div key={t.id} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
              <span className="text-sm text-white/80 truncate max-w-[200px]">{t.text}</span>
              <button
                onClick={() => removeTextOverlay(t.id)}
                className="text-white/40 hover:text-red-400 transition-colors p-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
