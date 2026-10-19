"use client";

import React, { memo, useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Play, Pause, Square, X, Volume2 } from 'lucide-react';
import { getVoiceManager } from '../../lib/voice/VoiceManager';

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

const MessageVoiceControl = memo(function MessageVoiceControl({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) {
  const [playState, setPlayState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, []);

  const handleListen = useCallback(() => {
    const manager = getVoiceManager();
    manager.interruptOutput();

    if (unsubRef.current) unsubRef.current();
    unsubRef.current = manager.subscribeToState((s) => {
      if (s === 'idle' || s === 'error' || s === 'completed') {
        setPlayState('idle');
        if (unsubRef.current) {
          unsubRef.current();
          unsubRef.current = null;
        }
      } else if (s === 'paused') {
        setPlayState('paused');
      } else if (s === 'speaking') {
        setPlayState('playing');
      }
    });

    manager.speakResponse(content, true);
    setPlayState('playing');
  }, [content]);

  const handlePauseResume = useCallback(() => {
    const manager = getVoiceManager();
    if (playState === 'paused') {
      manager.resumeOutput();
    } else {
      manager.pauseOutput();
    }
  }, [playState]);

  const handleClose = useCallback(() => {
    const manager = getVoiceManager();
    manager.interruptOutput();
    setPlayState('idle');
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
  }, []);

  if (isStreaming) return null;

  return (
    <div className="mt-2.5 flex items-center gap-1.5 border-t border-[var(--border-glass)] pt-2">
      {playState === 'idle' ? (
        <button
          onClick={handleListen}
          className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--copper-light)] hover:text-white bg-[var(--copper-glow)] hover:bg-[var(--copper-primary)] px-2.5 py-1.5 rounded-lg transition-colors duration-200"
          aria-label="Listen to response"
        >
          <Volume2 className="w-3.5 h-3.5" />
          Listen
        </button>
      ) : (
        <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] px-2 py-1 rounded-lg border border-[var(--border-subtle)] animate-fade-in-up">
          <button
            onClick={handlePauseResume}
            className="flex items-center gap-1 text-[11px] font-medium text-[var(--copper-light)] hover:text-white px-2 py-1 rounded transition-colors"
            aria-label={playState === 'paused' ? 'Resume voice' : 'Pause voice'}
          >
            {playState === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {playState === 'paused' ? 'Resume' : 'Pause'}
          </button>
          <div className="w-px h-3 bg-[var(--border-glass)] mx-0.5"></div>
          <button
            onClick={handleClose}
            className="flex items-center gap-1 text-[11px] font-medium text-red-400 hover:text-red-300 px-2 py-1 rounded transition-colors"
            aria-label="Stop speech"
          >
            <Square className="w-3.5 h-3.5" />
            Stop
          </button>
          <div className="w-px h-3 bg-[var(--border-glass)] mx-0.5"></div>
          <button
            onClick={handleClose}
            className="flex items-center gap-1 text-[11px] font-medium text-[var(--text-muted)] hover:text-white px-1.5 py-1 rounded transition-colors"
            aria-label="Close voice controls"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
});

export const ChatMessage = memo(function ChatMessage({
  role,
  content,
  isStreaming = false,
}: ChatMessageProps) {
  const isUser = role === 'user';

  if (!content) return null;

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start gap-2.5 animate-fade-in-up`}
    >
      {/* Bot badge */}
      {!isUser && (
        <div
          className="w-7 h-7 rounded-lg bg-[var(--copper-primary)] flex items-center justify-center text-white text-[11px] font-bold shrink-0 mt-0.5 shadow-sm"
          style={{ fontFamily: 'var(--font-heading)' }}
          aria-hidden="true"
        >
          X
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-[var(--bg-bubble-user)] text-[var(--text-user)] rounded-br-sm shadow-md text-[0.84rem] leading-relaxed'
            : 'bg-[var(--bg-bubble-bot)] text-[var(--text-primary)] border border-[var(--border-glass)] rounded-tl-sm shadow-sm'
        }`}
      >
        {isUser ? (
          <span className="whitespace-pre-wrap">{content}</span>
        ) : (
          <div className="chat-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        )}

        {!isUser && <MessageVoiceControl content={content} isStreaming={isStreaming} />}
      </div>

      {/* User avatar */}
      {isUser && (
        <div
          className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-glass)] flex items-center justify-center text-[var(--text-secondary)] text-[10px] font-medium shrink-0 mt-0.5"
          aria-hidden="true"
        >
          You
        </div>
      )}
    </div>
  );
});
