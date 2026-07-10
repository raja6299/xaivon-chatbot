import React from 'react';

export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div 
        className={`max-w-[80%] px-4 py-3 rounded-2xl ${
          isUser 
            ? 'bg-gray-800 text-gray-50 rounded-tr-sm' 
            : 'bg-[#111827] text-gray-50 border border-violet-500/30 rounded-tl-sm'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
