"use client";

import React, { memo, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Play, Pause, Square, X, Volume2 } from 'lucide-react';
import { useVoice } from '../../hooks/useVoice';

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export const ChatMessage = memo(function ChatMessage({ role, content, isStreaming = false }: ChatMessageProps) {
  const isUser = role === 'user';
  
  const { state, speak, stopOutput, pauseOutput, resumeOutput } = useVoice();
  const [isThisMessageSpeaking, setIsThisMessageSpeaking] = useState(false);

  useEffect(() => {
    if (state === 'idle' || state === 'error' || state === 'completed') {
      setIsThisMessageSpeaking(false);
    }
  }, [state]);

  const handleListen = () => {
    stopOutput(); // Clear any ongoing speech
    speak(content);
    setIsThisMessageSpeaking(true);
  };

  const handleClose = () => {
    stopOutput();
    setIsThisMessageSpeaking(false);
  };

  if (!content) return null;

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start gap-2.5 animate-fade-in-up`}
    >
      {/* Bot avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5 shadow-md shadow-violet-500/15" aria-hidden="true">
          X
        </div>
      )}

      <div
        className={`max-w-[80%] ${
          isUser
            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl rounded-br-sm shadow-lg shadow-violet-500/10 px-3.5 py-2.5 text-[0.8125rem] leading-relaxed'
            : 'bg-[#151d35] text-slate-100 border border-violet-500/8 rounded-2xl rounded-tl-sm px-3.5 py-2.5'
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

        {/* Voice Controls */}
        {!isUser && !isStreaming && (
          <div className="mt-3 flex items-center gap-1.5 border-t border-violet-500/10 pt-2">
            {!isThisMessageSpeaking ? (
              <button 
                onClick={handleListen}
                className="flex items-center gap-1.5 text-[10px] font-medium text-violet-300 hover:text-white bg-violet-500/10 hover:bg-violet-500/20 px-2.5 py-1.5 rounded-lg transition-colors duration-200"
                aria-label="Listen to AI response"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Listen
              </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-violet-500/10 px-2 py-1 rounded-lg border border-violet-500/20 animate-fade-in-up">
                <button
                  onClick={state === 'paused' ? resumeOutput : pauseOutput}
                  className="flex items-center gap-1 text-[10px] font-medium text-violet-300 hover:text-white hover:bg-violet-500/20 px-2 py-1.5 rounded-md transition-colors"
                  aria-label={state === 'paused' ? "Resume AI voice" : "Pause AI voice"}
                >
                  {state === 'paused' ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  {state === 'paused' ? 'Resume' : 'Pause'}
                </button>
                <div className="w-px h-3 bg-violet-500/20 mx-0.5"></div>
                <button
                  onClick={handleClose}
                  className="flex items-center gap-1 text-[10px] font-medium text-red-300 hover:text-red-200 hover:bg-red-500/20 px-2 py-1.5 rounded-md transition-colors"
                  aria-label="Stop AI voice"
                >
                  <Square className="w-3.5 h-3.5" />
                  Stop
                </button>
                <div className="w-px h-3 bg-violet-500/20 mx-0.5"></div>
                <button
                  onClick={handleClose}
                  className="flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-white hover:bg-white/10 px-2 py-1.5 rounded-md transition-colors"
                  aria-label="Close voice controls"
                >
                  <X className="w-3.5 h-3.5" />
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-slate-200 text-[9px] font-semibold shrink-0 mt-0.5 tracking-tight" aria-hidden="true">
          You
        </div>
      )}
    </div>
  );
});
