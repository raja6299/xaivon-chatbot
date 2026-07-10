import React from 'react';

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';

  if (!content) return null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start gap-2`}>
      {/* Bot avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5 shadow-md shadow-violet-500/15">
          X
        </div>
      )}
      
      <div
        className={`max-w-[75%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl rounded-br-md shadow-lg shadow-violet-500/10'
            : 'bg-[#151d35] text-slate-100 border border-violet-500/10 rounded-2xl rounded-tl-md'
        }`}
      >
        {content}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center text-slate-300 text-[10px] font-bold shrink-0 mt-0.5">
          You
        </div>
      )}
    </div>
  );
}
