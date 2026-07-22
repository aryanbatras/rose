'use client';

import { useState, useCallback } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { Trash2 } from 'lucide-react';

// Categorized sticker/emoji sets
const STICKER_CATEGORIES: Record<string, string[]> = {
  Smileys: ['😀', '😂', '🥰', '😎', '🤩', '😢', '😤', '🤔', '😴', '🥳', '😱', '🤗', '😏', '🙃', '😈', '🤡', '💀', '👻'],
  Gestures: ['👍', '👎', '👏', '🙌', '🤝', '✌️', '🤞', '🫶', '💪', '🖐️', '👋', '🤙', '👌', '❤️', '💔', '🔥', '✨', '💯'],
  Animals: ['🐶', '🐱', '🐼', '🐨', '🦊', '🐸', '🦁', '🐯', '🐮', '🦄', '🐧', '🐰', '🦋', '🐙', '🦀', '🐳', '🦈', '🐲'],
  Food: ['🍕', '🍔', '🌮', '🍣', '🍜', '🍩', '🍪', '🍰', '🥤', '☕', '🍺', '🍷', '🥑', '🍓', '🍒', '🌶️', '🧀', '🥩'],
  Nature: ['🌸', '🌺', '🌻', '🌹', '🌷', '🌿', '🍀', '🌵', '🌴', '🌲', '🍁', '🌊', '☀️', '🌈', '🌙', '⭐', '⚡', '❄️'],
  Objects: ['📱', '💻', '📸', '🎵', '🎶', '🎮', '🎯', '🎲', '🎨', '✏️', '📖', '🔑', '💡', '🎁', '🏆', '👑', '🗿', '🎪'],
};

const CATEGORY_NAMES = Object.keys(STICKER_CATEGORIES);

export function StickerPicker() {
  const [activeCategory, setActiveCategory] = useState(0);
  const stickers = useEditorStore((s) => s.stickers);
  const addSticker = useEditorStore((s) => s.addSticker);
  const removeSticker = useEditorStore((s) => s.removeSticker);

  const categoryName = CATEGORY_NAMES[activeCategory];
  const stickersInCategory = categoryName ? STICKER_CATEGORIES[categoryName] : [];

  const handleAddSticker = useCallback(
    (emoji: string) => {
      addSticker({
        src: emoji,
        type: 'emoji',
        x: 300 + Math.random() * 60 - 30,
        y: 300 + Math.random() * 60 - 30,
        width: 48,
        height: 48,
        rotation: (Math.random() - 0.5) * 0.4,
        scale: 1,
        opacity: 1,
      });
    },
    [addSticker]
  );

  return (
    <div className="px-4 py-4 space-y-3 max-h-[260px] overflow-y-auto">
      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {CATEGORY_NAMES.map((name, i) => (
          <button
            key={name}
            onClick={() => setActiveCategory(i)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeCategory === i
                ? 'bg-brand text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Sticker grid */}
      <div className="flex flex-wrap gap-2">
        {stickersInCategory.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleAddSticker(emoji)}
            className="w-10 h-10 flex items-center justify-center text-xl
              bg-white/5 rounded-lg hover:bg-white/15 hover:scale-110
              transition-all active:scale-95"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Active stickers list */}
      {stickers.length > 0 && (
        <div className="border-t border-white/10 pt-3 space-y-2">
          <p className="text-xs text-white/40">Added stickers:</p>
          <div className="flex flex-wrap gap-2">
            {stickers.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5"
              >
                <span className="text-lg">{s.src}</span>
                <button
                  onClick={() => removeSticker(s.id)}
                  className="text-white/40 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
