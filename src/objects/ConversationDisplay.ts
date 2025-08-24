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
  private currentStreamingEntry: ConversationEntry | null = null;
  private typingCursor: Phaser.GameObjects.Text | null = null;
  
  // Inline input elements
  private inputContainer: HTMLDivElement | null = null;
  private inputField: HTMLInputElement | null = null;
  private inputSubmitButton: HTMLButtonElement | null = null;
  private isInputVisible: boolean = false;
  
  // Callbacks
  public onSubmit?: (text: string) => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.displayWidth = scene.cameras.main.width - 100;
    this.displayHeight = 200;

    // Create container
    this.container = scene.add.container(x, y);

    // Create organic dialogue box background
    this.createDialogueBox();
    
    // Create inline input elements
    this.createInlineInput();

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

  private createInlineInput(): void {
    // Create input container - positioned below the dialogue box
    this.inputContainer = document.createElement('div');
    this.inputContainer.className = 'inline-input-container';
    this.inputContainer.style.cssText = `
      position: absolute;
      left: ${this.container.x + 30}px;
      top: ${this.container.y + this.displayHeight + 10}px;
      width: ${this.displayWidth - 60}px;
      display: none;
      z-index: 1000;
    `;

    // Create input field
    this.inputField = document.createElement('input');
    this.inputField.className = 'inline-input-field';
    this.inputField.type = 'text';
    this.inputField.placeholder = 'Enter your response here';
    this.inputField.maxLength = 200;
    this.inputField.style.cssText = `
      width: calc(100% - 80px);
      padding: 8px 12px;
      border: 2px solid #4a90e2;
      border-radius: 6px;
      background: rgba(0, 0, 0, 0.8);
      color: #ffffff;
      font-size: 14px;
      font-family: Arial, sans-serif;
      outline: none;
    `;

    // Create submit button
    this.inputSubmitButton = document.createElement('button');
    this.inputSubmitButton.className = 'inline-input-submit';
    this.inputSubmitButton.textContent = 'Ask';
    this.inputSubmitButton.style.cssText = `
      width: 70px;
      padding: 8px 12px;
      margin-left: 8px;
      border: none;
      border-radius: 6px;
      background: #4a90e2;
      color: #ffffff;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
      outline: none;
    `;

    // Add hover effect to button
    this.inputSubmitButton.addEventListener('mouseenter', () => {
      this.inputSubmitButton!.style.background = '#357abd';
    });
    this.inputSubmitButton.addEventListener('mouseleave', () => {
      this.inputSubmitButton!.style.background = '#4a90e2';
    });

    // Add event listeners
    this.inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleInputSubmit();
      }
    });

    this.inputSubmitButton.addEventListener('click', () => {
      this.handleInputSubmit();
    });

    // Assemble input elements
    this.inputContainer.appendChild(this.inputField);
    this.inputContainer.appendChild(this.inputSubmitButton);
    document.body.appendChild(this.inputContainer);
  }

  get streamingEntry(): ConversationEntry | null {
    return this.currentStreamingEntry;
  }

  private handleInputSubmit(): void {
    const text = this.inputField?.value.trim() || '';
    
    if (text.length === 0) {
      return;
    }

    console.log('[ConversationDisplay] Submitting text:', text);
    
    this.hideInput();
    
    if (this.onSubmit) {
      this.onSubmit(text);
    }
  }

  showInput(): void {
    if (this.isInputVisible || !this.inputContainer) {
      return;
    }

    console.log('[ConversationDisplay] Showing inline input');
    this.isInputVisible = true;
    this.inputContainer.style.display = 'block';
    
    // Focus the input field
    setTimeout(() => {
      this.inputField?.focus();
    }, 100);
  }

  hideInput(): void {
    if (!this.isInputVisible || !this.inputContainer) {
      return;
    }

    console.log('[ConversationDisplay] Hiding inline input');
    this.isInputVisible = false;
    this.inputContainer.style.display = 'none';
    
    // Clear the input field
    if (this.inputField) {
      this.inputField.value = '';
    }
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

    // Store reference to streaming entry
    if (entry.isStreaming) {
      this.currentStreamingEntry = entry;
    }

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

    // For streaming entries, don't show the message text initially
    // Only show the character name, keep the user's text visible
    if (!entry.isStreaming) {
      // Create message text with word wrap for non-streaming entries
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
    }

    // Add text elements to container
    this.container.add([this.characterNameText]);
    
    // Add message text and indicator only for non-streaming entries
    if (this.messageText) {
      this.container.add(this.messageText);
    }
    if (this.textIndicator) {
      this.container.add(this.textIndicator);
    }

    console.log('[ConversationDisplay] Showing message:', entry.speaker, entry.text.substring(0, 50));
  }

  updateStreamingText(chunk: string): void {
    if (this.currentStreamingEntry && this.characterNameText) {
      // If this is the first chunk, create the message text now
      if (!this.messageText) {
        this.messageText = this.scene.add.text(
          30,
          70,
          chunk,
          {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            wordWrap: { width: this.displayWidth - 60 },
            lineSpacing: 6
          }
        );
        
        // Add the message text to container
        this.container.add(this.messageText);
        
      } else {
        // Update existing message text
        this.currentStreamingEntry.text += chunk;
        this.messageText.setText(this.currentStreamingEntry.text);
        
      }
      
      // Add a subtle typing effect
      this.scene.tweens.add({
        targets: this.messageText,
        alpha: 0.8,
        duration: 50,
        yoyo: true,
        onComplete: () => {
          this.messageText?.setAlpha(1);
        }
      });
    }
  }

  completeStreaming(): void {
    if (this.currentStreamingEntry) {
      
      // Show the text indicator when streaming is complete
      this.createTextIndicator();
      if (this.textIndicator) {
        this.container.add(this.textIndicator);
      }
      this.currentStreamingEntry = null;
      
      // Show input field when streaming is complete so user can respond
      this.showInput();
    }
  }

  private createTypingCursor(): void {
    this.typingCursor = this.scene.add.text(0, 0, '|', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif'
    });
    
    // Position cursor at the end of the text
    this.updateTypingCursorPosition();
    
    // Add blinking animation
    this.scene.tweens.add({
      targets: this.typingCursor,
      alpha: 0,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
    
    this.container.add(this.typingCursor);
  }

  private updateTypingCursorPosition(): void {
    if (this.typingCursor && this.messageText) {
      // Calculate cursor position at the end of the text
      const textWidth = this.messageText.width;
      const textHeight = this.messageText.height;
      
      // Position cursor at the end of the last line
      const cursorX = 30 + textWidth;
      const cursorY = 70 + textHeight - 16; // Adjust for line height
      
      this.typingCursor.setPosition(cursorX, cursorY);
    }
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
    if (this.typingCursor) {
      this.typingCursor.destroy();
      this.typingCursor = null;
    }
  }

  update(): void {
    // No update needed for visual novel style
  }

  clear(): void {
    this.clearCurrentMessage();
  }
}