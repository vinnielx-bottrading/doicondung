import Phaser from 'phaser';
import { COLORS, CSS, FONT, GAME_TITLE, GROWTH, STUDIO, TAGLINE } from '../config/game-config';
import { STAGES } from '../data/stages';
import { SaveSystem, newSave, type SaveData } from '../systems/SaveSystem';
import { createButton } from '../ui/Button';

/** Title screen + journey map (locked / current / completed stages). */
export class MenuScene extends Phaser.Scene {
  private resizeTimer?: Phaser.Time.TimerEvent;
  private confirmReset = false;

  constructor() {
    super('Menu');
  }

  create() {
    const { width: W, height: H } = this.scale;
    const save = SaveSystem.load();
    const u = Math.min(W / 900, H / 640, 1.4);
    this.confirmReset = false;

    this.drawBackdrop(W, H);

    const titleY = H * 0.16;
    this.add.text(W / 2, titleY - 38 * u, STUDIO.toUpperCase(), { fontFamily: FONT, fontSize: `${Math.round(12 * u + 2)}px`, color: CSS.textDim, fontStyle: '600' }).setOrigin(0.5).setLetterSpacing(4);
    this.add.text(W / 2, titleY, GAME_TITLE, { fontFamily: FONT, fontSize: `${Math.round(54 * u)}px`, color: CSS.text, fontStyle: '800' }).setOrigin(0.5).setLetterSpacing(6).setShadow(0, 3, '#000', 8, false, true);
    this.add.text(W / 2, titleY + 40 * u, TAGLINE, { fontFamily: FONT, fontSize: `${Math.round(15 * u + 2)}px`, color: CSS.accent, fontStyle: 'italic' }).setOrigin(0.5);

    // Buttons.
    const bw = Math.min(260, W * 0.7);
    const by = H * 0.36;
    const bh = Math.max(44, 50 * u);
    createButton(this, W / 2, by, save ? 'New Journey' : 'Start', () => this.startNew(save), { width: bw, height: bh, primary: !save, fontSize: 18 * Math.max(u, 0.85) });
    createButton(this, W / 2, by + bh + 12, 'Continue', () => save && this.startGame(save), { width: bw, height: bh, primary: !!save, disabled: !save, fontSize: 18 * Math.max(u, 0.85) });

    this.drawJourney(W, H * 0.66, u, save);

    this.add
      .text(W / 2, H - 22, 'Move: A/D or ←/→   ·   Branch: ↑/↓ or Space   ·   Pause: Esc', { fontFamily: FONT, fontSize: `${Math.round(11 * u + 3)}px`, color: CSS.textDim, align: 'center', wordWrap: { width: W - 32 } })
      .setOrigin(0.5, 1);

    this.input.keyboard?.once('keydown-ENTER', () => (save ? this.startGame(save) : this.startNew(null)));

    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => this.scale.off('resize', this.onResize, this));
  }

  private onResize() {
    this.resizeTimer?.remove();
    this.resizeTimer = this.time.delayedCall(120, () => this.scene.restart());
  }

  private startNew(existing: SaveData | null) {
    if (existing && !this.confirmReset) {
      // Deliberate input required before wiping progress (README §23 persistence).
      this.confirmReset = true;
      const t = this.add
        .text(this.scale.width / 2, this.scale.height * 0.36 - 44, 'Press "New Journey" again to erase saved progress', { fontFamily: FONT, fontSize: '14px', color: '#f0a07a', backgroundColor: '#1b130dcc', padding: { x: 10, y: 6 } })
        .setOrigin(0.5);
      this.time.delayedCall(3500, () => {
        t.destroy();
        this.confirmReset = false;
      });
      return;
    }
    const fresh = newSave();
    SaveSystem.save(fresh);
    this.startGame(fresh);
  }

  private startGame(save: SaveData) {
    this.scene.start('Garden', { save });
  }

  private drawBackdrop(W: number, H: number) {
    const g = this.add.graphics();
    const ground = H * 0.48;
    g.fillGradientStyle(0xbcd3cb, 0xbcd3cb, 0xf3e1b0, 0xf3e1b0, 1);
    g.fillRect(0, 0, W, ground);
    g.fillStyle(COLORS.soilTop, 1);
    g.fillRect(0, ground, W, H - ground);
    g.fillStyle(COLORS.soil2, 1);
    g.fillRect(0, ground + (H - ground) * 0.35, W, H);
    g.fillStyle(COLORS.soil3, 1);
    g.fillRect(0, ground + (H - ground) * 0.7, W, H);
    g.fillStyle(COLORS.grass, 1);
    for (let x = 0; x < W; x += 4) g.fillTriangle(x - 2, ground + 2, x + 2, ground + 2, x + Math.sin(x) * 4, ground - 8 - ((x * 7) % 16));
    // Darken for legibility.
    g.fillStyle(0x120c08, 0.55);
    g.fillRect(0, 0, W, H);
  }

  private drawJourney(W: number, y: number, u: number, save: SaveData | null) {
    const done = new Set(save?.completedStageIds ?? []);
    const current = save?.currentStageId ?? 'stage-01';
    const n = STAGES.length;
    const span = Math.min(W - 64, 720);
    const x0 = (W - span) / 2;
    const step = span / (n - 1);
    const r = Math.max(14, 18 * u);

    this.add.text(W / 2, y - r - 34 * Math.max(u, 0.8), 'JOURNEY', { fontFamily: FONT, fontSize: `${Math.round(12 * u + 2)}px`, color: CSS.textDim, fontStyle: '700' }).setOrigin(0.5).setLetterSpacing(4);

    const g = this.add.graphics();
    g.lineStyle(3, 0x7a5f3f, 0.8);
    g.lineBetween(x0, y, x0 + span, y);

    const info = this.add
      .text(W / 2, y + r + 40 * Math.max(u, 0.8), '', { fontFamily: FONT, fontSize: `${Math.round(12 * u + 3)}px`, color: CSS.text, align: 'center', wordWrap: { width: Math.min(W - 40, 560) }, lineSpacing: 4 })
      .setOrigin(0.5, 0);

    const describe = (i: number) => {
      const st = STAGES[i];
      const state = done.has(st.id) ? 'Completed' : st.id === current ? 'Current' : 'Locked';
      info.setText(`Stage ${st.number} · ${st.name} — ${state}\n${st.area}: ${st.objective}\nGrowth reward → ${GROWTH[st.growthTo].label}`);
    };

    STAGES.forEach((st, i) => {
      const x = x0 + i * step;
      const isDone = done.has(st.id);
      const isCur = st.id === current;
      const node = this.add.graphics();
      if (isDone) {
        node.fillStyle(COLORS.accent, 1).fillCircle(x, y, r);
        node.lineStyle(3, 0x1b130d, 1);
        node.beginPath();
        node.moveTo(x - r * 0.4, y);
        node.lineTo(x - r * 0.1, y + r * 0.3);
        node.lineTo(x + r * 0.45, y - r * 0.35);
        node.strokePath();
      } else if (isCur) {
        node.fillStyle(COLORS.panel, 1).fillCircle(x, y, r);
        node.lineStyle(3, COLORS.accent, 1).strokeCircle(x, y, r);
        const ring = this.add.circle(x, y, r + 6).setStrokeStyle(2, COLORS.accent, 0.8);
        this.tweens.add({ targets: ring, scale: 1.25, alpha: 0, duration: 1300, repeat: -1 });
      } else {
        node.fillStyle(0x2a2018, 1).fillCircle(x, y, r);
        node.lineStyle(2, 0x5a4632, 1).strokeCircle(x, y, r);
      }
      this.add
        .text(x, y, isDone ? '' : String(st.number), { fontFamily: FONT, fontSize: `${Math.round(r * 0.9)}px`, fontStyle: '700', color: isCur ? CSS.accent : isDone ? CSS.dark : '#6f5a44' })
        .setOrigin(0.5);
      const hit = this.add.zone(x, y, r * 2.4, r * 2.4).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => describe(i));
      hit.on('pointerdown', () => describe(i));
    });

    describe(Math.max(0, STAGES.findIndex((s) => s.id === current)));
  }
}
