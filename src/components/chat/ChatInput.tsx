/**
 * ChatInput — V4 Professional Text & Speech Input
 */
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PaperAirplaneIcon,
  MicrophoneIcon,
  StopIcon,
  MapPinIcon,
} from '@heroicons/react/24/solid';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useLocale } from '@/hooks/useLocale';
import { useJanamitraStore } from '@/lib/store';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { locale, t } = useLocale();
  const {
    isListening,
    transcript,
    isSupported: speechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition(locale);

  const { locationShared, setUserLocation } = useJanamitraStore();
  const promptHistory = useJanamitraStore((s) => s.promptHistory);
  const pushPromptHistory = useJanamitraStore((s) => s.pushPromptHistory);
  const [locationLoading, setLocationLoading] = useState(false);

  // ↑/↓ arrow prompt history navigation index (-1 = composing new)
  const [historyIndex, setHistoryIndex] = useState(-1);
  // Saved draft when user starts navigating history
  const draftRef = useRef('');

  const handleShareLocation = () => {
    if (locationShared || locationLoading) return;
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation(pos.coords.latitude, pos.coords.longitude);
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  // Sync transcript from speech recognition to local text state
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (transcript) setText(transcript); }, [transcript]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleSend = () => {
    if (!text.trim() || disabled) return;
    pushPromptHistory(text.trim());
    onSend(text.trim());
    setText('');
    setHistoryIndex(-1);
    draftRef.current = '';
    resetTranscript();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }

    // ↑ Arrow in empty input or while browsing history → recall previous prompt
    if (e.key === 'ArrowUp' && promptHistory.length > 0) {
      const ta = textareaRef.current;
      // Only trigger when cursor is at the very start (or input is empty)
      if (ta && (text === '' || (ta.selectionStart === 0 && ta.selectionEnd === 0))) {
        e.preventDefault();
        if (historyIndex === -1) {
          // Save current draft before navigating
          draftRef.current = text;
          const idx = promptHistory.length - 1;
          setHistoryIndex(idx);
          setText(promptHistory[idx]);
        } else if (historyIndex > 0) {
          const idx = historyIndex - 1;
          setHistoryIndex(idx);
          setText(promptHistory[idx]);
        }
        return;
      }
    }

    // ↓ Arrow → move forward in history or back to draft
    if (e.key === 'ArrowDown' && historyIndex >= 0) {
      const ta = textareaRef.current;
      const atEnd = ta && ta.selectionStart === ta.value.length;
      if (atEnd || text === promptHistory[historyIndex]) {
        e.preventDefault();
        if (historyIndex < promptHistory.length - 1) {
          const idx = historyIndex + 1;
          setHistoryIndex(idx);
          setText(promptHistory[idx]);
        } else {
          // Back to draft
          setHistoryIndex(-1);
          setText(draftRef.current);
        }
        return;
      }
    }
  };

  const toggleMic = () => {
    if (isListening) stopListening();
    else startListening();
  };

  return (
    <div className="w-full">
      <div
        className={`
          flex items-end gap-2 rounded-xl border bg-[var(--surface-primary)] p-2 shadow-sm
          transition-all duration-200
          ${disabled ? 'opacity-60' : ''}
          border-[var(--border-primary)]
        `}
      >
        {/* Speech button */}
        {speechSupported && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleMic}
            disabled={disabled}
            aria-label={isListening ? 'Stop recording' : t.voiceInput}
            className={`
              flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
              transition-colors duration-200
              ${isListening
                ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                : 'text-[var(--text-tertiary)] hover:bg-[var(--surface-tertiary)] hover:text-[var(--text-secondary)]'
              }
            `}
          >
            <AnimatePresence mode="wait">
              {isListening ? (
                <motion.div
                  key="stop"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <StopIcon className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div
                  key="mic"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <MicrophoneIcon className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        )}

        {/* Text area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.chatPlaceholder}
          disabled={disabled}
          rows={1}
          className={`
            min-h-[36px] flex-1 resize-none bg-transparent px-2 py-1.5
            text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)]
            outline-none focus:ring-0 focus-visible:outline-none
            ${locale === 'ml' ? 'font-ml' : ''}
          `}
          aria-label="Chat message input"
        />

        {/* Location share button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleShareLocation}
          disabled={disabled || locationShared || locationLoading}
          aria-label={locationShared ? 'Location shared' : 'Share location'}
          title={locationShared
            ? (locale === 'ml' ? 'ലൊക്കേഷൻ ഷെയർ ചെയ്തു ✓' : 'Location shared ✓')
            : (locale === 'ml' ? 'ലൊക്കേഷൻ ഷെയർ ചെയ്യുക' : 'Share location')}
          className={`
            flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
            transition-colors duration-200
            ${locationShared
              ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400'
              : locationLoading
                ? 'animate-pulse bg-blue-100 text-blue-500 dark:bg-blue-500/20 dark:text-blue-400'
                : 'text-[var(--text-tertiary)] hover:bg-[var(--surface-tertiary)] hover:text-[var(--text-secondary)]'
            }
          `}
        >
          <MapPinIcon className="h-4 w-4" />
        </motion.button>

        {/* Send button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          aria-label={t.send}
          className={`
            flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
            transition-colors duration-200
            ${text.trim()
              ? 'bg-[var(--color-primary-500)] text-white shadow-sm hover:bg-[var(--color-primary-600)]'
              : 'bg-[var(--surface-tertiary)] text-[var(--text-tertiary)]'
            }
          `}
        >
          <PaperAirplaneIcon className="h-4 w-4" />
        </motion.button>
      </div>

      {/* Recording indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 flex items-center justify-center gap-2 text-xs text-red-500"
          >
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block h-2 w-2 rounded-full bg-red-500"
            />
            {locale === 'ml' ? 'ശബ്ദം രേഖപ്പെടുത്തുന്നു...' : 'Recording...'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
