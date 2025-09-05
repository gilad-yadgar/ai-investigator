import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';

export const GameConfig: Phaser.Types.Core.GameConfig = {
  title: 'Investigator Dialog',
  url: 'https://github.com/user/investigator-dialog-phaser',
  version: '1.0.0',
  backgroundColor: 0x000000,
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: 'game',
    width: 1200,
    height: 800,
    min: {
      width: 800,
      height: 600
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }
    }
  },
  scene: [MenuScene, GameScene],
  dom: {
    createContainer: true
  }
};
