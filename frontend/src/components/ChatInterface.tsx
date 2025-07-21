'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Key, Settings, MessageSquare, CheckCircle, XCircle, Loader } from 'lucide-react';
import { ChatMessage, ChatState } from '@/types/chat';
import { streamChat, testModelAccess } from '@/lib/api';
import Message from './Message';

const ChatInterface: React.FC = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });
  const [userMessage, setUserMessage] = useState('');
  const [developerMessage, setDeveloperMessage] = useState('You are a helpful AI assistant.');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4.1-nano');
  const [showSettings, setShowSettings] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [modelStatus, setModelStatus] = useState<{[key: string]: 'checking' | 'available' | 'unavailable'}>({});
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageIdRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Set isClient to true only on client side to avoid hydration issues
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatState.messages]);

  // Generate unique message ID
  const generateMessageId = () => {
    messageIdRef.current += 1;
    return `msg-${messageIdRef.current}`;
  };

  // Test model availability
  const testModel = async (modelName: string) => {
    if (!apiKey.trim()) return;
    
    setModelStatus(prev => ({ ...prev, [modelName]: 'checking' }));
    
    try {
      const result = await testModelAccess(apiKey, modelName);
      setModelStatus(prev => ({ 
        ...prev, 
        [modelName]: result.available ? 'available' : 'unavailable' 
      }));
      
      if (result.available && !availableModels.includes(modelName)) {
        setAvailableModels(prev => [...prev, modelName]);
      }
    } catch (error) {
      setModelStatus(prev => ({ ...prev, [modelName]: 'unavailable' }));
    }
  };

  // Test all models when API key changes
  useEffect(() => {
    if (apiKey.trim()) {
      const models = ['gpt-4.1-nano', 'gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'];
      models.forEach(testModel);
    } else {
      setModelStatus({});
      setAvailableModels([]);
    }
  }, [apiKey]);

  // Auto-select first available model
  useEffect(() => {
    if (availableModels.length > 0) {
      const currentModelAvailable = availableModels.includes(model);
      if (!currentModelAvailable) {
        // Prefer models in this order
        const preferredOrder = ['gpt-4.1-nano', 'gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'];
        const firstAvailable = preferredOrder.find(m => availableModels.includes(m));
        if (firstAvailable) {
          setModel(firstAvailable);
        }
      }
    }
  }, [availableModels, model]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userMessage.trim() || !apiKey.trim()) {
      setChatState(prev => ({ ...prev, error: 'Please enter a message and API key' }));
      return;
    }

    const userMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: userMessage,
      timestamp: isClient ? new Date() : new Date(0),
    };

    const developerMsg: ChatMessage = {
      id: generateMessageId(),
      role: 'developer',
      content: developerMessage,
      timestamp: isClient ? new Date() : new Date(0),
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, developerMsg, userMsg],
      isLoading: true,
      error: null,
    }));

    setUserMessage('');

    try {
      const stream = await streamChat({
        developer_message: developerMessage,
        user_message: userMessage,
        model: model,
        api_key: apiKey,
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      
      const assistantMsg: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: '',
        timestamp: isClient ? new Date() : new Date(0),
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMsg],
      }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        
        setChatState(prev => ({
          ...prev,
          messages: prev.messages.map(msg =>
            msg.id === assistantMsg.id
              ? { ...msg, content: msg.content + chunk }
              : msg
          ),
        }));
      }
    } catch (error) {
      setChatState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
      }));
    } finally {
      setChatState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest('form');
      if (form) {
        const formEvent = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(formEvent);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6" />
          <h1 className="text-xl font-semibold">AI Chat Assistant</h1>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-100 border-b p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OpenAI API Key
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your OpenAI API key"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {[
                { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano' },
                { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                { value: 'gpt-4', label: 'GPT-4' },
                { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                { value: 'gpt-4o', label: 'GPT-4o' },
                { value: 'gpt-4o-mini', label: 'GPT-4o Mini' }
              ].map(({ value, label }) => {
                const status = modelStatus[value];
                const isAvailable = status === 'available';
                const isChecking = status === 'checking';
                const isUnavailable = status === 'unavailable';
                
                return (
                  <option 
                    key={value} 
                    value={value}
                    disabled={isUnavailable}
                  >
                    {label}
                    {isChecking ? ' (Testing...)' : 
                     isAvailable ? ' ✓' : 
                     isUnavailable ? ' ✗' : ''}
                  </option>
                );
              })}
            </select>
            
            {/* Model Status Indicators */}
            {apiKey && (
              <div className="mt-2 space-y-1">
                <div className="text-xs text-gray-600">Model Availability:</div>
                {[
                  { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano' },
                  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                  { value: 'gpt-4', label: 'GPT-4' },
                  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                  { value: 'gpt-4o', label: 'GPT-4o' },
                  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' }
                ].map(({ value, label }) => {
                  const status = modelStatus[value];
                  return (
                    <div key={value} className="flex items-center justify-between text-xs">
                      <span>{label}</span>
                      <span className="flex items-center gap-1">
                        {status === 'checking' && (
                          <>
                            <Loader className="w-3 h-3 animate-spin text-blue-500" />
                            <span className="text-blue-500">Testing...</span>
                          </>
                        )}
                        {status === 'available' && (
                          <>
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            <span className="text-green-500">Available</span>
                          </>
                        )}
                        {status === 'unavailable' && (
                          <>
                            <XCircle className="w-3 h-3 text-red-500" />
                            <span className="text-red-500">Unavailable</span>
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Developer/System Message
            </label>
            <textarea
              value={developerMessage}
              onChange={(e) => setDeveloperMessage(e.target.value)}
              placeholder="Enter system instructions for the AI..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {chatState.error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{chatState.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {chatState.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-2">Welcome to AI Chat Assistant</p>
              <p className="text-sm">
                {apiKey ? 'Start a conversation below!' : 'Please set your API key in settings to begin'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {chatState.messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {chatState.isLoading && (
              <div className="flex gap-3 p-4 bg-gray-50">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-1">Assistant</div>
                  <div className="text-gray-500">Thinking...</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="border-t bg-white p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!userMessage.trim() || !apiKey.trim() || chatState.isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
