export interface ConversationEntry {
  speaker: 'investigator' | 'suspect';
  text: string;
  timestamp?: Date;
}

export interface OllamaResponse {
  response: string;
  done?: boolean;
  error?: string;
}

export interface OllamaRequest {
  model: string;
  prompt: string;
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