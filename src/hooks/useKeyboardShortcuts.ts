/**
 * useKeyboardShortcuts — Global Keyboard Shortcuts
 * ────────────────────────────────────────────────
 * Ctrl+Shift+O      → New chat
 * Ctrl+K            → Focus input
 * Ctrl+/            → Toggle shortcut help
 * Ctrl+Shift+L      → Toggle dark mode
 * Ctrl+Shift+S      → Toggle sidebar
 * Ctrl+Shift+C      → Copy last AI response
 * Ctrl+Shift+Backspace → Clear conversation
 * Esc               → Stop generating / close dialog
 * ↑ Arrow           → Recall last prompt (in input)
 * ↓ Arrow           → Cycle forward in prompt history
 */
'use client';

import { useEffect, useCallback } from 'react';
import { useJanamitraStore } from '@/lib/store';

export function useKeyboardShortcuts() {
  const toggleDarkMode = useJanamitraStore((s) => s.toggleDarkMode);
  const toggleSidebar = useJanamitraStore((s) => s.toggleSidebar);
  const setShortcutHelpOpen = useJanamitraStore((s) => s.setShortcutHelpOpen);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Ctrl+Shift+O → New chat (works even in input)
      if (ctrl && shift && (e.key === 'O' || e.key === 'o')) {
        e.preventDefault();
        useJanamitraStore.getState()._shortcutOnNewChat?.();
        return;
      }

      // Ctrl+K → Focus input (works globally)
      if (ctrl && !shift && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        useJanamitraStore.getState()._shortcutOnFocusInput?.();
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

      // Ctrl+Shift+C → Copy last AI response to clipboard
      if (ctrl && shift && (e.key === 'C' || e.key === 'c')) {
        e.preventDefault();
        const msgs = useJanamitraStore.getState().messages;
        const lastAssistant = [...msgs].reverse().find((m) => m.role === 'assistant');
        if (lastAssistant) {
          navigator.clipboard.writeText(lastAssistant.content).catch(() => {});
        }
        return;
      }

      // Ctrl+Shift+Backspace → Clear conversation
      if (ctrl && shift && e.key === 'Backspace') {
        e.preventDefault();
        useJanamitraStore.getState().clearMessages();
        return;
      }

      // Esc → Stop generating / close shortcut help
      if (e.key === 'Escape' && !shift && !ctrl) {
        // First: try to stop generation if in progress
        const state = useJanamitraStore.getState();
        if (state.isTyping && state._shortcutOnStopGenerating) {
          e.preventDefault();
          state._shortcutOnStopGenerating();
          return;
        }
        // Second: close shortcut help if open
        if (state.shortcutHelpOpen) {
          e.preventDefault();
          setShortcutHelpOpen(false);
          return;
        }
      }
    },
    [toggleDarkMode, toggleSidebar, setShortcutHelpOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleKeyDown]);
}

/** Keyboard shortcut definitions for display */
export const SHORTCUTS = [
  { keys: ['↑'], label: 'Previous Prompt', labelMl: 'മുൻ പ്രോംപ്റ്റ്', group: 'chat' },
  { keys: ['↓'], label: 'Next Prompt', labelMl: 'അടുത്ത പ്രോംപ്റ്റ്', group: 'chat' },
  { keys: ['Enter'], label: 'Send Message', labelMl: 'സന്ദേശം അയയ്ക്കുക', group: 'chat' },
  { keys: ['Shift', 'Enter'], label: 'New Line', labelMl: 'പുതിയ വരി', group: 'chat' },
  { keys: ['Esc'], label: 'Stop Generating / Close', labelMl: 'ജനറേറ്റിംഗ് നിർത്തുക', group: 'chat' },
  { keys: ['Ctrl', 'Shift', 'C'], label: 'Copy Last Response', labelMl: 'അവസാന ഉത്തരം കോപ്പി', group: 'chat' },
  { keys: ['Ctrl', 'Shift', '⌫'], label: 'Clear Chat', labelMl: 'ചാറ്റ് മായ്ക്കുക', group: 'chat' },
  { keys: ['Ctrl', 'K'], label: 'Focus Input', labelMl: 'ഇൻപുട്ട് ഫോക്കസ്', group: 'nav' },
  { keys: ['Ctrl', 'Shift', 'O'], label: 'New Chat', labelMl: 'പുതിയ ചാറ്റ്', group: 'nav' },
  { keys: ['Ctrl', 'Shift', 'S'], label: 'Toggle Sidebar', labelMl: 'സൈഡ്ബാർ', group: 'nav' },
  { keys: ['Ctrl', 'Shift', 'L'], label: 'Toggle Dark Mode', labelMl: 'ഡാർക്ക് മോഡ്', group: 'nav' },
  { keys: ['Ctrl', '/'], label: 'Shortcut Help', labelMl: 'ഷോർട്ട്കട്ട് സഹായം', group: 'nav' },
] as const;
