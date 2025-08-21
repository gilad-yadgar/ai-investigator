import { DialogSceneData } from '../types/DialogTypes';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    console.log('[MenuScene] Creating menu scene - auto-starting game');

    // Skip the menu and go straight to game
    this.startGame();
  }

  private startGame(): void {
    const playerName = 'Detective Smith'; // Default name
    
    console.log('[MenuScene] Starting game with player:', playerName);

    // Start the main game scene
    const sceneData: DialogSceneData = { playerName };
    this.scene.start('GameScene', sceneData);
  }
}