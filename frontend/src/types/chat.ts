export interface ChatRequest {
  developer_message: string;
  user_message: string;
  model?: string;
  api_key: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'developer';
  content: string;
  timestamp: Date;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}
