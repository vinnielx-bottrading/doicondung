import Phaser from 'phaser';
import { MAX_ZOOM, MIN_ZOOM, VIEW_HEIGHT, VIEW_WIDTH } from '../config/game-config';
import stage01 from '../data/stage-01.json';
import type { LevelData } from '../data/types';
import { Worm } from '../entities/Worm';
import { input } from '../systems/InputState';
import { SaveSystem, newSave, type SaveData } from '../systems/SaveSystem';
import { DEPTH, TerrainSystem } from '../systems/TerrainSystem';
import { TunnelSystem } from '../systems/TunnelSystem';

const LEVELS: Record<string, LevelData> = {
  'stage-01': stage01 as unknown as LevelData,
};

type Keys = Record<'left' | 'right' | 'up' | 'down' | 'a' | 'd' | 'w' | 's' | 'space' | 'e' | 'esc' | 'r', Phaser.Input.Keyboard.Key>;

/** Gameplay scene for one stage. HUD and touch controls live in UIScene, launched alongside. */
export class GardenScene extends Phaser.Scene {
  level!: LevelData;
  tunnels!: TunnelSystem;
  terrain!: TerrainSystem;
  worm!: Worm;
  save!: SaveData;

  private wormGfx!: Phaser.GameObjects.Graphics;
  private camTarget!: Phaser.GameObjects.Zone;
  private keys?: Keys;
  private saveTimer = 0;

  constructor() {
    super('Garden');
  }

  init(data: { save?: SaveData }) {
    this.save = data.save ?? SaveSystem.load() ?? newSave();
  }

  create() {
    this.level = LEVELS[this.save.currentStageId] ?? LEVELS['stage-01'];
    const { width, height } = this.level.world;

    this.tunnels = new TunnelSystem(this.level);
    this.terrain = new TerrainSystem(this, this.level, this.tunnels);
    this.terrain.build();

    const start = this.level.playerStart;
    this.worm = new Worm(this.tunnels, start, this.save.growthStage);
    const pos = this.save.playerPosition;
    if (pos && this.tunnels.paths.has(pos.pathId)) this.worm.teleport(pos.pathId, pos.s, pos.dir);

    this.wormGfx = this.add.graphics().setDepth(DEPTH.worm);
    this.worm.draw(this.wormGfx);

    // Camera follows the body midpoint, clamped to the level.
    const cam = this.cameras.main;
    cam.setBounds(0, 0, width, height);
    cam.setBackgroundColor('#1b130d');
    this.camTarget = this.add.zone(this.worm.center.x, this.worm.center.y, 1, 1);
    cam.startFollow(this.camTarget, false, 0.09, 0.09);
    this.applyZoom();
    cam.centerOn(this.worm.center.x, this.worm.center.y);
    cam.fadeIn(400, 27, 19, 13);

    this.setupKeys();
    input.releaseAll();

    this.scale.on('resize', this.applyZoom, this);
    this.game.events.on(Phaser.Core.Events.BLUR, this.onBlur, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.applyZoom, this);
      this.game.events.off(Phaser.Core.Events.BLUR, this.onBlur, this);
    });

    this.scene.launch('UI', { stageId: this.level.id });
    this.scene.bringToTop('UI');
  }

  private setupKeys() {
    const kb = this.input.keyboard;
    if (!kb) return;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = kb.addKeys({
      left: K.LEFT, right: K.RIGHT, up: K.UP, down: K.DOWN,
      a: K.A, d: K.D, w: K.W, s: K.S,
      space: K.SPACE, e: K.E, esc: K.ESC, r: K.R,
    }) as Keys;
    kb.addCapture([K.SPACE, K.UP, K.DOWN, K.LEFT, K.RIGHT]);
  }

  private onBlur() {
    input.releaseAll();
    this.keys && Object.values(this.keys).forEach((k) => k.reset());
    this.persist();
    this.pauseGame();
  }

  private applyZoom() {
    const zoom = Phaser.Math.Clamp(Math.min(this.scale.height / VIEW_HEIGHT, this.scale.width / VIEW_WIDTH), MIN_ZOOM, MAX_ZOOM);
    this.cameras.main.setZoom(zoom);
  }

  pauseGame() {
    if (!this.scene.isActive()) return;
    this.persist();
    this.scene.pause();
    this.game.events.emit('worm:paused', true);
  }

  restartStage() {
    const fresh = { ...this.save, playerPosition: null };
    SaveSystem.save(fresh);
    this.scene.stop('UI');
    this.scene.restart({ save: fresh });
  }

  persist() {
    this.save.playerPosition = { pathId: this.worm.pathId, s: this.worm.s, dir: this.worm.dir };
    this.save.growthStage = this.worm.growthStage;
    SaveSystem.save(this.save);
  }

  update(_time: number, delta: number) {
    const k = this.keys;
    const down = (a?: Phaser.Input.Keyboard.Key, b?: Phaser.Input.Keyboard.Key) => !!(a?.isDown || b?.isDown);
    const just = (key?: Phaser.Input.Keyboard.Key) => !!key && Phaser.Input.Keyboard.JustDown(key);

    if (just(k?.esc) || input.consumePause()) {
      this.pauseGame();
      return;
    }
    if (just(k?.r)) {
      this.restartStage();
      return;
    }

    const x = (down(k?.right, k?.d) || input.touchRight ? 1 : 0) - (down(k?.left, k?.a) || input.touchLeft ? 1 : 0);
    const y = (down(k?.down, k?.s) || input.touchDown ? 1 : 0) - (down(k?.up, k?.w) || input.touchUp ? 1 : 0);
    const action = just(k?.space) || just(k?.e) || input.consumeAction();

    this.worm.update(delta, { x, y, action });
    this.worm.draw(this.wormGfx);

    const c = this.worm.center;
    this.camTarget.setPosition(c.x, c.y - 30);

    this.game.events.emit('worm:hud', { prompt: this.worm.prompt, state: this.worm.state, pathKind: this.tunnels.get(this.worm.pathId).kind, depth: Math.max(0, Math.round((this.worm.head.y - this.terrain.groundY(this.worm.head.x)) / 10)) });

    this.saveTimer += delta;
    if (this.saveTimer > 4000) {
      this.saveTimer = 0;
      this.persist();
    }
  }
}
