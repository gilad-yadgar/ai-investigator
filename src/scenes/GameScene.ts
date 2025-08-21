import { ConversationEntry, DialogSceneData, GameState } from '../types/DialogTypes';
import { OllamaService } from '../services/OllamaService';
import { ConversationDisplay } from '../objects/ConversationDisplay';
import { InputDialog } from '../objects/InputDialog';

export class GameScene extends Phaser.Scene {
  private gameState!: GameState;
  private ollamaService!: OllamaService;
  private conversationDisplay!: ConversationDisplay;
  private inputDialog!: InputDialog;
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
    this.inputDialog = new InputDialog(this);

    // Set up input dialog callbacks
    this.inputDialog.onSubmit = (text: string) => this.handlePlayerInput(text);
    this.inputDialog.onCancel = () => this.showMainMenu();

    // Start with welcome message
    this.startConversation();

    // Add click handler for visual novel interaction (only after first exchange)
    this.input.on('pointerdown', () => {
      if (!this.gameState.isGenerating && this.conversationTurn >= 1) {
        this.inputDialog.show();
      }
    });
  }



  private async startConversation(): Promise<void> {
    const welcomeMessage = `Good morning. I'm ${this.gameState.playerName}. I have a few questions for you.`;
    
    this.addToConversation('investigator', welcomeMessage);
    
    // Get initial AI response
    await this.getAIResponse(welcomeMessage);
    
    // Automatically ask the first question to test Ollama
    setTimeout(async () => {
      const firstQuestion = "Where were you last night at 9 PM?";
      this.addToConversation('investigator', firstQuestion);
      await this.getAIResponse(firstQuestion);
      
      // After first question exchange, enable user input
      this.conversationTurn = 1;
      this.showUserInputPrompt();
    }, 2000);
  }

  private showUserInputPrompt(): void {
    // Add a visual indicator that user can now ask questions
    setTimeout(() => {
      this.addToConversation('investigator', '[Click anywhere to ask your own question]');
    }, 1000);
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
  }

  private async getAIResponse(prompt: string): Promise<void> {
    if (this.gameState.isGenerating) {
      return;
    }

    this.gameState.isGenerating = true;

    try {
      const response = await this.ollamaService.generateResponse(prompt);
      this.addToConversation('suspect', response);
    } catch (error) {
      console.error('[GameScene] Error getting AI response:', error);
      this.addToConversation('suspect', '[Error] I need to speak with my lawyer.');
    } finally {
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