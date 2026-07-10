"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { ChatMessage } from './ChatMessage';
import { LeadFormModal } from './LeadFormModal';

export function ChatWindow({ onClose }: { onClose: () => void }) {
  const { messages, input, handleInputChange, handleSubmit, error, isLoading } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  // Auto-scroll logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLeadFormOpen]);

  // Clean form submission handler
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return; // Empty guard
    handleSubmit(e);
  };

  // Handle lead form submission
  const handleLeadFormSubmit = async (formData: {
    fullName: string;
    email: string;
    company: string;
    phone: string;
  }) => {
    setIsSubmittingForm(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          session_id: crypto.randomUUID() // Generate session ID for uniqueness
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save lead');
      }

      // Success - will auto-close after 2 seconds in LeadFormModal
    } catch (err) {
      console.error('Lead submission error:', err);
      throw err;
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Handle lead form close - only re-enable input if form wasn't submitted successfully
  const handleLeadFormClose = () => {
    setIsLeadFormOpen(false);
    // Note: Input re-enabling happens in the disabled logic below based on form state
  };

  return (
    <div className="flex flex-col h-full bg-[#111827] text-white overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          // Check if message has lead trigger
          const hasLeadTrigger = msg.content.includes('[TRIGGER_LEAD_FORM]');
          const cleanedContent = msg.content.replace(/\[TRIGGER_LEAD_FORM\]/g, '').trim();

          // If this is the latest assistant message and has trigger, open lead form after rendering
          if (
            idx === messages.length - 1 &&
            msg.role === 'assistant' &&
            hasLeadTrigger &&
            !isLeadFormOpen
          ) {
            // Use setTimeout to ensure the message is rendered before opening modal
            setTimeout(() => setIsLeadFormOpen(true), 0);
          }

          return (
            <ChatMessage
              key={idx}
              role={msg.role as 'user' | 'assistant'}
              content={hasLeadTrigger ? cleanedContent : msg.content}
            />
          );
        })}
        {error && (
          <div className="p-3 bg-red-900 border border-red-500 rounded text-red-200">
            Error: Check API Key in .env.local
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={onSubmit} className="p-4 border-t border-gray-800 shrink-0">
        {/* Textarea with proper disabling logic */}
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
          disabled={isLoading || isLeadFormOpen || input.trim() === ''}
        />
        <div className="flex items-center justify-between mt-2">
          {/* Submit button with proper disabling logic */}
          <button
            type="submit"
            disabled={isLoading || isLeadFormOpen || input.trim() === ''}
            className="mt-2 w-full bg-blue-600 py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </form>

      {/* Lead Form Modal */}
      <LeadFormModal
        isOpen={isLeadFormOpen}
        onClose={handleLeadFormClose}
        onSubmit={handleLeadFormSubmit}
      />
    </div>
  );
}