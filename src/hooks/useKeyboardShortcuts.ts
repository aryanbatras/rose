'use client';

import { useEffect, useRef } from 'react';
import { useViewModeStore } from '@/stores/view-mode-store';

interface ShortcutHandlers {
  onNextPost?: () => void;
  onPrevPost?: () => void;
  onLike?: () => void;
  onSearch?: () => void;
  onCompose?: () => void;
  onEscape?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers = {}) {
  const { setMode } = useViewModeStore();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const h = handlersRef.current;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        if (e.key === 'Escape') h.onEscape?.();
        return;
      }

      switch (e.key) {
        case 'j':
          h.onNextPost?.();
          break;
        case 'k':
          h.onPrevPost?.();
          break;
        case 'l':
          h.onLike?.();
          break;
        case '/':
          e.preventDefault();
          h.onSearch?.();
          break;
        case 'n':
          h.onCompose?.();
          break;
        case 'Escape':
          h.onEscape?.();
          break;
        case '1':
          setMode('classic');
          break;
        case '2':
          setMode('grid');
          break;
        case '3':
          setMode('reels');
          break;
        case '4':
          setMode('compact');
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setMode]);
}
