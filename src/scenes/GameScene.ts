import { ConversationEntry, DialogSceneData, GameState } from '../types/DialogTypes';
import { OllamaService } from '../services/OllamaService';
import { ConversationDisplay } from '../objects/ConversationDisplay';

export class GameScene extends Phaser.Scene {
  private gameState!: GameState;
  private ollamaService!: OllamaService;
  private conversationDisplay!: ConversationDisplay;
  private conversationTurn: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // Preload background and character sprites
    this.load.image('background', 'assets/background.png');
    // Load spritesheet with proper frame dimensions based on 1536x1024 total size
    this.load.spritesheet('sprites1', 'assets/sprites1.png', { 
      frameWidth: 410, 
      frameHeight: 1000 
    });
    // this.load.image('sprites2', 'assets/sprites2.png');
  }

  init(data: DialogSceneData): void {
    console.log('[GameScene] Initializing with data:', data);
    
    this.gameState = {
      playerName: data.playerName || 'Detective Smith',
      conversationHistory: [],
      isGenerating: false,
      currentInput: ''
    };

    this.ollamaService = new OllamaService();
  }

  create(): void {
    console.log('[GameScene] Creating game scene');

    // Create background using the loaded image
    const background = this.add.image(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'background'
    );

    // Scale the background to fit the screen
    const scaleX = this.cameras.main.width / background.width;
    const scaleY = this.cameras.main.height / background.height;
    const scale = Math.max(scaleX, scaleY); // Use max to cover the entire screen
    background.setScale(scale);

    // Add character sprite with proper frame extraction
    try {
      // Try middle sprite (frame 4 in 6x4 grid would be middle of first row)
      const characterSprite = this.add.sprite(
        this.cameras.main.centerX,
        this.cameras.main.height - 180,
        'sprites1',
        2 // Try frame 2 (middle-ish of top row)
      );
      
      // Scale to appropriate size for visual novel
      characterSprite.setScale(0.6);
      characterSprite.setOrigin(0.5, 1); // Bottom center origin
      
      // Debug: Log sprite info
      console.log('[GameScene] Character sprite dimensions:', characterSprite.width, 'x', characterSprite.height);
      console.log('[GameScene] Character sprite frame:', characterSprite.frame.name);
      
    } catch (error) {
      console.log('[GameScene] Character sprite not available, using fallback:', error);
      // Fallback: simple character silhouette
      this.add.circle(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        60,
        0x95a5a6
      );
    }

    // Create UI components - position dialogue box at bottom like visual novel
    this.conversationDisplay = new ConversationDisplay(this, 50, this.cameras.main.height - 220);

    // Set up conversation display callbacks
    this.conversationDisplay.onSubmit = (text: string) => this.handlePlayerInput(text);

    // Start with welcome message
    this.startConversation();

    // Add click handler for visual novel interaction (only after first exchange)
    this.input.on('pointerdown', () => {
      if (!this.gameState.isGenerating && this.conversationTurn >= 1) {
        this.conversationDisplay.showInput();
      }
    });
  }

  private async startConversation(): Promise<void> {
    // Start with suspect asking why they're here
    const initialSuspectMessage = "Why am I here? What do you want from me?";
    
    this.addToConversation('suspect', initialSuspectMessage);
    
    // Enable user input immediately - player can respond to suspect's question
    this.conversationTurn = 1;
  }


  private async handlePlayerInput(text: string): Promise<void> {
    if (!text.trim() || this.gameState.isGenerating) {
      return;
    }

    console.log('[GameScene] Player input:', text);
    
    this.addToConversation('investigator', text);
    await this.getAIResponse(text);
    
    // Increment conversation turn
    this.conversationTurn++;
    
    // Note: Input will be shown automatically when streaming completes
  }

  private async getAIResponse(prompt: string): Promise<void> {
    if (this.gameState.isGenerating) {
      return;
    }

    this.gameState.isGenerating = true;

    try {
      // Create a streaming entry and display it immediately
      const streamingEntry: ConversationEntry = {
        speaker: 'suspect',
        text: '',
        timestamp: new Date(),
        isStreaming: true
      };

      // Use streaming response
      await this.ollamaService.generateStreamingResponse(
        prompt,
        (chunk: string) => {
          // Update the streaming text as chunks arrive
          if (this.conversationDisplay.streamingEntry?.speaker != 'suspect') {
            this.conversationDisplay.addEntry(streamingEntry);
            this.gameState.conversationHistory.push(streamingEntry);
          }
          this.conversationDisplay.updateStreamingText(chunk);
        },
        (fullResponse: string) => {
          // Complete the streaming
          streamingEntry.text = fullResponse;
          streamingEntry.isStreaming = false;
          this.conversationDisplay.completeStreaming();
          this.gameState.isGenerating = false;
          console.log(`[GameScene] Streaming complete: ${fullResponse.substring(0, 50)}...`);
        },
        (error: string) => {
          // Handle error
          streamingEntry.text = error;
          streamingEntry.isStreaming = false;
          this.conversationDisplay.completeStreaming();
          this.gameState.isGenerating = false;
          console.error('[GameScene] Streaming error:', error);
        }
      );
    } catch (error) {
      console.error('[GameScene] Error getting AI response:', error);
      this.addToConversation('suspect', '[Error] I need to speak with my lawyer.');
      this.gameState.isGenerating = false;
    }
  }

  private addToConversation(speaker: 'investigator' | 'suspect', text: string): void {
    const entry: ConversationEntry = {
      speaker,
      text,
      timestamp: new Date()
    };

    this.gameState.conversationHistory.push(entry);
    this.conversationDisplay.addEntry(entry);

    console.log(`[GameScene] Added conversation entry: ${speaker}: ${text.substring(0, 50)}...`);
  }

  private showMainMenu(): void {
    console.log('[GameScene] Returning to main menu');
    this.scene.start('MenuScene');
  }

  update(): void {
    // Update UI components if needed
    this.conversationDisplay?.update();
  }
}