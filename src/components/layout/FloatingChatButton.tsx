/**
 * FloatingChatButton — FAB for chat access from any page
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';

export function FloatingChatButton() {
  const pathname = usePathname();

  // Don't show on the chat page itself
  if (pathname === '/chat') return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
      className="fixed bottom-6 right-6 z-40"
    >
      <Link
        href="/chat"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-500)] text-white shadow-lg transition-all hover:bg-[var(--color-primary-600)] hover:shadow-xl hover:scale-105 active:scale-95"
        aria-label="Open Chat Assistant"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
      </Link>
    </motion.div>
  );
}
