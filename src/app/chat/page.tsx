/**
 * Chat Page — V4 Professional Layout
 * Persistent sidebar + centered chat + professional input bar
 * Keyboard shortcuts + export + incognito
 */
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { ChatInput, MessageList, QuickActions, ChatSidebar, FileUpload } from '@/components/chat';
import { useChat } from '@/hooks/useChat';
import { useChatPersistence } from '@/hooks/useChatPersistence';
import { useJanamitraStore } from '@/lib/store';
import { sendMultimodalChat } from '@/lib/api-client';
import { exportChatJSON, exportChatText } from '@/lib/export';
import type { ActionItem } from '@/types';
import {
  Bars3Icon,
  SparklesIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPage() {
  const { messages, send, isTyping } = useChat();
  const quickActions = useJanamitraStore((s) => s.quickActions);
  const locale = useJanamitraStore((s) => s.locale);
  const sessionId = useJanamitraStore((s) => s.sessionId);
  const userId = useJanamitraStore((s) => s.userId);
  const resetSession = useJanamitraStore((s) => s.resetSession);
  const addMessage = useJanamitraStore((s) => s.addMessage);
  const setTyping = useJanamitraStore((s) => s.setTyping);
  const toggleSidebar = useJanamitraStore((s) => s.toggleSidebar);
  const incognitoMode = useJanamitraStore((s) => s.incognitoMode);
  const setShortcutHandlers = useJanamitraStore((s) => s.setShortcutHandlers);
  const clearShortcutHandlers = useJanamitraStore((s) => s.clearShortcutHandlers);

  const inputRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Chat persistence — auto-save & load conversations
  const { selectConversation, removeConversation, toggleStar, togglePin } = useChatPersistence();

  // Register page-specific shortcut handlers
  useEffect(() => {
    setShortcutHandlers({
      onNewChat: () => resetSession(),
      onFocusInput: () => {
        const textarea = inputRef.current?.querySelector('textarea');
        textarea?.focus();
      },
      onStopGenerating: () => {
        // Stop the typing indicator (API call abort is handled in useChat)
        useJanamitraStore.getState().setTyping(false);
      },
    });
    return () => clearShortcutHandlers();
  }, [setShortcutHandlers, clearShortcutHandlers, resetSession]);

  const handleQuickAction = (action: ActionItem) => {
    const prompts: Record<string, Record<string, string>> = {
      check_epic: {
        en: 'I want to check my voter registration status',
        ml: 'എന്റെ വോട്ടർ രജിസ്ട്രേഷൻ സ്ഥിതി പരിശോധിക്കണം',
      },
      locate_booth: {
        en: 'Help me find my polling booth',
        ml: 'എന്റെ പോളിംഗ് ബൂത്ത് കണ്ടെത്താൻ സഹായിക്കൂ',
      },
      report_violation: {
        en: 'I want to report an election violation',
        ml: 'ഒരു തിരഞ്ഞെടുപ്പ് ലംഘനം റിപ്പോർട്ട് ചെയ്യണം',
      },
      faq: {
        en: 'Show me frequently asked questions',
        ml: 'പൊതു ചോദ്യങ്ങൾ കാണിക്കുക',
      },
    };
    const prompt = prompts[action.action]?.[locale] || action.label;
    send(prompt);
  };

  const handleFileUpload = useCallback(
    async (base64: string, type: 'image' | 'document' | 'audio', _mimeType: string) => {
      const userMessage = locale === 'ml'
        ? `[📎 ${type === 'image' ? 'ചിത്രം' : 'ഡോക്യുമെന്റ്'} അപ്‌ലോഡ് ചെയ്തു]`
        : `[📎 ${type === 'image' ? 'Image' : 'Document'} uploaded]`;

      addMessage({
        id: crypto.randomUUID(),
        role: 'user',
        content: userMessage,
        locale,
        timestamp: new Date().toISOString(),
      });
      setTyping(true);

      try {
        const response = await sendMultimodalChat({
          message: type === 'image'
            ? (locale === 'ml' ? 'ഈ ഡോക്യുമെന്റിൽ നിന്ന് വിവരങ്ങൾ എക്‌സ്ട്രാക്ട് ചെയ്യുക' : 'Extract information from this document')
            : (locale === 'ml' ? 'ഈ ഫയൽ വിശകലനം ചെയ്യുക' : 'Analyze this file'),
          locale,
          sessionId,
          imageBase64: type === 'image' ? base64 : undefined,
          userId,
        });

        addMessage({
          id: response.messageId,
          role: 'assistant',
          content: response.text,
          locale,
          timestamp: response.timestamp,
        });
      } catch {
        addMessage({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: locale === 'ml'
            ? 'ക്ഷമിക്കണം, ഫയൽ പ്രോസസ്സ് ചെയ്യാൻ കഴിഞ്ഞില്ല.'
            : 'Sorry, I could not process the file.',
          locale,
          timestamp: new Date().toISOString(),
        });
      } finally {
        setTyping(false);
      }
    },
    [locale, sessionId, userId, addMessage, setTyping]
  );

  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      selectConversation(conversationId);
    },
    [selectConversation]
  );

  const handleNewConversation = useCallback(() => {
    resetSession();
  }, [resetSession]);

  return (
    <div className="flex h-screen flex-col bg-[var(--surface-secondary)]">
      <Header />

      {/* Incognito banner */}
      <AnimatePresence>
        {incognitoMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center gap-2 bg-amber-500/10 px-4 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            {locale === 'ml' ? 'ഇൻകോഗ്നിറ്റോ മോഡ് — മെമ്മറി ഓഫ്' : 'Incognito Mode — Memory disabled'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main area: sidebar + chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Persistent sidebar */}
        <ChatSidebar
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onToggleStar={toggleStar}
          onTogglePin={togglePin}
          onDeleteConversation={removeConversation}
        />

        {/* Chat area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Mobile sidebar toggle + Export */}
          <div className="flex items-center justify-between px-4 pt-2">
            <button
              onClick={toggleSidebar}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-tertiary)] transition-colors md:hidden"
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>

            {/* Export button */}
            {messages.length > 0 && (
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-[var(--text-tertiary)] hover:bg-[var(--surface-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                  aria-label="Export chat"
                >
                  <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </button>
                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute right-0 top-full mt-1 z-10 w-40 rounded-lg border border-[var(--border-primary)] bg-[var(--surface-primary)] py-1 shadow-lg"
                    >
                      <button
                        onClick={() => { exportChatJSON(messages, sessionId); setShowExportMenu(false); }}
                        className="w-full px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)] transition-colors"
                      >
                        Export as JSON
                      </button>
                      <button
                        onClick={() => { exportChatText(messages); setShowExportMenu(false); }}
                        className="w-full px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-tertiary)] transition-colors"
                      >
                        Export as Text
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {messages.length === 0 ? (
            /* ── Welcome Screen ── */
            <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
                className="text-center max-w-lg"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl shadow-md">
                  <Image src="/janamitra.jpg" alt="Janamitra" width={56} height={56} className="h-14 w-14 object-cover" />
                </div>
                <h2 className={`text-2xl font-bold text-[var(--text-primary)] ${locale === 'ml' ? 'font-ml' : ''}`}>
                  {locale === 'ml' ? 'ജനമിത്രയിലേക്ക് സ്വാഗതം!' : 'Welcome to Janamitra'}
                </h2>
                <p className={`mt-2 text-sm text-[var(--text-secondary)] leading-relaxed ${locale === 'ml' ? 'font-ml' : ''}`}>
                  {locale === 'ml'
                    ? 'കോട്ടയം ജില്ലയിലെ വോട്ടർ വിവരങ്ങൾക്ക് നിങ്ങളുടെ AI സഹായി'
                    : 'Your AI voter information assistant for Kottayam District'}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] text-[var(--text-tertiary)]">
                  <span className="flex items-center gap-1">
                    <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                    {locale === 'ml' ? 'നിഷ്പക്ഷം' : 'Impartial'}
                  </span>
                  <span className="h-3 w-px bg-[var(--border-primary)]" />
                  <span className="flex items-center gap-1">
                    <SparklesIcon className="h-3.5 w-3.5 text-[var(--color-primary-400)]" />
                    {locale === 'ml' ? 'AI അധിഷ്ഠിതം' : 'AI Powered'}
                  </span>
                  <span className="h-3 w-px bg-[var(--border-primary)]" />
                  <span>{locale === 'ml' ? 'ഔദ്യോഗിക ഡാറ്റ' : 'Official Data'}</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mt-8 w-full max-w-2xl"
              >
                <QuickActions actions={quickActions} onAction={handleQuickAction} />
              </motion.div>
            </div>
          ) : (
            /* ── Messages ── */
            <MessageList messages={messages} isTyping={isTyping} onAction={send} />
          )}

          {/* ── Input Bar ── */}
          <div className="border-t border-[var(--border-primary)] bg-[var(--surface-primary)] px-4 py-3">
            <div className="mx-auto flex max-w-3xl items-end gap-2" ref={inputRef}>
              {/* File upload */}
              <FileUpload onUpload={handleFileUpload} disabled={isTyping} />

              {/* Chat input (flex-1) */}
              <div className="flex-1">
                <ChatInput onSend={send} disabled={isTyping} />
              </div>
            </div>
            <p className="mx-auto mt-1.5 max-w-3xl text-center text-[10px] text-[var(--text-tertiary)]">
              {locale === 'ml'
                ? 'ജനമിത്ര നിഷ്പക്ഷ വോട്ടർ വിവരങ്ങൾ നൽകുന്നു. ഔദ്യോഗിക സൈറ്റുകളിൽ പരിശോധിക്കുക.'
                : 'Janamitra provides impartial voter info. Verify on official sources.'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
