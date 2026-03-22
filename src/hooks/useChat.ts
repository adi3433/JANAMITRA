/**
 * useChat — Chat orchestration hook
 * ───────────────────────────────────
 * Handles sending messages, receiving responses,
 * and managing conversation state.
 */
'use client';

import { useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import { useJanamitraStore } from '@/lib/store';
import { sendChatMessage } from '@/lib/api-client';
import type { ChatMessage } from '@/types';

export function useChat() {
  const {
    messages,
    addMessage,
    clearMessages,
    isTyping,
    setTyping,
    sessionId,
    locale,
    userLatitude,
    userLongitude,
  } = useJanamitraStore();

  const send = useCallback(
    async (input: string | { text: string; displayText?: string }) => {
      const text = (typeof input === 'string' ? input : input.text).trim();
      const displayText = (typeof input === 'string' ? undefined : input.displayText)?.trim();

      if (!text) return;

      // Add user message
      const userMsg: ChatMessage = {
        id: uuid(),
        role: 'user',
        // Render localized display text in UI/history while sending canonical text to API.
        content: displayText || text,
        locale,
        timestamp: new Date().toISOString(),
      };
      addMessage(userMsg);
      setTyping(true);

      try {
        const response = await sendChatMessage({
          message: text,
          locale,
          sessionId,
          conversationHistory: [...messages, userMsg].slice(-10), // last 10 msgs
          ...(userLatitude != null && userLongitude != null
            ? { latitude: userLatitude, longitude: userLongitude }
            : {}),
        });

        const assistantMsg: ChatMessage = {
          id: response.messageId,
          role: 'assistant',
          content: response.text,
          locale: response.locale,
          timestamp: response.timestamp,
          confidence: response.confidence,
          sources: response.sources,
          actionable: response.actionable,
          escalate: response.escalate,
        };

        addMessage(assistantMsg);

        // actionable items are already stored on the message itself
        // Don't overwrite the default quick actions
      } catch (_error) {
        const errorMsg: ChatMessage = {
          id: uuid(),
          role: 'assistant',
          content:
            locale === 'ml'
              ? 'ക്ഷമിക്കണം, ഒരു പിശക് സംഭവിച്ചു. ദയവായി വീണ്ടും ശ്രമിക്കുക.'
              : 'Sorry, an error occurred. Please try again.',
          locale,
          timestamp: new Date().toISOString(),
          confidence: 0,
          escalate: false,
        };
        addMessage(errorMsg);
      } finally {
        setTyping(false);
      }
    },
    [messages, addMessage, setTyping, sessionId, locale, userLatitude, userLongitude]
  );

  return {
    messages,
    send,
    clearMessages,
    isTyping,
  };
}
