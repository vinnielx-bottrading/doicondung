import Phaser from 'phaser';
import { COLORS, SURFACE_GROUND_OFFSET, TUNNEL_RADIUS } from '../config/game-config';
import type { LevelData, Vec2 } from '../data/types';
import type { Point, TunnelSystem } from './TunnelSystem';

/** Render depths shared by every gameplay scene. */
export const DEPTH = {
  sky: 0,
  far: 1,
  mid: 2,
  terrain: 3,
  objects: 5,
  worm: 10,
  foreground: 20,
} as const;

/**
 * Draws the authored level once into static layers (README §8 visual layers):
 * sky → far silhouettes (parallax) → giant mid-ground plants (parallax) → soil cutaway → foreground tufts.
 * All art is generated in code as replaceable placeholder art.
 */
export class TerrainSystem {
  private readonly surfacePts: Point[];
  private readonly rng: Phaser.Math.RandomDataGenerator;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly level: LevelData,
    private readonly tunnels: TunnelSystem,
  ) {
    const surface = level.paths.find((p) => p.kind === 'surface');
    this.surfacePts = (surface?.points ?? [[0, 380], [level.world.width, 380]]).map(([x, y]) => ({ x, y }));
    this.rng = new Phaser.Math.RandomDataGenerator([level.id]);
  }

  /** Y of the visible ground line at world x. */
  groundY(x: number): number {
    const p = this.surfacePts;
    if (x <= p[0].x) return p[0].y + SURFACE_GROUND_OFFSET;
    for (let i = 1; i < p.length; i++) {
      if (x <= p[i].x) {
        const t = (x - p[i - 1].x) / (p[i].x - p[i - 1].x);
        return p[i - 1].y + (p[i].y - p[i - 1].y) * t + SURFACE_GROUND_OFFSET;
      }
    }
    return p[p.length - 1].y + SURFACE_GROUND_OFFSET;
  }

  build() {
    this.buildSky();
    this.buildFar();
    this.buildMid();
    this.buildTerrain();
    this.buildForeground();
  }

  // ---------------------------------------------------------------- layers

  private buildSky() {
    const key = 'sky-gradient';
    if (!this.scene.textures.exists(key)) {
      const tex = this.scene.textures.createCanvas(key, 4, 256);
      if (tex) {
        const ctx = tex.getContext();
        const g = ctx.createLinearGradient(0, 0, 0, 256);
        g.addColorStop(0, '#bcd3cb');
        g.addColorStop(0.55, '#dfe3c6');
        g.addColorStop(1, '#f3e1b0');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 4, 256);
        tex.refresh();
      }
    }
    const top = this.minGround() + 40;
    this.scene.add.image(0, 0, key).setOrigin(0).setDisplaySize(this.level.world.width, top).setDepth(DEPTH.sky);
    // Soft sun glow after the rain (baked once, not redrawn per frame).
    const glow = this.scene.make.graphics({}, false);
    for (let i = 8; i > 0; i--) {
      glow.fillStyle(0xfff2c8, 0.05);
      glow.fillCircle(260, 260, 40 + i * 26);
    }
    this.bake(glow, 'sun-glow', 520, 520).setPosition(260, -170).setScrollFactor(0.2, 1).setDepth(DEPTH.sky);
  }

  private buildFar() {
    const { width } = this.level.world;
    const g = this.scene.make.graphics({}, false);
    const base = this.minGround() + 30;
    const r = this.rng;
    // Hedge-like rolling silhouettes.
    g.fillStyle(COLORS.farPlant, 0.55);
    const hedge: Phaser.Types.Math.Vector2Like[] = [{ x: 0, y: base }];
    for (let x = 0; x <= width; x += 40) hedge.push({ x, y: base - 120 - Math.sin(x * 0.004) * 50 - r.between(0, 26) });
    hedge.push({ x: width, y: base });
    g.fillPoints(hedge, true);
    // Distant tall stems and seed heads.
    g.fillStyle(COLORS.farPlant, 0.8);
    for (let x = 60; x < width; x += r.between(110, 210)) {
      const h = r.between(200, 330);
      g.fillRect(x, base - h, 5, h);
      g.fillCircle(x + 2.5, base - h, r.between(14, 24));
    }
    this.bake(g, 'layer-far', width, base + 10).setScrollFactor(0.4, 1).setDepth(DEPTH.far);
  }

  private buildMid() {
    const { width } = this.level.world;
    const g = this.scene.make.graphics({}, false);
    const r = this.rng;
    const bottom = this.minGround() + 60;
    for (let x = 30; x < width; x += r.between(90, 170)) {
      const gy = bottom;
      const h = r.between(180, 330);
      const lean = r.realInRange(-60, 60);
      const w = r.between(10, 18);
      const color = r.frac() > 0.5 ? COLORS.midPlant : COLORS.midPlantDark;
      g.fillStyle(color, 1);
      // A giant curved grass blade drawn as a tapered polygon.
      const pts: Phaser.Types.Math.Vector2Like[] = [];
      const steps = 14;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        pts.push({ x: x + lean * t * t - (w * (1 - t)) / 2, y: gy - h * t });
      }
      for (let i = steps; i >= 0; i--) {
        const t = i / steps;
        pts.push({ x: x + lean * t * t + (w * (1 - t)) / 2, y: gy - h * t });
      }
      g.fillPoints(pts, true);
      // Occasional clover leaf on a stem.
      if (r.frac() > 0.72) {
        const sx = x + r.between(30, 60);
        const sh = r.between(140, 220);
        g.fillStyle(COLORS.midPlantDark, 1);
        g.fillRect(sx - 2, gy - sh, 4, sh);
        g.fillStyle(COLORS.midPlant, 1);
        for (let k = 0; k < 3; k++) {
          const a = -Math.PI / 2 + (k - 1) * 1.15;
          g.fillCircle(sx + Math.cos(a) * 26, gy - sh + Math.sin(a) * 26, 26);
        }
      }
    }
    this.bake(g, 'layer-mid', width, bottom + 10).setScrollFactor(0.75, 1).setDepth(DEPTH.mid);
  }

  private buildTerrain() {
    const { width, height } = this.level.world;
    const rt = this.scene.add.renderTexture(0, 0, width, height).setOrigin(0).setDepth(DEPTH.terrain);
    const r = this.rng;

    // 1. Soil body with strata.
    const soil = this.scene.make.graphics({}, false);
    const groundPoly: Phaser.Types.Math.Vector2Like[] = [];
    for (let x = 0; x <= width; x += 16) groundPoly.push({ x, y: this.groundY(x) });
    groundPoly.push({ x: width, y: height }, { x: 0, y: height });
    soil.fillStyle(COLORS.soilTop, 1);
    soil.fillPoints(groundPoly, true);

    const strata: [number, number][] = [
      [540, COLORS.soil2],
      [780, COLORS.soil3],
      [1010, COLORS.soil4],
    ];
    strata.forEach(([base, color], i) => {
      const poly: Phaser.Types.Math.Vector2Like[] = [];
      for (let x = 0; x <= width; x += 24) poly.push({ x, y: base + Math.sin(x * 0.006 + i * 2) * 16 + Math.sin(x * 0.019 + i) * 6 });
      poly.push({ x: width, y: height }, { x: 0, y: height });
      soil.fillStyle(color, 1);
      soil.fillPoints(poly, true);
    });

    // Moist topsoil after rain: a cool darker band under the ground line.
    for (let k = 0; k < 6; k++) {
      soil.fillStyle(COLORS.tunnelMoist, 0.06);
      const band: Phaser.Types.Math.Vector2Like[] = [];
      for (let x = 0; x <= width; x += 16) band.push({ x, y: this.groundY(x) });
      for (let x = width; x >= 0; x -= 16) band.push({ x, y: this.groundY(x) + 14 + k * 12 });
      soil.fillPoints(band, true);
    }

    // Speckles and pebbles.
    for (let i = 0; i < 1800; i++) {
      const x = r.between(0, width);
      const y = r.between(Math.ceil(this.groundY(x)) + 6, height);
      const light = r.frac() > 0.5;
      soil.fillStyle(light ? 0xc9a274 : 0x1d120a, r.realInRange(0.12, 0.35));
      soil.fillCircle(x, y, r.realInRange(0.8, 2.6));
    }

    // Stones.
    for (const s of this.level.decor.stones) {
      soil.fillStyle(COLORS.stoneDark, 1);
      soil.fillEllipse(s.x, s.y + 2, s.rx * 2 + 4, s.ry * 2 + 4);
      soil.fillStyle(COLORS.stone, 1);
      soil.fillEllipse(s.x, s.y, s.rx * 2, s.ry * 2);
      soil.fillStyle(0xd8cfc0, 0.35);
      soil.fillEllipse(s.x - s.rx * 0.3, s.y - s.ry * 0.35, s.rx * 0.8, s.ry * 0.6);
    }

    // Roots (behind tunnels).
    for (const root of this.level.decor.roots) {
      this.drawTaper(soil, root.points, root.width, root.width * 0.25, COLORS.rootDark, 1.5);
      this.drawTaper(soil, root.points, root.width, root.width * 0.25, COLORS.root, 0);
      // Rootlets.
      const pts = root.points;
      for (let i = 1; i < pts.length; i++) {
        const [x, y] = pts[i];
        soil.lineStyle(1.2, COLORS.root, 0.7);
        soil.lineBetween(x, y, x + r.between(-22, 22), y + r.between(8, 24));
      }
    }
    rt.draw(soil);
    soil.destroy();

    // 2. Tunnels and chambers carved into the soil.
    const tun = this.scene.make.graphics({}, false);
    const R = TUNNEL_RADIUS;
    for (const path of this.tunnels.paths.values()) {
      if (path.kind !== 'tunnel') continue;
      this.sampleCircles(tun, path, R + 6, COLORS.tunnelRim, 1);
    }
    for (const c of this.level.chambers) {
      tun.fillStyle(COLORS.tunnelRim, 1);
      tun.fillEllipse(c.x, c.y, c.rx * 2 + 12, c.ry * 2 + 12);
    }
    for (const path of this.tunnels.paths.values()) {
      if (path.kind !== 'tunnel') continue;
      this.sampleCircles(tun, path, R, COLORS.tunnel, 1);
      this.sampleCircles(tun, path, R * 0.55, COLORS.tunnelMoist, 0.35, -R * 0.25);
    }
    for (const c of this.level.chambers) {
      tun.fillStyle(COLORS.tunnel, 1);
      tun.fillEllipse(c.x, c.y, c.rx * 2, c.ry * 2);
      // Burrow lining: soft leaf litter on the floor.
      tun.fillStyle(COLORS.leafDark, 0.8);
      tun.fillEllipse(c.x, c.y + c.ry * 0.6, c.rx * 1.6, c.ry * 0.55);
      tun.fillStyle(0xffe2a0, 0.06);
      tun.fillEllipse(c.x, c.y - 4, c.rx * 1.5, c.ry * 1.3);
    }
    rt.draw(tun);
    tun.destroy();

    // 3. Erase anything that bulged above the ground line (tunnel mouths become notches).
    const sky = this.scene.make.graphics({}, false);
    sky.fillStyle(0xffffff, 1);
    const above: Phaser.Types.Math.Vector2Like[] = [{ x: 0, y: 0 }];
    for (let x = 0; x <= width; x += 8) above.push({ x, y: this.groundY(x) });
    above.push({ x: width, y: 0 });
    sky.fillPoints(above, true);
    rt.erase(sky);
    sky.destroy();

    // 4. Grass, leaves and puddles on top.
    const top = this.scene.make.graphics({}, false);
    const mouths = this.mouthXs();
    const nearMouth = (x: number) => mouths.some((m) => Math.abs(m - x) < R + 6);
    for (let x = 0; x < width; x += 2) {
      if (nearMouth(x)) continue;
      top.fillStyle(COLORS.grassDark, 1);
      top.fillRect(x, this.groundY(x) - 2, 2, 5);
    }
    for (let x = 0; x < width; x += r.between(3, 7)) {
      if (nearMouth(x)) continue;
      const gy = this.groundY(x);
      const h = r.between(8, 30);
      const lean = r.realInRange(-6, 6);
      top.fillStyle(r.frac() > 0.4 ? COLORS.grass : COLORS.grassDark, 1);
      top.fillTriangle(x - 1.6, gy + 1, x + 1.6, gy + 1, x + lean, gy - h);
    }
    for (const p of this.level.decor.puddles) {
      top.fillStyle(COLORS.puddle, 0.75);
      top.fillEllipse(p.x, p.y + 4, p.width, 10);
      top.fillStyle(0xe8f4f0, 0.5);
      top.fillEllipse(p.x - p.width * 0.15, p.y + 2, p.width * 0.4, 3);
    }
    for (const l of this.level.decor.leaves) this.drawLeaf(top, l.x, l.y, l.angle, l.length);
    rt.draw(top);
    top.destroy();
  }

  private buildForeground() {
    const g = this.scene.add.graphics().setDepth(DEPTH.foreground);
    const r = this.rng;
    const { width } = this.level.world;
    const mouths = this.mouthXs();
    for (let x = 80; x < width; x += r.between(160, 320)) {
      if (mouths.some((m) => Math.abs(m - x) < 60)) continue;
      const gy = this.groundY(x) + 2;
      for (let k = 0; k < 5; k++) {
        const bx = x + k * 3 - 6;
        g.fillStyle(k % 2 ? COLORS.grass : COLORS.grassDark, 0.92);
        g.fillTriangle(bx - 2, gy, bx + 2, gy, bx + r.realInRange(-10, 10), gy - r.between(22, 40));
      }
    }
  }

  // ---------------------------------------------------------------- helpers

  private minGround(): number {
    return Math.min(...this.surfacePts.map((p) => p.y)) + SURFACE_GROUND_OFFSET;
  }

  private mouthXs(): number[] {
    const surfaceIds = new Set(this.level.paths.filter((p) => p.kind === 'surface').map((p) => p.id));
    return this.level.transitions.filter((t) => t.paths.some((id) => surfaceIds.has(id))).map((t) => t.x);
  }

  private bake(g: Phaser.GameObjects.Graphics, key: string, w: number, h: number): Phaser.GameObjects.Image {
    if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
    g.generateTexture(key, w, h);
    g.destroy();
    return this.scene.add.image(0, 0, key).setOrigin(0);
  }

  private sampleCircles(
    g: Phaser.GameObjects.Graphics,
    path: { length: number; pointAt(s: number): Point },
    radius: number,
    color: number,
    alpha: number,
    yOffset = 0,
  ) {
    g.fillStyle(color, alpha);
    for (let s = 0; s <= path.length; s += 3) {
      const p = path.pointAt(s);
      g.fillCircle(p.x, p.y + yOffset, radius);
    }
  }

  private drawTaper(g: Phaser.GameObjects.Graphics, pts: Vec2[], w0: number, w1: number, color: number, extra: number) {
    let total = 0;
    const lens = [0];
    for (let i = 1; i < pts.length; i++) {
      total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      lens.push(total);
    }
    g.fillStyle(color, 1);
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1];
      const [bx, by] = pts[i];
      const seg = lens[i] - lens[i - 1];
      for (let d = 0; d <= seg; d += 2) {
        const t = d / (seg || 1);
        const u = (lens[i - 1] + d) / (total || 1);
        g.fillCircle(ax + (bx - ax) * t, ay + (by - ay) * t, (w0 + (w1 - w0) * u) / 2 + extra);
      }
    }
  }

  private drawLeaf(g: Phaser.GameObjects.Graphics, x: number, y: number, angle: number, len: number) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const pts: Phaser.Types.Math.Vector2Like[] = [];
    const steps = 16;
    const half = len / 2;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const lx = -half + len * t;
      const ly = -Math.sin(Math.PI * t) * len * 0.2;
      pts.push({ x: x + lx * cos - ly * sin, y: y + lx * sin + ly * cos });
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const lx = -half + len * t;
      const ly = Math.sin(Math.PI * t) * len * 0.12;
      pts.push({ x: x + lx * cos - ly * sin, y: y + lx * sin + ly * cos });
    }
    g.fillStyle(COLORS.leaf, 1);
    g.fillPoints(pts, true);
    g.lineStyle(1.4, COLORS.leafDark, 1);
    g.lineBetween(x - half * cos, y - half * sin, x + half * cos, y + half * sin);
  }
}
