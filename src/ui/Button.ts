import Phaser from 'phaser';
import { COLORS, FONT } from '../config/game-config';

export interface ButtonOptions {
  width?: number;
  height?: number;
  fontSize?: number;
  primary?: boolean;
  disabled?: boolean;
}

/** Rounded text button with hover, pressed and disabled states. */
export function createButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  opts: ButtonOptions = {},
): Phaser.GameObjects.Container {
  const w = opts.width ?? 220;
  const h = opts.height ?? 52;
  const fs = opts.fontSize ?? 18;
  const bg = scene.add.graphics();
  const text = scene.add
    .text(0, 0, label, { fontFamily: FONT, fontSize: `${fs}px`, fontStyle: '600', color: opts.primary ? '#1b130d' : '#f3e6c8' })
    .setOrigin(0.5);
  const c = scene.add.container(x, y, [bg, text]);

  const paint = (state: 'idle' | 'hover' | 'down') => {
    bg.clear();
    const fill = opts.disabled ? 0x3a2c20 : opts.primary ? COLORS.accent : COLORS.panel;
    const lift = state === 'hover' ? 0.12 : state === 'down' ? -0.12 : 0;
    const col = Phaser.Display.Color.ValueToColor(fill);
    if (lift > 0) col.lighten(lift * 100);
    else if (lift < 0) col.darken(-lift * 100);
    bg.fillStyle(col.color, opts.disabled ? 0.6 : 0.95);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, Math.min(14, h / 2));
    bg.lineStyle(1.5, opts.primary ? 0xf6d58c : 0x7a5f3f, opts.disabled ? 0.3 : 0.9);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, Math.min(14, h / 2));
    text.setAlpha(opts.disabled ? 0.45 : 1);
  };
  paint('idle');

  c.setSize(w, h);
  if (!opts.disabled) {
    c.setInteractive({ useHandCursor: true });
    c.on('pointerover', () => paint('hover'));
    c.on('pointerout', () => paint('idle'));
    c.on('pointerdown', () => paint('down'));
    c.on('pointerup', () => {
      paint('hover');
      onClick();
    });
  }
  return c;
}
