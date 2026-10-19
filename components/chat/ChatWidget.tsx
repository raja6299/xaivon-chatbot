"use client";

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatWindow } from './ChatWindow';
import { MessageSquare, X } from 'lucide-react';

const HIDDEN_ROUTES = ['/login', '/admin', '/embed'];

export function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
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

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) setIsOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Strict route hiding
  if (!pathname || HIDDEN_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))) {
    return null;
  }

  const handleToggle = () => {
    if (!isOpen && !hasMounted) {
      setHasMounted(true);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div ref={widgetRef} className="fixed bottom-5 right-5 z-50">
      <motion.div
        initial={false}
        animate={
          isOpen
            ? { opacity: 1, scale: 1, y: 0 }
            : { opacity: 0, scale: 0.94, y: 14 }
        }
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className={`absolute bottom-[68px] right-0 w-[420px] max-w-[calc(100vw-32px)] chat-widget-viewport rounded-2xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden ${
          !isOpen ? 'pointer-events-none' : ''
        }`}
        style={{ transformOrigin: 'bottom right' }}
      >
        {hasMounted && <ChatWindow onClose={() => setIsOpen(false)} isEmbed={false} />}
      </motion.div>

      {/* Launcher Button */}
      <motion.button
        onClick={handleToggle}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className={`
          w-13 h-13 rounded-full font-bold text-white
          shadow-xl transition-all duration-200
          flex items-center justify-center
          ${
            isOpen
              ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)]'
              : 'bg-[var(--copper-primary)] hover:bg-[var(--copper-light)] text-white shadow-[var(--shadow-button)] border border-white/10'
          }
        `}
        aria-label={isOpen ? 'Close chat consultation' : 'Open AI business consultant'}
        title={isOpen ? 'Close chat' : 'Talk with AI consultant'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 45, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageSquare className="w-5 h-5 fill-current" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
