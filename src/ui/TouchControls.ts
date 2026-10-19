import Phaser from 'phaser';
import { COLORS, FONT } from '../config/game-config';
import { input } from '../systems/InputState';

type HoldKey = 'touchLeft' | 'touchRight';

/**
 * Large edge-aligned touch controls (README §9 mobile). Movement buttons work while held and
 * stop on release; the action button takes the route offered by the current prompt.
 */
export class TouchControls {
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private actionBtn!: Phaser.GameObjects.Arc;
  private actionLabel!: Phaser.GameObjects.Text;
  private readonly held = new Map<HoldKey, number>();

  constructor(private readonly scene: Phaser.Scene) {}

  static wanted(scene: Phaser.Scene): boolean {
    const forced = new URLSearchParams(window.location.search).get('touch');
    if (forced === '1') return true;
    if (forced === '0') return false;
    return scene.sys.game.device.input.touch || window.matchMedia?.('(pointer: coarse)').matches;
  }

  build(W: number, H: number) {
    this.destroy();
    const r = Phaser.Math.Clamp(Math.min(W, H) * 0.085, 30, 48);
    const pad = Math.max(16, r * 0.45);
    const y = H - pad - r;
    this.holdButton(pad + r, y, r, '◀', 'touchLeft');
    this.holdButton(pad + r * 3 + 14, y, r, '▶', 'touchRight');

    const ar = r * 1.05;
    this.actionBtn = this.scene.add.circle(W - pad - ar, y, ar, COLORS.panel, 0.55).setStrokeStyle(2, COLORS.accent, 0.5);
    this.actionLabel = this.scene.add.text(W - pad - ar, y, '•', { fontFamily: FONT, fontSize: `${Math.round(ar * 0.8)}px`, color: '#e0b45a', fontStyle: '700' }).setOrigin(0.5);
    this.actionBtn.setInteractive();
    this.actionBtn.on('pointerdown', () => {
      input.queueAction();
      this.actionBtn.setFillStyle(COLORS.accent, 0.45);
    });
    const restore = () => this.actionBtn.setFillStyle(COLORS.panel, 0.55);
    this.actionBtn.on('pointerup', restore);
    this.actionBtn.on('pointerout', restore);
    this.objects.push(this.actionBtn, this.actionLabel);
    this.setAction(null);

    this.scene.input.on('pointerup', this.onGlobalUp, this);
  }

  /** Reflect the current context prompt on the action button. */
  setAction(key: string | null) {
    if (!this.actionBtn) return;
    const on = key !== null;
    this.actionLabel.setText(on ? key : '•');
    this.actionBtn.setAlpha(on ? 1 : 0.45);
    this.actionLabel.setAlpha(on ? 1 : 0.4);
    this.actionBtn.setStrokeStyle(2, COLORS.accent, on ? 0.95 : 0.3);
  }

  private holdButton(x: number, y: number, r: number, label: string, key: HoldKey) {
    const btn = this.scene.add.circle(x, y, r, COLORS.panel, 0.55).setStrokeStyle(2, 0xb8a68a, 0.5);
    const txt = this.scene.add.text(x, y, label, { fontFamily: FONT, fontSize: `${Math.round(r * 0.7)}px`, color: '#f3e6c8' }).setOrigin(0.5);
    btn.setInteractive();
    const press = (p: Phaser.Input.Pointer) => {
      this.held.set(key, p.id);
      input[key] = true;
      btn.setFillStyle(COLORS.accent, 0.4);
    };
    const release = () => {
      this.held.delete(key);
      input[key] = false;
      btn.setFillStyle(COLORS.panel, 0.55);
    };
    btn.on('pointerdown', press);
    btn.on('pointerup', release);
    btn.on('pointerout', release);
    this.objects.push(btn, txt);
  }

  private onGlobalUp(p: Phaser.Input.Pointer) {
    for (const [key, id] of this.held) {
      if (id === p.id) {
        this.held.delete(key);
        input[key] = false;
      }
    }
    this.objects.forEach((o) => {
      if (o instanceof Phaser.GameObjects.Arc && o !== this.actionBtn && !this.held.size) o.setFillStyle(COLORS.panel, 0.55);
    });
  }

  destroy() {
    this.scene.input.off('pointerup', this.onGlobalUp, this);
    this.objects.forEach((o) => o.destroy());
    this.objects.length = 0;
    this.held.clear();
    input.touchLeft = input.touchRight = false;
  }
}
