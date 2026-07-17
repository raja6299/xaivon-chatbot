"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage, type TextUIPart } from 'ai';
import { ChatMessage } from './ChatMessage';
import { LeadFormModal } from './LeadFormModal';
import { CalendarModal } from './CalendarModal';
import { VoiceRecorder } from './VoiceRecorder';
import { VoicePlayer } from './VoicePlayer';
import { FileUploader } from './FileUploader';
import { AttachmentCard } from './AttachmentCard';
import { useVoice } from '../../hooks/useVoice';
import { useFiles } from '../../hooks/useFiles';
import { useTranslation } from '../../lib/i18n';
import { Language } from '../../lib/i18n/types';

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

function getContextualSuggestions(messages: UIMessage[]): { icon: string; text: string }[] {
  if (messages.length === 0) return QUICK_SUGGESTIONS;

  const lastMsg = messages[messages.length - 1];
  if (lastMsg.role !== 'assistant') return [];

  const text = getMessageText(lastMsg).toLowerCase();
  
  if (text.includes('pricing') || text.includes('cost') || text.includes('tier') || text.includes('investment')) {
    return [
      { icon: '📅', text: 'Book a Demo' },
      { icon: '💼', text: 'Contact Sales' },
      { icon: '⚙️', text: 'What is included in the Enterprise tier?' },
    ];
  }

  if (text.includes('agent') || text.includes('quoteflow') || text.includes('automation')) {
    return [
      { icon: '💰', text: 'I need pricing' },
      { icon: '📅', text: 'Can we schedule a call?' },
      { icon: '🌐', text: 'Website Development' },
    ];
  }

  if (text.includes('website') || text.includes('web') || text.includes('design')) {
    return [
      { icon: '💰', text: 'I need pricing' },
      { icon: '🚀', text: 'Logistics Automation' },
      { icon: '📅', text: 'Book a Demo' },
    ];
  }

  return [
    { icon: '💰', text: 'I need pricing' },
    { icon: '🤖', text: 'AI Agents' },
    { icon: '🚀', text: 'Logistics Automation' },
    { icon: '📅', text: 'Book a Demo' },
  ];
}

export function ChatWindow({ onClose }: { onClose: () => void }) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: 'xaivon-persistent-chat',
    transport: new DefaultChatTransport({ 
      api: '/api/chat',
      headers: sessionId ? { 'x-session-id': sessionId } : undefined,
    }),
  });
  
  type ChatViewState = 'WELCOME' | 'ACTIVE';
  const [chatViewState, setChatViewState] = useState<ChatViewState>('WELCOME');
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [hasSubmittedLead, setHasSubmittedLead] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { t, language, setLanguage } = useTranslation();

  // File Management
  const { files, isProcessing, addFiles, removeFile, clearFiles, retryFile } = useFiles();

  // Voice integration
  const { speak, stopOutput, updateSettings } = useVoice();
  const prevIsLoading = useRef<boolean>(false);

  // Sync voice language with UI language preference
  useEffect(() => {
    let voiceLang = 'en-IN'; // Default to en-IN for Hinglish/Auto
    if (language === 'hi') voiceLang = 'hi-IN';
    else if (language === 'en') voiceLang = 'en-US';
    
    updateSettings({ language: voiceLang });
  }, [language, updateSettings]);

  const isLoading = status === 'submitted' || status === 'streaming';

  // Issue 3: Scroll to Bottom state
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isScrolledToBottomRef = useRef(true);

  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    isScrolledToBottomRef.current = isNearBottom;
    setShowScrollButton(!isNearBottom);
  }, []);

  // Smooth auto-scroll
  useEffect(() => {
    if (messagesContainerRef.current && isScrolledToBottomRef.current) {
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

    // 2. Restore lead submission state
    const leadSubmitted = localStorage.getItem('xaivon_chat_lead_submitted');
    if (leadSubmitted === 'true') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasSubmittedLead(true);
    }

    // 3. Restore or create session
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
      !isLeadFormOpen &&
      !hasSubmittedLead
    ) {
      // Full Duplex Interruption: Stop voice when form auto-opens
      stopOutput();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLeadFormOpen(true);
    }
  }, [messages, isLeadFormOpen, hasSubmittedLead, stopOutput]);

  // TTS Trigger: when loading finishes and last message is assistant
  useEffect(() => {
    if (prevIsLoading.current && !isLoading) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        const text = getMessageText(lastMessage);
        // Do not auto-speak the lead trigger itself 
        if (!text.includes(LEAD_TRIGGER)) {
           speak(text);
        }
      }
    }
    prevIsLoading.current = isLoading;
  }, [isLoading, messages, speak]);

  // Submit handler
  const onSubmit = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if ((!input.trim() && files.length === 0) || isLoading || isProcessing) return;
    
    // Stop any ongoing voice output when user sends a new message
    stopOutput();

    let finalText = input;
    const attachments: Array<{ name: string; contentType: string; url: string }> = [];
    isScrolledToBottomRef.current = true;

    // Attach document text and image urls
    files.forEach(file => {
      if (file.status === 'ready') {
        if (file.type === 'image' && file.previewUrl) {
          attachments.push({
            name: file.name,
            contentType: file.file.type,
            url: file.previewUrl
          });
        } else if (file.extractedText) {
          finalText += `\n\n[Attached Document: ${file.name}]\n${file.extractedText}\n[End of Document]`;
        }
      }
    });

    // Vercel AI SDK standard message append format
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
    let msg = err.message || 'Unknown Error';
    

    // Try to parse as JSON first (from HTTP 400/500 responses)
    try {
      const parsed = JSON.parse(msg);
      if (parsed.error) {
        msg = parsed.error;
      }
    } catch {
      // Not JSON, continue normally
    }

    const match = msg.match(/(.*?)\s*\(Request ID:\s*(XAIVON-[A-Z0-9]+)\)/);
    if (match) {
      return { reason: match[1].trim(), requestId: match[2] };
    }
    return { reason: msg, requestId: null };
  };


  // Quick suggestion
  const handleQuickSuggestion = useCallback((text: string) => {
    if (isLoading) return;
    stopOutput();
    setChatViewState('ACTIVE');
    sendMessage({ text });
  }, [isLoading, sendMessage, stopOutput]);

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
      body: JSON.stringify({ ...formData, sessionId, messages }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to submit');
    }
    
    // Mark lead as submitted successfully and persist it
    setHasSubmittedLead(true);
    localStorage.setItem('xaivon_chat_lead_submitted', 'true');
    
    // Phase 7: Transition to Human Handoff (Calendar)
    setIsLeadFormOpen(false);
    
    // Give the lead form time to animate out before opening calendar
    setTimeout(() => {
      setIsCalendarOpen(true);
    }, 400);
  };

  // Retry after error
  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      stopOutput();
      sendMessage({ text: getMessageText(lastUserMsg) });
    }
  };

  const handleTranscription = useCallback((text: string, isFinal: boolean) => {
    if (text) setInput(text);
    setChatViewState('ACTIVE');
    if (isFinal && text.trim() && !isLoading) {
       // Focus textbox and move cursor to end instead of auto-submitting
       if (inputRef.current) {
         inputRef.current.focus();
         const len = inputRef.current.value.length;
         inputRef.current.setSelectionRange(len, len);
       }
    }
  }, [isLoading]);

  // Drag and Drop handlers
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
      className="flex flex-col h-full w-full bg-gradient-to-b from-[#0f1629] to-[#0a0e1a] overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-[#0a0e1a]/80 backdrop-blur-sm border-2 border-dashed border-violet-500/50 m-4 rounded-3xl flex flex-col items-center justify-center pointer-events-none">
          <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
          </div>
          <p className="text-xl font-semibold text-white">Drop files to upload</p>
          <p className="text-sm text-slate-400 mt-2">Supports Images and Documents</p>
        </div>
      )}

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
          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
                aria-label="Settings"
                title={t('chat.settings')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              </button>
              
              {showSettings && (
                <div className="absolute right-0 top-10 w-48 bg-[#151d35] border border-violet-500/20 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up origin-top-right">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-xs font-semibold text-white">{t('settings.title')}</p>
                  </div>
                  <div className="py-1">
                    {(['auto', 'en', 'hi', 'hinglish'] as Language[]).map(lang => (
                      <button
                        key={lang}
                        onClick={() => {
                          setLanguage(lang);
                          setShowSettings(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors ${language === lang ? 'bg-violet-500/20 text-violet-300' : 'text-slate-300 hover:bg-white/5'}`}
                      >
                        {t(`settings.${lang}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                stopOutput();
                onClose();
              }}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-200"
              aria-label={t('settings.close')}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* ─── MESSAGES AREA (scrollable) ─── */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin min-h-0"
      >
        {/* Empty State */}
        {(messages.length === 0 || chatViewState === 'WELCOME') && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4 px-2 animate-fade-in-up">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-violet-500/15 to-purple-600/15 border border-violet-500/15 flex items-center justify-center">
                <span className="text-2xl">✨</span>
              </div>
              <div>
                <p className="text-white font-semibold text-[15px]">Welcome to XAIVON</p>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-[240px] mx-auto">
                  {t('chat.greeting')}
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
        {chatViewState === 'ACTIVE' && messages
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

        {/* Contextual Suggestions */}
        {messages.length > 0 && !isLoading && !isLeadFormOpen && !hasSubmittedLead && messages[messages.length - 1]?.role === 'assistant' && (
          <div className="flex flex-wrap gap-2 pt-1 pb-2 animate-fade-in-up">
            {getContextualSuggestions(messages).map((suggestion) => (
              <button
                key={suggestion.text}
                onClick={() => handleQuickSuggestion(suggestion.text)}
                className="px-3 py-1.5 bg-[#151d35] hover:bg-violet-500/15 border border-violet-500/15 hover:border-violet-500/30 text-violet-200 text-xs rounded-full transition-all duration-200 font-medium whitespace-nowrap shadow-sm shadow-violet-500/5 hover:shadow-violet-500/10"
              >
                <span className="mr-1.5">{suggestion.icon}</span>
                {suggestion.text}
              </button>
            ))}
          </div>
        )}

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
        {error && (() => {
          const { reason, requestId } = getParsedError(error);
          return (
          <div className="animate-fade-in-up">
            <div className="bg-red-900/15 border border-red-500/15 rounded-xl px-4 py-3 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-red-200 text-sm font-semibold">Unable to complete your request.</span>
                  <div className="mt-1.5 space-y-1">
                    <p className="text-red-300/80 text-xs"><span className="text-red-300 font-medium">Reason:</span> {reason}</p>
                    {requestId && <p className="text-red-300/80 text-xs"><span className="text-red-300 font-medium">Request ID:</span> {requestId}</p>}
                  </div>
                </div>
              </div>
              <div className="flex justify-end border-t border-red-500/10 pt-2 mt-1">
                <button
                  onClick={handleRetry}
                  className="text-xs font-medium text-red-300 hover:text-white bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-all duration-200"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )})()}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      <div 
        className={`absolute bottom-[100px] left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${showScrollButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      >
        <button
          onClick={() => {
            messagesContainerRef.current?.scrollTo({
              top: messagesContainerRef.current.scrollHeight,
              behavior: 'smooth'
            });
            isScrolledToBottomRef.current = true;
            setShowScrollButton(false);
          }}
          className="p-2.5 bg-[#151d35]/90 backdrop-blur-md border border-violet-500/20 text-violet-300 rounded-full shadow-lg shadow-violet-500/10 hover:bg-[#1f2947] hover:text-white transition-colors flex items-center justify-center w-10 h-10"
          aria-label="Scroll to bottom"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
        </button>
      </div>

      {/* ─── VOICE PLAYER ─── */}
      <VoicePlayer />

      {/* ─── INPUT AREA (sticky) ─── */}
      <div className="shrink-0 border-t border-violet-500/8 bg-[#0d1322]/90 backdrop-blur-md">
        
        {/* Attachments List */}
        {files.length > 0 && (
          <div className="px-3.5 pt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
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

        <form onSubmit={onSubmit} className="px-3.5 py-3">
          <div className="flex gap-2 items-end">
            <FileUploader 
              onFilesSelected={addFiles} 
              disabled={isLoading || isLeadFormOpen}
            />
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setChatViewState('ACTIVE');
                
                // Optimize auto-resize to prevent unnecessary DOM reflows
                const el = e.target;
                el.style.height = 'inherit';
                const newHeight = `${Math.min(el.scrollHeight, 200)}px`;
                el.style.height = newHeight;

                // Full duplex: typing interrupts voice
                if (e.target.value.trim().length > 0) {
                  stopOutput();
                }
              }}
              onFocus={() => setChatViewState('ACTIVE')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                  e.currentTarget.style.height = 'auto';
                }
              }}
              placeholder={t('chat.placeholder')}
              disabled={isLoading || isLeadFormOpen}
              rows={1}
              className="flex-1 px-3.5 py-2.5 bg-[#151d35] text-white text-sm rounded-2xl placeholder-slate-500 disabled:opacity-30 focus:outline-none focus:ring-1 focus:ring-violet-500/40 border border-violet-500/8 focus:border-violet-500/25 transition-colors duration-200 resize-none max-h-[200px] overflow-y-auto scrollbar-thin min-h-[44px]"
              aria-label="Type your message"
              style={{ height: '44px' }}
            />
            <button
              type="submit"
              disabled={isLoading || isProcessing || (!input.trim() && files.length === 0) || isLeadFormOpen}
              className="w-[44px] h-[44px] flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-30 disabled:hover:from-violet-600 disabled:hover:to-purple-600 text-white rounded-xl transition-all duration-200 shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20"
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
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
          <span className="text-[9px] text-slate-600">Powered by XAIVON AI</span>
        </div>
      </div>

      {/* ─── LEAD FORM OVERLAY (inside chatbot) ─── */}
      <LeadFormModal
        isOpen={isLeadFormOpen}
        onClose={() => {
          stopOutput();
          setIsLeadFormOpen(false);
        }}
        onSubmit={handleLeadFormSubmit}
      />

      {/* ─── CALENDAR OVERLAY (inside chatbot) ─── */}
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