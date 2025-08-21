export class LoadingScreen {
  private scene: Phaser.Scene;
  private container: HTMLDivElement | null = null;
  private isVisible: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    console.log('[LoadingScreen] Created');
  }

  show(): void {
    if (this.isVisible) {
      return;
    }

    console.log('[LoadingScreen] Showing loading screen');
    this.isVisible = true;

    // Create DOM overlay
    this.container = document.createElement('div');
    this.container.className = 'ui-overlay';

    const dialogBox = document.createElement('div');
    dialogBox.className = 'dialog-box';

    const title = document.createElement('h3');
    title.textContent = 'Suspect is thinking...';

    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Please wait...';
    subtitle.style.color = '#ffffff';
    subtitle.style.fontSize = '16px';
    subtitle.style.margin = '10px 0 0 0';

    // Assemble the dialog
    dialogBox.appendChild(title);
    dialogBox.appendChild(spinner);
    dialogBox.appendChild(subtitle);

    this.container.appendChild(dialogBox);
    document.body.appendChild(this.container);
  }

  hide(): void {
    if (!this.isVisible || !this.container) {
      return;
    }

    console.log('[LoadingScreen] Hiding loading screen');
    this.isVisible = false;

    document.body.removeChild(this.container);
    this.container = null;
  }

  isShowing(): boolean {
    return this.isVisible;
  }
}
