"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage, type TextUIPart } from 'ai';
import { ChatMessage } from './ChatMessage';
import { LeadFormModal } from './LeadFormModal';

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is TextUIPart => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

const LEAD_TRIGGER = '[TRIGGER_LEAD_FORM]';

const QUICK_SUGGESTIONS = [
  { icon: '📋', text: 'What services does XAIVON offer?' },
  { icon: '💰', text: 'How much does AI automation cost?' },
  { icon: '🚀', text: 'How can AI help my logistics business?' },
  { icon: '🤖', text: 'What is QuoteFlow AI?' },
];

export function ChatWindow({ onClose }: { onClose: () => void }) {
  // Use a fixed generic ID for the chat instance to maintain state internally if needed
  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: 'xaivon-persistent-chat',
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const isLoading = status === 'submitted' || status === 'streaming';

  // Smooth auto-scroll
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  // Load chat history & session on mount (Persistence)
  useEffect(() => {
    // 1. Restore messages
    try {
      const storedMessages = localStorage.getItem('xaivon_chat_messages');
      if (storedMessages) {
        const parsed = JSON.parse(storedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Ignore parse errors
    }

    // 2. Restore or create session
    const initializeSession = async () => {
      const storedSession = localStorage.getItem('xaivon_chat_session_id');
      if (storedSession) {
        setSessionId(storedSession);
        return;
      }
      
      try {
        const response = await fetch('/api/sessions', { method: 'POST' });
        const data = await response.json();
        if (data.sessionId) {
          setSessionId(data.sessionId);
          localStorage.setItem('xaivon_chat_session_id', data.sessionId);
        }
      } catch {
        // Session creation is non-critical
      }
    };
    
    initializeSession();
  }, [setMessages]);

  // Save chat history on change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('xaivon_chat_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Lead form trigger detection
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

  // Submit handler
  const onSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput('');
  }, [input, isLoading, sendMessage]);

  // Quick suggestion
  const handleQuickSuggestion = useCallback((text: string) => {
    if (isLoading) return;
    sendMessage({ text });
  }, [isLoading, sendMessage]);

  // Lead form submit
  const handleLeadFormSubmit = async (formData: {
    fullName: string;
    email: string;
    company: string;
    phone: string;
  }) => {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, sessionId }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to submit');
    }
  };

  // Retry after error
  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      sendMessage({ text: getMessageText(lastUserMsg) });
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-b from-[#0f1629] to-[#0a0e1a] overflow-hidden relative">

      {/* ─── HEADER (sticky) ─── */}
      <div className="shrink-0 px-4 py-3 border-b border-violet-500/10 bg-[#111a33]/80 backdrop-blur-md z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-violet-500/20">
                X
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-[2px] border-[#111a33]" aria-label="Online"></div>
            </div>
            <div>
              <h2 className="text-white font-semibold text-[13px] tracking-wide leading-tight">XAIVON</h2>
              <p className="text-violet-300/50 text-[10px] font-medium leading-tight">AI Solutions Consultant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
            aria-label="Close chat"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      {/* ─── MESSAGES AREA (scrollable) ─── */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin min-h-0"
      >
        {/* Empty State */}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 px-2 animate-fade-in-up">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/15 to-purple-600/15 border border-violet-500/15 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <div>
                <p className="text-white font-semibold text-[15px]">Welcome to XAIVON</p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-[240px] mx-auto">
                  AI infrastructure for enterprises that scale. How can I help you today?
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {QUICK_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion.text}
                    onClick={() => handleQuickSuggestion(suggestion.text)}
                    className="px-3 py-2.5 bg-violet-500/8 hover:bg-violet-500/15 border border-violet-500/12 hover:border-violet-500/25 text-violet-200 text-[11px] rounded-xl transition-all duration-200 font-medium text-left leading-snug group"
                  >
                    <span className="block text-sm mb-0.5 group-hover:scale-110 transition-transform duration-200 inline-block">{suggestion.icon}</span>
                    <span className="block">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
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

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex items-start gap-2.5 animate-fade-in-up">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">X</div>
            <div className="flex gap-1 items-center px-4 py-3 bg-[#151d35] border border-violet-500/8 rounded-2xl rounded-tl-sm">
              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse-dot"></div>
              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse-dot" style={{animationDelay: '0.2s'}}></div>
              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse-dot" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="animate-fade-in-up">
            <div className="bg-red-900/15 border border-red-500/15 rounded-xl px-3.5 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <svg className="w-4 h-4 text-red-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                <span className="text-red-300 text-xs">Something went wrong. Please try again.</span>
              </div>
              <button
                onClick={handleRetry}
                className="shrink-0 text-[11px] font-medium text-violet-300 hover:text-white bg-violet-500/10 hover:bg-violet-500/20 px-2.5 py-1 rounded-lg transition-all duration-200"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ─── INPUT AREA (sticky) ─── */}
      <div className="shrink-0 border-t border-violet-500/8 bg-[#0d1322]/90 backdrop-blur-md">
        <form onSubmit={onSubmit} className="px-3.5 py-3">
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
              placeholder="Ask about our AI solutions..."
              disabled={isLoading || isLeadFormOpen}
              rows={1}
              className="flex-1 px-3.5 py-2.5 bg-[#151d35] text-white text-sm rounded-xl placeholder-slate-500 disabled:opacity-30 focus:outline-none focus:ring-1 focus:ring-violet-500/40 border border-violet-500/8 focus:border-violet-500/25 transition-all duration-200 resize-none"
              aria-label="Type your message"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || isLeadFormOpen}
              className="p-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-30 disabled:hover:from-violet-600 disabled:hover:to-purple-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20"
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>
          </div>
        </form>
        <div className="text-center pb-2">
          <span className="text-[9px] text-slate-600">Powered by XAIVON AI</span>
        </div>
      </div>

      {/* ─── LEAD FORM OVERLAY (inside chatbot) ─── */}
      <LeadFormModal
        isOpen={isLeadFormOpen}
        onClose={() => setIsLeadFormOpen(false)}
        onSubmit={handleLeadFormSubmit}
      />
    </div>
  );
}