'use client';

import React, { useState, useEffect } from 'react';
import { User, Bot, Settings } from 'lucide-react';
import { ChatMessage } from '@/types/chat';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageProps {
  message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const [isClient, setIsClient] = useState(false);
  const isUser = message.role === 'user';
  const isDeveloper = message.role === 'developer';
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  return (
    <div className={`flex gap-3 p-4 ${isUser ? 'bg-blue-50' : isDeveloper ? 'bg-purple-50' : 'bg-gray-50'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-500' : isDeveloper ? 'bg-purple-500' : 'bg-gray-500'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : isDeveloper ? (
          <Settings className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm">
            {isUser ? 'You' : isDeveloper ? 'Developer' : 'Assistant'}
          </span>
          <span className="text-xs text-gray-500">
            {isClient ? message.timestamp.toLocaleTimeString() : ''}
          </span>
        </div>
        <div className="text-gray-800 markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default Message;
