import Phaser from 'phaser';
import { HexMapScene } from './scenes/HexMapScene.js';

/**
 * Phaser game configuration.
 * Single scene for now; add Boot/Preload scenes here when you add assets.
 */
export const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#0f0d0a',
  scene: [HexMapScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};
