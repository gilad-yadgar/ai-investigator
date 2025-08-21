import 'phaser';
import { GameConfig } from './config';
import './styles.css';

export class InvestigatorGame extends Phaser.Game {
  constructor(config: Phaser.Types.Core.GameConfig) {
    super(config);
    console.log('[InvestigatorGame] Game initialized');
  }
}

window.addEventListener('load', () => {
  console.log('[Main] Starting Investigator Dialog Game...');
  const game = new InvestigatorGame(GameConfig);
});