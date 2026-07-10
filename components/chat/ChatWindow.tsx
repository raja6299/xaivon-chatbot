"use client";

import React, { useEffect, useRef } from 'react';
import { useChat } from '@ai-sdk/react';
import { ChatMessage } from './ChatMessage';

export function ChatWindow({ onClose }: { onClose: () => void }) {
  const { messages, input, handleInputChange, handleSubmit, error } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean form submission handler
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return; // Empty guard
    handleSubmit(e);
  };

  return (
    <div className="flex flex-col h-full bg-[#111827] text-white overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <ChatMessage key={idx} role={msg.role as 'user' | 'assistant'} content={msg.content} />
        ))}
        {error && (
          <div className="p-3 bg-red-900 border border-red-500 rounded text-red-200">
            Error: Check API Key in .env.local
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={onSubmit} className="p-4 border-t border-gray-800 shrink-0">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => {
             if (e.key === 'Enter' && !e.shiftKey) {
               e.preventDefault();
               e.currentTarget.form?.requestSubmit();
             }
          }}
          placeholder="Type your message..."
          className="w-full bg-gray-900 text-white rounded p-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={1}
        />
        <button type="submit" className="mt-2 w-full bg-blue-600 py-2 rounded font-semibold hover:bg-blue-700">
          Send Message
        </button>
      </form>
    </div>
  );
}
