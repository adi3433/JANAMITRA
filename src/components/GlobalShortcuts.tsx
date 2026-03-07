/**
 * GlobalShortcuts — Mounts keyboard shortcuts & help modal app-wide
 */
'use client';

import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ShortcutHelp } from '@/components/ShortcutHelp';

export function GlobalShortcuts() {
  // Mount global shortcuts (dark mode, sidebar, help dialog)
  // Page-specific handlers (onNewChat, onFocusInput) are passed by individual pages
  useKeyboardShortcuts();

  return <ShortcutHelp />;
}
