/**
 * useKeyboardShortcuts — Global Keyboard Shortcuts
 * ────────────────────────────────────────────────
 * Ctrl+Shift+O  → New chat
 * Ctrl+K        → Focus input
 * Ctrl+/        → Toggle shortcut help
 * Ctrl+Shift+L  → Toggle dark mode
 * Ctrl+Shift+S  → Toggle sidebar
 */
'use client';

import { useEffect, useCallback } from 'react';
import { useJanamitraStore } from '@/lib/store';

interface ShortcutHandlers {
  onNewChat?: () => void;
  onFocusInput?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers = {}) {
  const toggleDarkMode = useJanamitraStore((s) => s.toggleDarkMode);
  const toggleSidebar = useJanamitraStore((s) => s.toggleSidebar);
  const setShortcutHelpOpen = useJanamitraStore((s) => s.setShortcutHelpOpen);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip when typing in input/textarea (unless it's a global shortcut)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Ctrl+Shift+O → New chat (works even in input)
      if (ctrl && shift && (e.key === 'O' || e.key === 'o')) {
        e.preventDefault();
        handlers.onNewChat?.();
        return;
      }

      // Ctrl+K → Focus input (works globally)
      if (ctrl && !shift && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        handlers.onFocusInput?.();
        return;
      }

      // Ctrl+/ → Toggle shortcut help (handle both / and ? for different keyboards)
      if (ctrl && !shift && (e.key === '/' || e.code === 'Slash')) {
        e.preventDefault();
        const current = useJanamitraStore.getState().shortcutHelpOpen;
        setShortcutHelpOpen(!current);
        return;
      }

      // Ctrl+Shift+L → Toggle dark mode
      if (ctrl && shift && (e.key === 'L' || e.key === 'l')) {
        e.preventDefault();
        toggleDarkMode();
        return;
      }

      // Ctrl+Shift+S → Toggle sidebar
      if (ctrl && shift && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Esc → Close shortcut help if open (don't prevent if in input)
      if (e.key === 'Escape' && !shift && !ctrl) {
        const isOpen = useJanamitraStore.getState().shortcutHelpOpen;
        if (isOpen) {
          e.preventDefault();
          setShortcutHelpOpen(false);
          return;
        }
      }
    },
    [handlers, toggleDarkMode, toggleSidebar, setShortcutHelpOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);
}

/** Keyboard shortcut definitions for display */
export const SHORTCUTS = [
  { keys: ['Ctrl', 'Shift', 'O'], label: 'New Chat', labelMl: 'പുതിയ ചാറ്റ്' },
  { keys: ['Ctrl', 'K'], label: 'Focus Input', labelMl: 'ഇൻപുട്ട് ഫോക്കസ്' },
  { keys: ['Ctrl', '/'], label: 'Shortcut Help', labelMl: 'ഷോർട്ട്കട്ട് സഹായം' },
  { keys: ['Ctrl', 'Shift', 'L'], label: 'Toggle Dark Mode', labelMl: 'ഡാർക്ക് മോഡ്' },
  { keys: ['Ctrl', 'Shift', 'S'], label: 'Toggle Sidebar', labelMl: 'സൈഡ്ബാർ' },
  { keys: ['Enter'], label: 'Send Message', labelMl: 'സന്ദേശം അയയ്ക്കുക' },
  { keys: ['Shift', 'Enter'], label: 'New Line', labelMl: 'പുതിയ വരി' },
  { keys: ['Esc'], label: 'Close Dialog', labelMl: 'ഡയലോഗ് അടയ്ക്കുക' },
] as const;
