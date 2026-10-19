"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage, type TextUIPart } from 'ai';
import { ChatMessage } from './ChatMessage';
import { XaivonLogo } from '../brand/XaivonLogo';
import { LeadFormModal } from './LeadFormModal';
import { CalendarModal } from './CalendarModal';
import dynamic from 'next/dynamic';
const VoiceRecorder = dynamic(() => import('./VoiceRecorder').then((m) => m.VoiceRecorder), { ssr: false });
import { FileUploader } from './FileUploader';
import { AttachmentCard } from './AttachmentCard';
import { useVoice } from '../../hooks/useVoice';
import { useFiles } from '../../hooks/useFiles';
import { useTranslation } from '../../lib/i18n';
import { Language } from '../../lib/i18n/types';
import { CHAT_HISTORY_WINDOW } from '@/lib/config/chat';
import { Sun, Moon, RotateCcw, X, Settings } from 'lucide-react';

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is TextUIPart => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

const QUICK_SUGGESTIONS = [
  { icon: '⚡', text: 'Explore automation' },
  { icon: '🗺️', text: 'Help map my workflow' },
  { icon: '📊', text: 'Pricing & scoping' },
  { icon: '✉️', text: 'Contact Raja directly' },
];

function getContextualSuggestions(messages: UIMessage[]): { icon: string; text: string }[] {
  if (messages.length === 0) return QUICK_SUGGESTIONS;

  const lastMsg = messages[messages.length - 1];
  if (lastMsg.role !== 'assistant') return [];

  const text = getMessageText(lastMsg).toLowerCase();

  if (text.includes('pricing') || text.includes('cost') || text.includes('scope') || text.includes('quote')) {
    return [
      { icon: '📅', text: 'Schedule a discovery call' },
      { icon: '✉️', text: 'Contact Raja directly' },
      { icon: '⚡', text: 'Explore logistics automation' },
    ];
  }

  if (text.includes('workflow') || text.includes('logistics') || text.includes('freight')) {
    return [
      { icon: '📊', text: 'Pricing & scoping' },
      { icon: '📅', text: 'Schedule a discovery call' },
      { icon: '🤖', text: 'Build an AI chatbot' },
    ];
  }

  return [
    { icon: '⚡', text: 'Explore automation' },
    { icon: '📊', text: 'Pricing & scoping' },
    { icon: '📅', text: 'Schedule a discovery call' },
    { icon: '✉️', text: 'Contact Raja directly' },
  ];
}

interface ChatWindowProps {
  onClose?: () => void;
  isEmbed?: boolean;
  initialPrompt?: string;
}

export function ChatWindow({ onClose, isEmbed = false, initialPrompt }: ChatWindowProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  const toggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('xaivon-theme', nextTheme);
    } catch {
      // Ignore local storage error
    }
  }, [theme]);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: 'xaivon-persistent-chat',
    transport: new DefaultChatTransport({
      api: '/api/chat',
      fetch: async (url, options) => {
        const token = sessionToken || (typeof window !== 'undefined' ? localStorage.getItem('xaivon_chat_session_token') : null);
        const sId = sessionId || (typeof window !== 'undefined' ? localStorage.getItem('xaivon_chat_session_id') : null);

        const finalOptions = {
          ...options,
          headers: {
            ...(options?.headers || {}),
            ...(token ? { 'x-session-token': token } : {}),
            ...(sId ? { 'x-session-id': sId } : {}),
          }
        };

        if (finalOptions?.body) {
          try {
            const parsed = JSON.parse(finalOptions.body as string);
            if (token) parsed.sessionToken = token;
            if (sId) parsed.sessionId = sId;

            if (parsed.messages && Array.isArray(parsed.messages)) {
              const MAX_WINDOW = CHAT_HISTORY_WINDOW;
              const msgs = parsed.messages;
              if (msgs.length > MAX_WINDOW) {
                let startIndex = msgs.length - MAX_WINDOW;
                while (startIndex > 0) {
                  const msg = msgs[startIndex];
                  const hasToolCalls = msg.toolInvocations && msg.toolInvocations.length > 0;
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const hasToolParts = msg.parts && msg.parts.some((p: any) => p.type === 'tool-invocation' || p.type === 'tool-call');
                  if (msg.role === 'user' || (msg.role === 'assistant' && !hasToolCalls && !hasToolParts)) {
                    break;
                  }
                  startIndex--;
                }
                parsed.messages = msgs.slice(startIndex);
              }
            }
            finalOptions.body = JSON.stringify(parsed);
          } catch (e) {
            console.error("Payload intercept failed", e);
          }
        }
        return fetch(url, finalOptions);
      }
    }),
  });

  const [input, setInput] = useState(() => initialPrompt?.trim() || '');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { t, language, setLanguage } = useTranslation();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePromptEvent = (e: any) => {
      const prompt = e?.detail;
      if (typeof prompt === 'string' && prompt.trim()) {
        setInput(prompt.trim());
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    };

    window.addEventListener('xaivon:set-prompt', handlePromptEvent);
    return () => {
      window.removeEventListener('xaivon:set-prompt', handlePromptEvent);
    };
  }, []);

  // File Management
  const { files, isProcessing, addFiles, removeFile, clearFiles, retryFile } = useFiles();

  // Voice integration
  const { stopOutput, updateSettings, settings, getAvailableVoices } = useVoice();
  const [availableVoices, setAvailableVoices] = useState<{ uri: string; name: string; lang: string }[]>([]);

  useEffect(() => {
    getAvailableVoices().then(voices => {
      const enVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
      enVoices.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aScore = (aName.includes('natural') ? 10 : 0) + (aName.includes('google') ? 5 : 0);
        const bScore = (bName.includes('natural') ? 10 : 0) + (bName.includes('google') ? 5 : 0);
        return bScore - aScore;
      });
      const uniqueVoices = enVoices.filter((v, i, a) => a.findIndex(item => item.name === v.name) === i).slice(0, 8);
      setAvailableVoices(uniqueVoices);
    });
  }, [getAvailableVoices]);

  useEffect(() => {
    let voiceLang = 'en-IN';
    if (language === 'hi') voiceLang = 'hi-IN';
    else if (language === 'en') voiceLang = 'en-US';

    updateSettings({ language: voiceLang });
  }, [language, updateSettings]);

  const isLoading = status === 'submitted' || status === 'streaming';
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isScrolledToBottomRef = useRef(true);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    isScrolledToBottomRef.current = isNearBottom;
    setShowScrollButton(!isNearBottom);
  }, []);

  useEffect(() => {
    if (messagesContainerRef.current && isScrolledToBottomRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: status === 'streaming' ? 'auto' : 'smooth',
      });
    }
  }, [messages, status]);

  // Restore history on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('xaivon_chat_messages');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // Ignore parse failure
    }

    const initSession = async () => {
      const storedSession = localStorage.getItem('xaivon_chat_session_id');
      const storedToken = localStorage.getItem('xaivon_chat_session_token');
      if (storedSession && storedToken) {
        setSessionId(storedSession);
        setSessionToken(storedToken);
        return;
      }

      try {
        const res = await fetch('/api/sessions', { method: 'POST' });
        const data = await res.json();
        if (data.sessionId) {
          setSessionId(data.sessionId);
          localStorage.setItem('xaivon_chat_session_id', data.sessionId);
        }
        if (data.sessionToken) {
          setSessionToken(data.sessionToken);
          localStorage.setItem('xaivon_chat_session_token', data.sessionToken);
        }
      } catch {
        // Session creation is non-blocking
      }
    };

    initSession();
  }, [setMessages]);

  // Persist messages debounced
  useEffect(() => {
    if (messages.length === 0) return;
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('xaivon_chat_messages', JSON.stringify(messages));
      } catch {
        // Ignore
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [messages]);

  // Reset conversation handler
  const handleResetChat = useCallback(() => {
    stopOutput();
    setMessages([]);
    setInput('');
    try {
      localStorage.removeItem('xaivon_chat_messages');
    } catch {
      // Ignore
    }
  }, [setMessages, stopOutput]);

  // Submit message handler
  const onSubmit = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if ((!input.trim() && files.length === 0) || isLoading || isProcessing) return;

    stopOutput();

    let finalText = input;
    const attachments: Array<{ name: string; contentType: string; url: string }> = [];
    isScrolledToBottomRef.current = true;

    files.forEach(file => {
      if (file.status === 'ready') {
        if (file.type === 'image' && file.previewUrl) {
          attachments.push({
            name: file.name,
            contentType: file.file.type,
            url: file.previewUrl,
          });
        } else if (file.extractedText) {
          finalText += `\n\n[Attached Document: ${file.name}]\n${file.extractedText}\n[End of Document]`;
        }
      }
    });

    if (attachments.length > 0) {
      sendMessage({ text: finalText, experimental_attachments: attachments } as unknown as Parameters<typeof sendMessage>[0]);
    } else {
      sendMessage({ text: finalText });
    }

    setInput('');
    clearFiles();
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [input, files, isLoading, isProcessing, sendMessage, stopOutput, clearFiles]);

  const getParsedError = (err: Error) => {
    let msg = err.message || 'Service communication issue';
    try {
      const parsed = JSON.parse(msg);
      if (parsed.error) msg = parsed.error;
    } catch {
      // Not JSON
    }

    const match = msg.match(/(.*?)\s*\(Request ID:\s*(XAIVON-[A-Z0-9]+)\)/);
    if (match) {
      return { reason: match[1].trim(), requestId: match[2] };
    }
    return { reason: msg, requestId: null };
  };

  const handleQuickSuggestion = useCallback((text: string) => {
    if (isLoading) return;
    stopOutput();

    if (text === 'Contact Raja directly') {
      setIsLeadFormOpen(true);
      return;
    }

    if (text === 'Schedule a discovery call') {
      setIsCalendarOpen(true);
      return;
    }

    sendMessage({ text });
  }, [isLoading, sendMessage, stopOutput]);

  const handleLeadFormSubmit = async (formData: {
    fullName: string;
    email: string;
    company: string;
    phone: string;
  }) => {
    const token = sessionToken || (typeof window !== 'undefined' ? localStorage.getItem('xaivon_chat_session_token') : null);
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      body: JSON.stringify({ ...formData, sessionId, sessionToken: token }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to submit inquiry');
    }

    setIsLeadFormOpen(false);
    setTimeout(() => {
      setIsCalendarOpen(true);
    }, 350);
  };

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      stopOutput();
      sendMessage({ text: getMessageText(lastUserMsg) });
    }
  };

  const handleTranscription = useCallback((text: string, isFinal: boolean) => {
    if (text) setInput(text);
    if (isFinal && text.trim() && !isLoading) {
      if (inputRef.current) {
        inputRef.current.focus();
        const len = inputRef.current.value.length;
        inputRef.current.setSelectionRange(len, len);
      }
    }
  }, [isLoading]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      addFiles(e.clipboardData.files);
    }
  }, [addFiles]);

  return (
    <div
      className={`flex flex-col h-full w-full bg-[var(--bg-panel)] overflow-hidden relative select-none ${
        isEmbed ? 'border-0 rounded-none' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-[var(--bg-panel)]/90 backdrop-blur-sm border-2 border-dashed border-[var(--copper-primary)] m-3 rounded-2xl flex flex-col items-center justify-center pointer-events-none">
          <p className="text-base font-semibold text-[var(--text-primary)]">Drop files to attach</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">Images & text documents supported</p>
        </div>
      )}

      {/* ─── HEADER ─── */}
      <div className="shrink-0 px-4 py-3 border-b border-[var(--border-glass)] bg-[var(--bg-panel)]/90 backdrop-blur-md z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center p-1 shadow-sm">
              <XaivonLogo className="w-full h-full" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-[var(--text-primary)] font-semibold text-xs tracking-wide leading-tight font-heading">
                  XAIVON
                </h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--copper-glow)] text-[var(--copper-primary)] font-medium">
                  Consultant
                </span>
              </div>
              <p className="text-[var(--text-muted)] text-[10px] font-medium leading-tight mt-0.5">
                AI Business Infrastructure
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150"
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Clear Chat Button */}
            {messages.length > 0 && (
              <button
                onClick={handleResetChat}
                className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150"
                aria-label="Start fresh conversation"
                title="Start fresh conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Settings Button */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150"
                aria-label="Language & Voice Settings"
                title="Settings"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              {showSettings && (
                <div className="absolute right-0 top-9 w-48 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up origin-top-right">
                  <div className="px-3 py-2 border-b border-[var(--border-glass)]">
                    <p className="text-xs font-semibold text-[var(--text-primary)]">Language</p>
                  </div>
                  <div className="py-1">
                    {(['auto', 'en', 'hi', 'hinglish'] as Language[]).map(lang => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLanguage(lang);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                          language === lang
                            ? 'bg-[var(--copper-glow)] text-[var(--copper-primary)] font-medium'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--border-glass)]'
                        }`}
                      >
                        {t(`settings.${lang}`)}
                      </button>
                    ))}
                  </div>

                  {availableVoices.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 border-t border-b border-[var(--border-glass)] bg-[var(--bg-panel)]">
                        <p className="text-[10px] uppercase font-semibold text-[var(--copper-primary)]">Speech Voice</p>
                      </div>
                      <div className="py-1 max-h-[140px] overflow-y-auto scrollbar-thin">
                        <button
                          onClick={() => updateSettings({ preferredVoiceURI: null })}
                          className={`w-full text-left px-3 py-1.5 text-xs transition-colors truncate ${
                            !settings?.preferredVoiceURI
                              ? 'bg-[var(--copper-glow)] text-[var(--copper-primary)] font-medium'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--border-glass)]'
                          }`}
                        >
                          Auto (Default)
                        </button>
                        {availableVoices.map(voice => (
                          <button
                            key={voice.uri}
                            title={voice.name}
                            onClick={() => updateSettings({ preferredVoiceURI: voice.uri })}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors truncate ${
                              settings?.preferredVoiceURI === voice.uri
                                ? 'bg-[var(--copper-glow)] text-[var(--copper-primary)] font-medium'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--border-glass)]'
                            }`}
                          >
                            {voice.name.replace(/Microsoft|Google|English|United States/gi, '').trim() || voice.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Close Button (if onClose provided) */}
            {onClose && (
              <button
                onClick={() => {
                  stopOutput();
                  onClose();
                }}
                className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--border-subtle)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-150"
                aria-label="Close chat window"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── MESSAGES BODY ─── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 scrollbar-thin min-h-0 select-text"
      >
        {/* Welcome State */}
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full min-h-[300px]">
            <div className="text-center space-y-4 px-2 max-w-sm animate-fade-in-up">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--copper-glow)] border border-[var(--border-subtle)] flex items-center justify-center">
                <span className="text-xl">⚡</span>
              </div>
              <div>
                <h3 className="text-[var(--text-primary)] font-semibold text-sm font-heading">
                  Welcome to XAIVON
                </h3>
                <p className="text-[var(--text-secondary)] text-xs mt-1 leading-relaxed">
                  I am XAIVON’s AI Business Consultant. How can I assist with your workflow orchestration, automation, or logistics operations today?
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-left">
                {QUICK_SUGGESTIONS.map(s => (
                  <button
                    key={s.text}
                    onClick={() => handleQuickSuggestion(s.text)}
                    className="p-2.5 bg-[var(--bg-surface)] hover:bg-[var(--copper-glow)] border border-[var(--border-glass)] hover:border-[var(--copper-primary)] text-[var(--text-primary)] text-[11px] rounded-xl transition-all duration-150 leading-snug group shadow-sm"
                  >
                    <span className="block text-sm mb-1">{s.icon}</span>
                    <span className="block font-medium">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message History */}
        {messages.length > 0 &&
          messages
            .filter(msg => msg.role === 'user' || msg.role === 'assistant')
            .map((msg, index, arr) => {
              const rawText = getMessageText(msg);
              const cleanedContent = rawText.replace(/\[TRIGGER_LEAD_FORM\]/g, '').trim();
              const isCurrentlyStreaming = isLoading && index === arr.length - 1 && msg.role === 'assistant';
              return (
                <ChatMessage
                  key={msg.id}
                  role={msg.role as 'user' | 'assistant'}
                  content={cleanedContent}
                  isStreaming={isCurrentlyStreaming}
                />
              );
            })}

        {/* Contextual Suggestions */}
        {messages.length > 0 &&
          !isLoading &&
          !isLeadFormOpen &&
          messages[messages.length - 1]?.role === 'assistant' && (
            <div className="flex flex-wrap gap-1.5 pt-1 pb-1 animate-fade-in-up">
              {getContextualSuggestions(messages).map(s => (
                <button
                  key={s.text}
                  onClick={() => handleQuickSuggestion(s.text)}
                  className="px-3 py-1.5 bg-[var(--bg-surface)] hover:bg-[var(--copper-glow)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs rounded-full transition-all duration-150 font-medium whitespace-nowrap shadow-sm"
                >
                  <span className="mr-1.5">{s.icon}</span>
                  {s.text}
                </button>
              ))}
            </div>
          )}

        {/* Typing Indicator */}
        {(status === 'submitted' ||
          (status === 'streaming' &&
            messages[messages.length - 1]?.role === 'assistant' &&
            getMessageText(messages[messages.length - 1]).length === 0)) && (
          <div className="flex items-start gap-2.5 animate-fade-in-up">
            <div
              className="w-7 h-7 rounded-lg bg-[var(--copper-primary)] flex items-center justify-center text-white text-[11px] font-bold shrink-0 mt-0.5"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              X
            </div>
            <div className="flex gap-1.5 items-center px-4 py-3 bg-[var(--bg-bubble-bot)] border border-[var(--border-glass)] rounded-2xl rounded-tl-sm">
              <div className="w-1.5 h-1.5 bg-[var(--copper-primary)] rounded-full animate-pulse-dot"></div>
              <div
                className="w-1.5 h-1.5 bg-[var(--copper-primary)] rounded-full animate-pulse-dot"
                style={{ animationDelay: '0.2s' }}
              ></div>
              <div
                className="w-1.5 h-1.5 bg-[var(--copper-primary)] rounded-full animate-pulse-dot"
                style={{ animationDelay: '0.4s' }}
              ></div>
            </div>
          </div>
        )}

        {/* Error State with mailto escape hatch */}
        {error && (() => {
          const { reason, requestId } = getParsedError(error);
          return (
            <div className="animate-fade-in-up">
              <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3.5 text-xs text-[var(--text-primary)] space-y-2.5">
                <div className="font-semibold text-red-400">Consultant service communication note:</div>
                <p className="text-[var(--text-secondary)]">{reason}</p>
                {requestId && <p className="text-[10px] text-[var(--text-muted)]">Request ID: {requestId}</p>}

                <div className="pt-2 border-t border-red-500/15 flex items-center justify-between gap-2">
                  <a
                    href="mailto:raja@xaivon.com?subject=XAIVON%20Consultation%20Inquiry"
                    className="text-[11px] text-[var(--copper-primary)] hover:underline font-medium"
                  >
                    Direct Email: raja@xaivon.com
                  </a>
                  <button
                    onClick={handleRetry}
                    className="px-3 py-1 bg-[var(--copper-primary)] hover:bg-[var(--copper-light)] text-white text-[11px] font-medium rounded-lg transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <div
        className={`absolute bottom-[92px] left-1/2 -translate-x-1/2 z-40 transition-all duration-200 ${
          showScrollButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        <button
          onClick={() => {
            messagesContainerRef.current?.scrollTo({
              top: messagesContainerRef.current.scrollHeight,
              behavior: 'smooth',
            });
            isScrolledToBottomRef.current = true;
            setShowScrollButton(false);
          }}
          className="p-2 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-full shadow-lg hover:border-[var(--copper-primary)] transition-colors flex items-center justify-center w-8 h-8"
          aria-label="Scroll to newest messages"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* ─── COMPOSER INPUT ─── */}
      <div className="shrink-0 border-t border-[var(--border-glass)] bg-[var(--bg-panel)]/95 backdrop-blur-md">
        {files.length > 0 && (
          <div className="px-3.5 pt-2.5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {files.map(file => (
              <AttachmentCard
                key={file.id}
                file={file}
                onRemove={removeFile}
                onRetry={retryFile}
              />
            ))}
          </div>
        )}

        <form onSubmit={onSubmit} className="px-3.5 py-2.5">
          <div className="flex gap-2 items-end">
            <FileUploader
              onFilesSelected={addFiles}
              disabled={isLoading || isLeadFormOpen}
            />

            <textarea
              ref={inputRef}
              value={input}
              onChange={e => {
                setInput(e.target.value);
                const el = e.target;
                el.style.height = 'inherit';
                el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
                if (e.target.value.trim().length > 0) {
                  stopOutput();
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                  e.currentTarget.style.height = 'auto';
                }
              }}
              placeholder={t('chat.placeholder') || 'Ask about XAIVON automation...'}
              disabled={isLoading || isLeadFormOpen}
              rows={1}
              className="flex-1 px-3.5 py-2.5 bg-[var(--bg-input)] text-[var(--text-primary)] text-sm rounded-xl placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--copper-primary)] border border-[var(--border-glass)] transition-colors resize-none max-h-[180px] overflow-y-auto scrollbar-thin min-h-[44px]"
              aria-label="Type your message"
              style={{ height: '44px' }}
            />

            <button
              type="submit"
              disabled={isLoading || isProcessing || (!input.trim() && files.length === 0) || isLeadFormOpen}
              className="w-[44px] h-[44px] flex items-center justify-center flex-shrink-0 bg-[var(--copper-primary)] hover:bg-[var(--copper-light)] disabled:opacity-30 disabled:hover:bg-[var(--copper-primary)] text-white rounded-xl transition-all duration-150 shadow-md shadow-[var(--copper-glow)]"
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22L11 13L2 9L22 2Z" />
              </svg>
            </button>

            <VoiceRecorder
              onTranscription={handleTranscription}
              disabled={isLoading || isLeadFormOpen}
              initialText={input}
            />
          </div>
        </form>

        <div className="text-center pb-2">
          <span className="text-[10px] text-[var(--text-muted)]">
            XAIVON AI Business Consultant • Consultative Discovery
          </span>
        </div>
      </div>

      {/* ─── MODALS ─── */}
      <LeadFormModal
        isOpen={isLeadFormOpen}
        onClose={() => {
          stopOutput();
          setIsLeadFormOpen(false);
        }}
        onSubmit={handleLeadFormSubmit}
      />

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => {
          stopOutput();
          setIsCalendarOpen(false);
        }}
      />
    </div>
  );
}