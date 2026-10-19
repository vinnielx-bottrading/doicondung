import Phaser from 'phaser';
import { COLORS } from './config/game-config';
import { BootScene } from './scenes/BootScene';
import { GardenScene } from './scenes/GardenScene';
import { MenuScene } from './scenes/MenuScene';
import { UIScene } from './scenes/UIScene';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: COLORS.bg,
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
  },
  render: { antialias: true, roundPixels: false },
  input: { activePointers: 3 },
  disableContextMenu: true,
  scene: [BootScene, MenuScene, GardenScene, UIScene],
});

// Handy for debugging in the browser console.
if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;
