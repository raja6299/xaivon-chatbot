"use client";

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChatWindow } from './ChatWindow';

/** Routes where the chat widget should not appear */
const HIDDEN_ROUTES = ['/login', '/admin'];

export function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // Lazy-mount: mount ChatWindow on first open, never unmount after that
  useEffect(() => {
    if (isOpen && !hasMounted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasMounted(true);
    }
  }, [isOpen, hasMounted]);

  // Close chat when clicking outside (only hides, never destroys)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close with Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) setIsOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Hide on excluded routes
  const isHidden = HIDDEN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  if (isHidden) return null;

  return (
    <div ref={widgetRef} className="fixed bottom-5 right-5 z-50">
      {/*
        Chat Window — always mounted once opened, never unmounts.
        Uses motion.div animate (not AnimatePresence) so ChatWindow
        component stays alive and useChat state is preserved.
      */}
      <motion.div
        initial={false}
        animate={
          isOpen
            ? { opacity: 1, scale: 1, y: 0 }
            : { opacity: 0, scale: 0.92, y: 16 }
        }
        transition={{ type: 'spring', damping: 30, stiffness: 260 }}
        className={`absolute bottom-[72px] right-0 w-[420px] max-w-[calc(100vw-32px)] chat-widget-viewport rounded-2xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] border border-violet-500/20 overflow-hidden ${
          !isOpen ? 'pointer-events-none' : ''
        }`}
        style={{ transformOrigin: 'bottom right' }}
      >
        {hasMounted && <ChatWindow onClose={() => setIsOpen(false)} />}
      </motion.div>

      {/* Launcher Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`
          w-14 h-14 rounded-full font-bold text-white
          shadow-xl transition-all duration-300
          flex items-center justify-center
          ${isOpen
            ? 'bg-slate-700 hover:bg-slate-600 shadow-slate-900/40'
            : 'bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 shadow-violet-500/25'
          }
          border border-white/10
        `}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        <motion.div
          animate={{ rotate: isOpen ? 0 : 0 }}
          transition={{ duration: 0.15 }}
        >
          {isOpen ? (
            <svg
              className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"
            >
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
              <circle cx="8" cy="10" r="1"/>
              <circle cx="12" cy="10" r="1"/>
              <circle cx="16" cy="10" r="1"/>
            </svg>
          )}
        </motion.div>
      </motion.button>
    </div>
  );
}

