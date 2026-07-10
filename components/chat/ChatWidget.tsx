"use client";

import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ChatWindow } from './ChatWindow';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {/* Chat Window with transition */}
      <div 
        className={`transition-all duration-300 ease-in-out origin-bottom-right ${
          isOpen 
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
      >
        {isOpen && <ChatWindow onClose={() => setIsOpen(false)} />}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-lg transition-transform duration-300 hover:scale-105 active:scale-95"
      >
        {isOpen ? (
          <X size={24} className="animate-in fade-in zoom-in duration-300" />
        ) : (
          <MessageCircle size={24} className="animate-in fade-in zoom-in duration-300" />
        )}
      </button>
    </div>
  );
}
