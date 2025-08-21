export class InputDialog {
  private scene: Phaser.Scene;
  private container: HTMLDivElement | null = null;
  private input: HTMLInputElement | null = null;
  private isVisible: boolean = false;

  public onSubmit?: (text: string) => void;
  public onCancel?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    console.log('[InputDialog] Created');
  }

  show(): void {
    if (this.isVisible) {
      return;
    }

    console.log('[InputDialog] Showing input dialog');
    this.isVisible = true;

    // Create DOM overlay
    this.container = document.createElement('div');
    this.container.className = 'ui-overlay';

    const dialogBox = document.createElement('div');
    dialogBox.className = 'dialog-box';

    const title = document.createElement('h3');
    title.textContent = 'What do you want to say?';

    this.input = document.createElement('input');
    this.input.className = 'dialog-input';
    this.input.type = 'text';
    this.input.placeholder = 'Type your question or statement...';
    this.input.maxLength = 200;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'dialog-buttons';

    const submitButton = document.createElement('button');
    submitButton.className = 'dialog-button primary';
    submitButton.textContent = 'Ask/Say';
    submitButton.onclick = () => this.handleSubmit();

    const cancelButton = document.createElement('button');
    cancelButton.className = 'dialog-button secondary';
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = () => this.handleCancel();

    // Handle keyboard events
    this.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSubmit();
      } else if (e.key === 'Escape') {
        this.handleCancel();
      }
    });

    // Assemble the dialog
    buttonContainer.appendChild(submitButton);
    buttonContainer.appendChild(cancelButton);

    dialogBox.appendChild(title);
    dialogBox.appendChild(this.input);
    dialogBox.appendChild(buttonContainer);

    this.container.appendChild(dialogBox);
    document.body.appendChild(this.container);

    // Focus the input
    setTimeout(() => {
      this.input?.focus();
    }, 100);
  }

  hide(): void {
    if (!this.isVisible || !this.container) {
      return;
    }

    console.log('[InputDialog] Hiding input dialog');
    this.isVisible = false;

    document.body.removeChild(this.container);
    this.container = null;
    this.input = null;
  }

  private handleSubmit(): void {
    const text = this.input?.value.trim() || '';
    
    if (text.length === 0) {
      return;
    }

    console.log('[InputDialog] Submitting text:', text);
    
    this.hide();
    
    if (this.onSubmit) {
      this.onSubmit(text);
    }
  }

  private handleCancel(): void {
    console.log('[InputDialog] Cancelled');
    
    this.hide();
    
    if (this.onCancel) {
      this.onCancel();
    }
  }

  isShowing(): boolean {
    return this.isVisible;
  }
}