'use client';

import { useEditorStore } from '@/stores/editor-store';
import { COLLAGE_PRESETS } from '@/utils/canvasUtils';
import { LayoutGrid, Columns3, Rows3, Grid3X3 } from 'lucide-react';

const LAYOUT_ICONS: Record<string, React.ReactNode> = {
  '1x1': <LayoutGrid className="h-4 w-4" />,
  '1x2': <Rows3 className="h-4 w-4 rotate-90" />,
  '2x1': <Rows3 className="h-4 w-4" />,
  '2x2': <Grid3X3 className="h-4 w-4" />,
  '3x1': <Columns3 className="h-4 w-4" />,
  '1x3': <Columns3 className="h-4 w-4 rotate-90" />,
};

const LAYOUT_NAMES: Record<string, string> = {
  '1x1': 'Single',
  '1x2': '1 × 2',
  '2x1': '2 × 1',
  '2x2': '2 × 2',
  '3x1': '3 × 1',
  '1x3': '1 × 3',
};

export function CollageTool() {
  const collage = useEditorStore((s) => s.collage);
  const setCollageLayout = useEditorStore((s) => s.setCollageLayout);
  const setCollageGap = useEditorStore((s) => s.setCollageGap);

  return (
    <div className="px-4 py-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white/80 mb-3">Layout</h3>
        <div className="flex gap-3 flex-wrap">
          {COLLAGE_PRESETS.map((layout) => (
            <button
              key={layout}
              onClick={() => setCollageLayout(layout)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all min-w-[72px] ${
                collage.layout === layout
                  ? 'bg-brand text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {LAYOUT_ICONS[layout] || <LayoutGrid className="h-4 w-4" />}
              <span className="text-[10px] font-medium">
                {LAYOUT_NAMES[layout] || layout}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Gap/spacing between images */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs text-white/60">Spacing</label>
          <span className="text-xs text-white/40 tabular-nums">{collage.gap}px</span>
        </div>
        <input
          type="range"
          min={0}
          max={20}
          value={collage.gap}
          onChange={(e) => setCollageGap(Number(e.target.value))}
          className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand
            [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>

      <p className="text-xs text-white/30 leading-relaxed">
        Collage applies to the overall multi-image layout when editing multiple images together.
      </p>
    </div>
  );
}
