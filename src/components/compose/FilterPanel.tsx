'use client';

import { useEditorStore } from '@/stores/editor-store';
import { FILTER_PRESETS } from '@/utils/imageFilters';

interface FilterPanelProps {
  showAdjust?: boolean;
}

export function FilterPanel({ showAdjust = false }: FilterPanelProps) {
  const activePreset = useEditorStore((s) => s.filter.activePreset);
  const setFilterPreset = useEditorStore((s) => s.setFilterPreset);
  const brightness = useEditorStore((s) => s.filter.brightness);
  const contrast = useEditorStore((s) => s.filter.contrast);
  const saturation = useEditorStore((s) => s.filter.saturation);
  const setBrightness = useEditorStore((s) => s.setBrightness);
  const setContrast = useEditorStore((s) => s.setContrast);
  const setSaturation = useEditorStore((s) => s.setSaturation);

  if (showAdjust) {
    return (
      <div className="px-6 py-5 space-y-5">
        <h3 className="text-sm font-semibold text-white/80">Adjustments</h3>
        <SliderControl label="Brightness" value={brightness} min={-50} max={50} onChange={setBrightness} />
        <SliderControl label="Contrast" value={contrast} min={-50} max={50} onChange={setContrast} />
        <SliderControl label="Saturation" value={saturation} min={-100} max={100} onChange={setSaturation} />
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="flex gap-2 flex-wrap">
        {FILTER_PRESETS.map((filter) => {
          const isActive = activePreset === filter.name;
          return (
            <button
              key={filter.name}
              onClick={() => setFilterPreset(filter.name)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white/80'
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs text-white/60">{label}</label>
        <span className="text-xs text-white/40 tabular-nums">{value > 0 ? `+${value}` : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-brand
          [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  );
}
