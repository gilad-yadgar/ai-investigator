import { ConversationEntry, DialogSceneData, GameState } from '../types/DialogTypes';
import { OllamaService } from '../services/OllamaService';
import { ConversationDisplay } from '../objects/ConversationDisplay';

export class GameScene extends Phaser.Scene {
  private gameState!: GameState;
  private ollamaService!: OllamaService;
  private conversationDisplay!: ConversationDisplay;
  private conversationTurn: number = 0;
  private characterSprite?: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload(): void {
    // Preload background and character sprites
    this.load.image('background', 'assets/background.png');
    
    // Load emotion sprites
    this.load.image('emo-angry', 'assets/emo/emo-angry.png');
    this.load.image('emo-scared', 'assets/emo/emo-scared.png');
    this.load.image('emo-bored', 'assets/emo/emo-bored.png');
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

    // Add character sprite using individual image files
    try {
      // Create character sprite with default texture (bored)
      this.characterSprite = this.add.image(
        this.cameras.main.centerX,
        this.cameras.main.height - 180,
        'emo-bored'
      );
      
      // Scale to appropriate size for visual novel
      this.characterSprite.setScale(0.6);
      this.characterSprite.setOrigin(0.5, 1); // Bottom center origin
      
      // Debug: Log sprite info
      console.log('[GameScene] Character sprite dimensions:', this.characterSprite.width, 'x', this.characterSprite.height);
      console.log('[GameScene] Character sprite texture:', this.characterSprite.texture.key);
      
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
      console.log('[GameScene] Player input is empty or already waiting for response');
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
      console.log('[GameScene] Already waiting for response');
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
        (fullResponse: string, emotion?: 'angry' | 'scared' | 'bored') => {
          // Complete the streaming
          streamingEntry.text = fullResponse;
          streamingEntry.emotion = emotion;
          streamingEntry.isStreaming = false;
          this.conversationDisplay.completeStreaming();
          this.gameState.isGenerating = false;
          
          // Update character sprite based on emotion
          this.updateCharacterEmotion(emotion);
          
          console.log(`[GameScene] Streaming complete: ${fullResponse.substring(0, 50)}... (emotion: ${emotion})`);
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

  private updateCharacterEmotion(emotion?: 'angry' | 'scared' | 'bored'): void {
    if (!this.characterSprite || !emotion) {
      console.log('[GameScene] No emotion or character sprite to update');
      return;
    }

    const emotionTextureKey = `emo-${emotion}`;
    console.log(`[GameScene] Updating character emotion to: ${emotion}`);
    
    try {
      // Switch the sprite texture to the emotion sprite
      this.characterSprite.setTexture(emotionTextureKey);
      
      // Optional: Add a subtle tween animation when emotion changes
      this.tweens.add({
        targets: this.characterSprite,
        scaleX: 0.58,
        scaleY: 0.58,
        duration: 100,
        yoyo: true,
        ease: 'Power2'
      });
      
    } catch (error) {
      console.warn(`[GameScene] Failed to update emotion sprite to ${emotionTextureKey}:`, error);
    }
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
