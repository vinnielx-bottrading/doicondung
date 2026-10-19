import Phaser from 'phaser';

/** Loads assets (none yet — v0.1 art is generated in code) and hands over to the menu. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    // Production art/audio from public/assets/ will be queued here, e.g.:
    // this.load.image('worm-head', 'assets/sprites/worm-head.png');
  }

  create() {
    document.getElementById('boot')?.remove();
    this.scene.start('Menu');
  }
}
