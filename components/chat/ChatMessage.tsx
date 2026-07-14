"use client";

import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export const ChatMessage = memo(function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';

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
