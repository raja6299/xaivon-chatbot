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
  const inputRef = useRef<HTMLTextAreaElement>(null);
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
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  };

  // Quick suggestion handler
  const handleQuickSuggestion = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  // Handle lead form submission - links lead to the chat session
  const handleLeadFormSubmit = async (formData: {
    fullName: string;
    email: string;
    company: string;
    phone: string;
  }) => {
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          company: formData.company,
          phone: formData.phone,
          sessionId: sessionId,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit lead');
      }
    } catch (err) {
      console.error('Lead submission fetch error:', err);
      throw err; // Re-throw for LeadFormModal to handle
    }
  };

  // Handle lead form close
  const handleLeadFormClose = () => {
    setIsLeadFormOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#0f1629] to-[#0a0e1a] rounded-2xl shadow-2xl border border-violet-500/20 overflow-hidden">
      
      {/* Header */}
      <div className="px-5 py-4 border-b border-violet-500/15 bg-gradient-to-r from-[#111a33]/90 to-[#0f1629]/90 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-violet-500/20">
                X
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#111a33]"></div>
            </div>
            <div>
              <h2 className="text-white font-semibold text-sm tracking-wide">XAIVON</h2>
              <p className="text-violet-300/60 text-[11px] font-medium">AI Architecture Assistant</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-5 px-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center">
                <span className="text-3xl">✨</span>
              </div>
              <div>
                <p className="text-white font-semibold text-base">Welcome to XAIVON</p>
                <p className="text-slate-400 text-xs mt-1.5 leading-relaxed max-w-[260px] mx-auto">
                  AI-powered solutions for enterprise automation. How can I help you today?
                </p>
              </div>
              <div className="space-y-2 pt-1">
                <button 
                  onClick={() => handleQuickSuggestion('What services do you offer?')}
                  className="block w-full px-4 py-2.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/30 text-violet-200 text-xs rounded-xl transition-all duration-200 font-medium text-left"
                >
                  📋 What services do you offer?
                </button>
                <button 
                  onClick={() => handleQuickSuggestion('What does an AI chatbot cost?')}
                  className="block w-full px-4 py-2.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/30 text-violet-200 text-xs rounded-xl transition-all duration-200 font-medium text-left"
                >
                  💰 What does an AI chatbot cost?
                </button>
                <button 
                  onClick={() => handleQuickSuggestion('How can AI help my business?')}
                  className="block w-full px-4 py-2.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 hover:border-violet-500/30 text-violet-200 text-xs rounded-xl transition-all duration-200 font-medium text-left"
                >
                  🚀 How can AI help my business?
                </button>
              </div>
            </div>
          </div>
        )}

        {messages
          .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
          .map((msg) => {
            const rawText = getMessageText(msg);
            const cleanedContent = rawText.replace(/\[TRIGGER_LEAD_FORM\]/g, '').trim();

            return (
              <ChatMessage
                key={msg.id}
                role={msg.role as 'user' | 'assistant'}
                content={cleanedContent}
              />
            );
          })}

        {isLoading && (
          <div className="flex items-start gap-3 px-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">X</div>
            <div className="flex gap-1.5 items-center px-4 py-3 bg-[#151d35] border border-violet-500/10 rounded-2xl rounded-tl-md">
              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: '0.15s'}}></div>
              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 text-red-300 text-xs px-4 py-3 rounded-xl flex items-center gap-2">
            <span>⚠️</span>
            <span>Connection error. Please check your API key and try again.</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={onSubmit} className="px-4 py-3 border-t border-violet-500/10 bg-[#0d1322]/80 backdrop-blur-sm">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder="Ask anything..."
            disabled={isLoading || isLeadFormOpen}
            rows={1}
            className="flex-1 px-4 py-2.5 bg-[#151d35] text-white text-sm rounded-xl placeholder-slate-500 disabled:opacity-40 focus:outline-none focus:ring-1 focus:ring-violet-500/50 border border-violet-500/10 focus:border-violet-500/30 transition-all duration-200 resize-none"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || isLeadFormOpen}
            className="p-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:hover:from-violet-600 disabled:hover:to-purple-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/15 hover:shadow-violet-500/25"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
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