import { ConversationEntry } from '../types/DialogTypes';

export class ConversationDisplay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private dialogueBox!: Phaser.GameObjects.Graphics;
  private characterNameText: Phaser.GameObjects.Text | null = null;
  private messageText: Phaser.GameObjects.Text | null = null;
  private textIndicator: Phaser.GameObjects.Graphics | null = null;
  private menuContainer: Phaser.GameObjects.Container | null = null;
  private displayWidth: number;
  private displayHeight: number;
  private isTextComplete: boolean = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.displayWidth = scene.cameras.main.width - 100;
    this.displayHeight = 200;

    // Create container
    this.container = scene.add.container(x, y);

    // Create organic dialogue box background
    this.createDialogueBox();

    console.log('[ConversationDisplay] Created professional visual novel display:', this.displayWidth, 'x', this.displayHeight);
  }

  private createDialogueBox(): void {
    this.dialogueBox = this.scene.add.graphics();
    
    // Create semi-transparent black background with rounded corners
    const borderColor = 0x000000;
    const borderAlpha = 0.8;
    
    this.dialogueBox.fillStyle(borderColor, borderAlpha);
    this.dialogueBox.fillRoundedRect(0, 0, this.displayWidth, this.displayHeight, 10);
    
    // Add dialogue box to container
    this.container.add(this.dialogueBox);
  }



  private handleMenuClick(option: string): void {
    console.log('[ConversationDisplay] Menu option clicked:', option);
    
    switch (option) {
      case 'save':
        // TODO: Implement save functionality
        console.log('Save game');
        break;
      case 'load':
        // TODO: Implement load functionality
        console.log('Load game');
        break;
      case 'auto':
        // TODO: Implement auto-advance functionality
        console.log('Auto-advance');
        break;
      case 'skip':
        // TODO: Implement skip functionality
        console.log('Skip text');
        break;
    }
  }

  addEntry(entry: ConversationEntry): void {
    // Clear previous message
    this.clearCurrentMessage();

    // Create character name with elegant script font
    const characterName = entry.speaker === 'investigator' ? 'Detective Smith' : 'Suspect';
    const nameColor = entry.speaker === 'investigator' ? '#4a90e2' : '#e74c3c';
    
    this.characterNameText = this.scene.add.text(
      30,
      30,
      characterName,
      {
        fontSize: '20px',
        color: nameColor,
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic'
      }
    );

    // Create message text with word wrap
    this.messageText = this.scene.add.text(
      30,
      70,
      entry.text,
      {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        wordWrap: { width: this.displayWidth - 60 },
        lineSpacing: 6
      }
    );

    // Create text advancement indicator
    this.createTextIndicator();

    // Add text elements to container
    this.container.add([this.characterNameText, this.messageText]);
    
    // Add text indicator separately since it's a Graphics object
    if (this.textIndicator) {
      this.container.add(this.textIndicator);
    }

    console.log('[ConversationDisplay] Showing message:', entry.speaker, entry.text.substring(0, 50));
  }

  private createTextIndicator(): void {
    this.textIndicator = this.scene.add.graphics();
    this.textIndicator.fillStyle(0xffffff, 1);
    
    // Create diamond shape indicator
    const indicatorX = this.displayWidth - 40;
    const indicatorY = this.displayHeight - 30;
    
    this.textIndicator.fillTriangle(
      indicatorX, indicatorY - 8,
      indicatorX - 8, indicatorY,
      indicatorX + 8, indicatorY
    );
    
    // Add pulsing animation
    this.scene.tweens.add({
      targets: this.textIndicator,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });
  }

  private clearCurrentMessage(): void {
    if (this.characterNameText) {
      this.characterNameText.destroy();
      this.characterNameText = null;
    }
    if (this.messageText) {
      this.messageText.destroy();
      this.messageText = null;
    }
    if (this.textIndicator) {
      this.textIndicator.destroy();
      this.textIndicator = null;
    }
  }

  update(): void {
    // No update needed for visual novel style
  }

  clear(): void {
    this.clearCurrentMessage();
  }
}