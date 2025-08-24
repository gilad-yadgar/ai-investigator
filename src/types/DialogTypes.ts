export interface ConversationEntry {
  speaker: 'investigator' | 'suspect';
  text: string;
  timestamp?: Date;
  isStreaming?: boolean;
  emotion?: 'angry' | 'scared' | 'bored';
}

export interface OllamaResponse {
  response: string;
  emotion?: 'angry' | 'scared' | 'bored';
  done?: boolean;
  error?: string;
}

export interface OllamaStreamResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaRequest {
  model: string;
  messages: ChatMessage[];
  stream: boolean;
  options?: {
    temperature?: number;
    max_tokens?: number;
  };
}

export interface GameState {
  playerName: string;
  conversationHistory: ConversationEntry[];
  isGenerating: boolean;
  currentInput: string;
}

export interface UIElements {
  inputDialog?: Phaser.GameObjects.Container;
  waitingScreen?: Phaser.GameObjects.Container;
  conversationDisplay?: Phaser.GameObjects.Container;
}

export interface DialogSceneData {
  playerName?: string;
}