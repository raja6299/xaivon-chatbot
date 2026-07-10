"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage, type TextUIPart } from 'ai';
import { ChatMessage } from './ChatMessage';
import { LeadFormModal } from './LeadFormModal';

// Extract plain text from a v7 UIMessage (which stores content in `parts`, not `content`)
function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is TextUIPart => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

const LEAD_TRIGGER = '[TRIGGER_LEAD_FORM]';

export function ChatWindow({ onClose }: { onClose: () => void }) {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Loading state: v7 uses `status` ('submitted' | 'streaming' | 'ready' | 'error')
  const isLoading = status === 'submitted' || status === 'streaming';

  // Auto-scroll logic
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLeadFormOpen]);

  // Create new session when component mounts
  useEffect(() => {
    const createSession = async () => {
      try {
        const response = await fetch('/api/sessions', { method: 'POST' });
        const data = await response.json();
        if (data.sessionId) {
          setSessionId(data.sessionId);
          console.log('Session created:', data.sessionId);
        }
      } catch (err) {
        console.error('Failed to create session:', err);
      }
    };

    createSession();
  }, []);

  // Open lead form when the latest assistant message contains the trigger
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      lastMessage.role === 'assistant' &&
      getMessageText(lastMessage).includes(LEAD_TRIGGER) &&
      !isLeadFormOpen
    ) {
      setIsLeadFormOpen(true);
    }
  }, [messages, isLeadFormOpen]);

  // Clean form submission handler (v7: manage input locally, sendMessage with text)
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return; // Empty guard
    sendMessage({ text: input });
    setInput('');
  };

  // Handle lead form submission - links lead to the chat session
  const handleLeadFormSubmit = async (formData: {
    fullName: string;
    email: string;
    company: string;
    phone: string;
  }) => {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: formData.fullName,
        email: formData.email,
        company: formData.company,
        phone: formData.phone,
        sessionId: sessionId, // Links lead to chat session
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      // Throw so LeadFormModal can display the error and keep modal open for retry
      throw new Error(data.error || 'Failed to submit lead');
    }
    // LeadFormModal handles success state internally (auto-closes after 2s)
  };

  // Handle lead form close - only re-enable input if form wasn't submitted successfully
  const handleLeadFormClose = () => {
    setIsLeadFormOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#111827] text-white overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const rawText = getMessageText(msg);
          const cleanedContent = rawText.replace(/\[TRIGGER_LEAD_FORM\]/g, '').trim();

          return (
            <ChatMessage
              key={idx}
              role={msg.role as 'user' | 'assistant'}
              content={cleanedContent}
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
          onChange={(e) => setInput(e.target.value)}
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