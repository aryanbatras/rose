'use client';

import { useEffect, useRef } from 'react';
import { useViewModeStore } from '@/stores/view-mode-store';
import { useShortcutsStore } from '@/stores/shortcuts-store';

interface ShortcutHandlers {
  onNextPost?: () => void;
  onPrevPost?: () => void;
  onLike?: () => void;
  onReply?: () => void;
  onSearch?: () => void;
  onCompose?: () => void;
  onEscape?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onShowHelp?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers = {}) {
  const { setMode } = useViewModeStore();
  const { enabled, bindings } = useShortcutsStore();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(e: KeyboardEvent) {
      const h = handlersRef.current;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') h.onEscape?.();
        return;
      }

      for (const binding of bindings) {
        const keyMatch = e.key === binding.key || e.key.toLowerCase() === binding.key;
        const ctrlMatch = binding.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = binding.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = binding.alt ? e.altKey : !e.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          switch (binding.id) {
            case 'nextPost': h.onNextPost?.(); break;
            case 'prevPost': h.onPrevPost?.(); break;
            case 'like': h.onLike?.(); break;
            case 'reply': h.onReply?.(); break;
            case 'search': h.onSearch?.(); break;
            case 'compose': h.onCompose?.(); break;
            case 'escape': h.onEscape?.(); break;
            case 'bookmark': h.onBookmark?.(); break;
            case 'share': h.onShare?.(); break;
            case 'viewClassic': setMode('classic'); break;
            case 'viewGrid': setMode('grid'); break;
            case 'help': h.onShowHelp?.(); break;
          }
          return;
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, bindings, setMode]);
}
