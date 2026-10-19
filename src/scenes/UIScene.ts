import Phaser from 'phaser';
import { COLORS, CSS, FONT, GROWTH } from '../config/game-config';
import { getStage } from '../data/stages';
import type { WormPrompt } from '../entities/Worm';
import { input } from '../systems/InputState';
import { TouchControls } from '../ui/TouchControls';
import { createButton } from '../ui/Button';
import type { GardenScene } from './GardenScene';

interface HudPayload {
  prompt: WormPrompt | null;
  state: string;
  pathKind: string;
  depth: number;
}

/** HUD, context prompt, touch controls and pause menu (README §13). Runs on top of GardenScene. */
export class UIScene extends Phaser.Scene {
  private stageId = 'stage-01';
  private hud!: Phaser.GameObjects.Container;
  private promptBox!: Phaser.GameObjects.Container;
  private promptText!: Phaser.GameObjects.Text;
  private depthText!: Phaser.GameObjects.Text;
  private pauseLayer?: Phaser.GameObjects.Container;
  private touch?: TouchControls;
  private paused = false;
  private lastPrompt = '';
  private resizeTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super('UI');
  }

  init(data: { stageId?: string }) {
    this.stageId = data.stageId ?? 'stage-01';
    this.paused = false;
    this.lastPrompt = '';
  }

  private get garden(): GardenScene {
    return this.scene.get('Garden') as GardenScene;
  }

  create() {
    this.layout();

    this.game.events.on('worm:hud', this.onHud, this);
    this.game.events.on('worm:paused', this.showPause, this);
    this.scale.on('resize', this.onResize, this);
    this.input.keyboard?.on('keydown-ESC', this.onEsc, this);
    this.events.once('shutdown', () => {
      this.game.events.off('worm:hud', this.onHud, this);
      this.game.events.off('worm:paused', this.showPause, this);
      this.scale.off('resize', this.onResize, this);
      this.input.keyboard?.off('keydown-ESC', this.onEsc, this);
      this.touch?.destroy();
    });
  }

  private onResize() {
    this.resizeTimer?.remove();
    this.resizeTimer = this.time.delayedCall(100, () => this.layout());
  }

  private layout() {
    const { width: W, height: H } = this.scale;
    this.children.removeAll(true);
    this.touch?.destroy();
    this.touch = undefined;
    this.pauseLayer = undefined;

    const u = Phaser.Math.Clamp(Math.min(W / 800, H / 600), 0.75, 1.25);
    const stage = getStage(this.stageId);
    const garden = this.garden;
    const growth = GROWTH[garden.save?.growthStage ?? 'hatchling'];

    // Objective card.
    const cardW = Math.min(360 * u, W - 90);
    const card = this.add.graphics();
    card.fillStyle(COLORS.panel, 0.72).fillRoundedRect(0, 0, cardW, 70 * u, 10);
    const title = this.add.text(12 * u, 9 * u, `STAGE ${stage?.number ?? 1} · ${(stage?.name ?? '').toUpperCase()}`, { fontFamily: FONT, fontSize: `${Math.round(11 * u)}px`, color: CSS.accent, fontStyle: '700' }).setLetterSpacing(1.5);
    const obj = this.add.text(12 * u, 27 * u, garden.level?.objective.text ?? '', { fontFamily: FONT, fontSize: `${Math.round(13 * u)}px`, color: CSS.text, wordWrap: { width: cardW - 24 * u } });
    const prog = this.add.text(cardW - 10 * u, 9 * u, `0 / ${garden.level?.objective.targetCount ?? 3}`, { fontFamily: FONT, fontSize: `${Math.round(11 * u)}px`, color: CSS.textDim, fontStyle: '700' }).setOrigin(1, 0);
    card.clear();
    const cardH = obj.y + obj.height + 10 * u;
    card.fillStyle(COLORS.panel, 0.72).fillRoundedRect(0, 0, cardW, cardH, 10);

    // Survival bars (values wired up in Milestone 3) + life stage + depth.
    const barY = cardH + 8 * u;
    const bars = this.add.graphics();
    const barW = Math.min(150 * u, cardW / 2 - 6);
    const drawBar = (x: number, label: string, pct: number, color: number) => {
      bars.fillStyle(COLORS.panel, 0.72).fillRoundedRect(x, barY, barW, 22 * u, 6);
      bars.fillStyle(color, 0.9).fillRoundedRect(x + 4, barY + 14 * u, (barW - 8) * pct, 4 * u, 2);
      this.hud?.add(this.add.text(x + 6, barY + 2 * u, label, { fontFamily: FONT, fontSize: `${Math.round(9 * u)}px`, color: CSS.textDim, fontStyle: '700' }).setLetterSpacing(1));
    };
    this.hud = this.add.container(14, 14, [card, title, obj, prog, bars]);
    drawBar(0, 'ENERGY', 1, 0xd9b45a);
    drawBar(barW + 8, 'MOISTURE', 1, 0x6fb0b0);
    this.depthText = this.add.text(0, barY + 30 * u, '', { fontFamily: FONT, fontSize: `${Math.round(11 * u)}px`, color: CSS.textDim });
    this.hud.add(this.depthText);
    this.hud.add(this.add.text(cardW, barY + 30 * u, `Life stage: ${growth.label}`, { fontFamily: FONT, fontSize: `${Math.round(11 * u)}px`, color: CSS.textDim }).setOrigin(1, 0));

    // Pause button.
    const ps = 44;
    const pbtn = this.add.container(W - 14 - ps / 2, 14 + ps / 2);
    const pbg = this.add.graphics().fillStyle(COLORS.panel, 0.72).fillRoundedRect(-ps / 2, -ps / 2, ps, ps, 10);
    pbg.fillStyle(0xf3e6c8, 1).fillRect(-7, -9, 5, 18).fillRect(2, -9, 5, 18);
    pbtn.add(pbg).setSize(ps, ps).setInteractive({ useHandCursor: true });
    pbtn.on('pointerup', () => input.queuePause());

    // Context prompt.
    this.promptText = this.add.text(0, 0, '', { fontFamily: FONT, fontSize: `${Math.round(14 * u)}px`, color: CSS.text, fontStyle: '600' }).setOrigin(0.5);
    const pb = this.add.graphics();
    this.promptBox = this.add.container(W / 2, H - (TouchControls.wanted(this) ? 130 : 48) * u, [pb, this.promptText]).setAlpha(0);
    this.promptBox.setData('bg', pb);
    this.lastPrompt = '';

    if (TouchControls.wanted(this)) {
      this.touch = new TouchControls(this);
      this.touch.build(W, H);
    }

    if (this.paused) this.showPause();
  }

  private onHud(p: HudPayload) {
    const touch = !!this.touch;
    const text = p.prompt ? (touch ? `${p.prompt.label}  ·  tap ${p.prompt.key}` : `[ ${p.prompt.key} / Space ]  ${p.prompt.label}`) : '';
    if (text !== this.lastPrompt) {
      this.lastPrompt = text;
      this.tweens.killTweensOf(this.promptBox);
      if (text) {
        this.promptText.setText(text);
        const bg = this.promptBox.getData('bg') as Phaser.GameObjects.Graphics;
        const w = this.promptText.width + 28;
        const h = this.promptText.height + 14;
        bg.clear().fillStyle(COLORS.panel, 0.82).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
        bg.lineStyle(1.5, COLORS.accent, 0.8).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
        this.tweens.add({ targets: this.promptBox, alpha: 1, duration: 160 });
      } else {
        this.tweens.add({ targets: this.promptBox, alpha: 0, duration: 200 });
      }
      this.touch?.setAction(p.prompt ? p.prompt.key : null);
    }
    this.depthText?.setText(p.pathKind === 'surface' ? 'Surface' : `Underground · ${p.depth} cm deep`);
  }

  private onEsc() {
    if (this.paused) this.resume();
  }

  private showPause() {
    this.paused = true;
    this.pauseLayer?.destroy();
    input.releaseAll();
    const { width: W, height: H } = this.scale;
    const dim = this.add.rectangle(0, 0, W, H, 0x0d0906, 0.72).setOrigin(0).setInteractive();
    const t = this.add.text(W / 2, H * 0.24, 'PAUSED', { fontFamily: FONT, fontSize: '34px', color: CSS.text, fontStyle: '800' }).setOrigin(0.5).setLetterSpacing(6);
    const bw = Math.min(260, W * 0.7);
    const y0 = H * 0.38;
    const b1 = createButton(this, W / 2, y0, 'Resume', () => this.resume(), { width: bw, primary: true });
    const b2 = createButton(this, W / 2, y0 + 64, 'Restart stage', () => this.garden.restartStage(), { width: bw });
    const b3 = createButton(this, W / 2, y0 + 128, 'Main menu', () => this.toMenu(), { width: bw });
    const help = this.add
      .text(W / 2, y0 + 196, 'Move  A/D or ←/→  ·  Choose a branch  ↑/↓ or Space\nPause  Esc  ·  Restart  R', { fontFamily: FONT, fontSize: '13px', color: CSS.textDim, align: 'center', lineSpacing: 6, wordWrap: { width: W - 32 } })
      .setOrigin(0.5, 0);
    this.pauseLayer = this.add.container(0, 0, [dim, t, b1, b2, b3, help]).setDepth(100);
  }

  private resume() {
    this.paused = false;
    this.pauseLayer?.destroy();
    this.pauseLayer = undefined;
    this.scene.resume('Garden');
  }

  private toMenu() {
    this.garden.persist();
    this.scene.stop('Garden');
    this.scene.start('Menu');
  }
}
