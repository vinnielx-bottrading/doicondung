import Phaser from 'phaser';
import { COLORS, GROWTH, JUNCTION_RADIUS, type GrowthConfig, type GrowthStage } from '../config/game-config';
import type { PlayerStartData } from '../data/types';
import type { Junction, JunctionOption, Point, TunnelSystem } from '../systems/TunnelSystem';

/** Explicit states (README §7) so animation and input never conflict. */
export type WormState = 'idle' | 'moving' | 'squeezing' | 'interacting' | 'threatened' | 'recovering';

interface TrailPt {
  x: number;
  y: number;
  pathId: string;
  s: number;
  dir: 1 | -1;
}

export interface WormPrompt {
  label: string;
  key: string;
}

export interface WormIntent {
  /** -1..1 horizontal, -1..1 vertical (+y = down). */
  x: number;
  y: number;
  action: boolean;
}

const TURN_TIME = 0.18;

/**
 * The player. Movement is arcade-style along the authored path network: the head crawls along
 * a path, and the body is a chain of segments laid along the head's trail (README §7 "follow points").
 * No physics engine: the worm can never fall through the ground or get wedged in geometry.
 */
export class Worm {
  state: WormState = 'idle';
  pathId: string;
  s: number;
  dir: 1 | -1;
  growthStage: GrowthStage;
  cfg: GrowthConfig;
  /** Visual scale multiplier, animated during growth. */
  scale = 1;

  /** Segment centres, head first. Recomputed every update. */
  readonly body: Point[] = [];
  prompt: WormPrompt | null = null;

  private trail: TrailPt[] = [];
  private phase = 0;
  private turnT = 0;
  private blockedT = 0;
  private prevX = 0;
  private prevY = 0;
  private wasMoving = false;
  /** Perpendicular input with no junction nearby: hold still until input changes. */
  private stalled = false;
  /** Auto-crawl to a nearby junction, then take this option. */
  private pending: { junction: Junction; option: JunctionOption } | null = null;
  /** Junction just used, so it is not re-evaluated while still standing on it. */
  private lastJunction: Junction | null = null;
  /** Raw (unbiased) score of the last bestOption() winner. */
  private lastScore = 0;

  constructor(
    private readonly tunnels: TunnelSystem,
    start: PlayerStartData,
    growthStage: GrowthStage,
  ) {
    this.growthStage = growthStage;
    this.cfg = { ...GROWTH[growthStage] };
    this.pathId = start.pathId;
    this.s = start.s;
    this.dir = start.dir;
    this.layTrail();
    this.computeBody();
  }

  get head(): Point {
    return this.body[0];
  }

  /** Body midpoint — the camera follows this so turning around never jerks the view. */
  get center(): Point {
    return this.body[Math.floor(this.body.length / 2)];
  }

  get bodyLength(): number {
    return this.cfg.segments * this.cfg.spacing * this.scale;
  }

  get radius(): number {
    return this.cfg.radius * this.scale;
  }

  setGrowth(stage: GrowthStage) {
    this.growthStage = stage;
    this.cfg = { ...GROWTH[stage] };
  }

  /** Place the worm somewhere new (restart/continue). */
  teleport(pathId: string, s: number, dir: 1 | -1) {
    const path = this.tunnels.get(pathId);
    this.pathId = pathId;
    this.s = Phaser.Math.Clamp(s, 0, path.length);
    this.dir = dir;
    this.pending = null;
    this.lastJunction = null;
    this.turnT = 0;
    this.layTrail();
    this.computeBody();
  }

  update(deltaMs: number, intent: WormIntent) {
    const dt = Math.min(deltaMs, 50) / 1000;
    const ix = Math.sign(intent.x);
    const iy = Math.sign(intent.y);
    const changed = ix !== this.prevX || iy !== this.prevY;
    this.prevX = ix;
    this.prevY = iy;
    const hasInput = ix !== 0 || iy !== 0;
    const inLen = Math.hypot(ix, iy) || 1;
    const inVec = { x: ix / inLen, y: iy / inLen };

    if (this.blockedT > 0) this.blockedT -= dt;

    if (this.turnT > 0) {
      this.turnT -= dt;
      this.state = 'squeezing';
      this.phase += dt * 6;
      this.computeBody();
      this.updatePrompt();
      return;
    }

    if (intent.action) this.handleAction();

    if (changed) {
      this.stalled = false;
      // A new direction cancels an auto-approach only if it points away from the chosen route.
      if (this.pending && hasInput) {
        const h = this.pending.option.heading;
        if (inVec.x * h.x + inVec.y * h.y <= 0) this.pending = null;
      }
    }

    let moving = false;

    if (this.pending) {
      moving = this.stepToPending(dt);
    } else if (hasInput) {
      if (changed || !this.wasMoving) this.decide(inVec);
      if (this.turnT <= 0 && !this.stalled && !this.pending) {
        moving = this.advance(this.cfg.speed * dt, inVec);
      } else if (this.pending) {
        moving = this.stepToPending(dt);
      }
    }

    // Leaving the junction area allows it to be evaluated again.
    if (this.lastJunction) {
      const js = this.lastJunction.at.get(this.pathId);
      if (js === undefined || Math.abs(js - this.s) > 4) this.lastJunction = null;
    }

    this.wasMoving = moving;
    if (this.turnT > 0) this.state = 'squeezing';
    else if (this.blockedT > 0) this.state = 'recovering';
    else this.state = moving ? 'moving' : 'idle';

    this.phase += dt * (moving ? 10 : 2.2);
    this.computeBody();
    this.updatePrompt();
  }

  // ---------------------------------------------------------------- movement

  private tangent(): Point {
    const t = this.tunnels.get(this.pathId).tangentAt(this.s);
    return { x: t.x * this.dir, y: t.y * this.dir };
  }

  /** Decide direction when input starts or changes. */
  private decide(inVec: Point) {
    const near = this.tunnels.junctionsNear(this.pathId, this.s, JUNCTION_RADIUS)[0];
    // Just came through this junction: keep going unless the player clearly pushes back.
    const t0 = this.tangent();
    if (near && near.junction === this.lastJunction && inVec.x * t0.x + inVec.y * t0.y > -0.3) return;
    if (near) {
      const best = this.bestOption(near.junction, inVec, false);
      if (best) {
        if (best.path.id === this.pathId && best.dir === this.dir) return;
        if (best.path.id === this.pathId) {
          this.startTurn();
          return;
        }
        if (this.lastScore < 0.3 && inVec.x === 0) {
          this.stalled = true; // e.g. pressing ↓ where no route goes down
          return;
        }
        this.pending = { junction: near.junction, option: best };
        return;
      }
    }
    const t = this.tangent();
    const d = inVec.x * t.x + inVec.y * t.y;
    if (d < -0.3) this.startTurn();
    else if (d < 0.3 && inVec.x === 0) this.stalled = true;
  }

  /** Score every exit of a junction against a desired heading. */
  private bestOption(j: Junction, want: Point, excludeCurrentPath: boolean): JunctionOption | null {
    let best: JunctionOption | null = null;
    let bestScore = -Infinity;
    this.lastScore = -Infinity;
    for (const o of this.tunnels.options(j)) {
      if (excludeCurrentPath && o.path.id === this.pathId) continue;
      let score = want.x * o.heading.x + want.y * o.heading.y;
      if (o.path.id === this.pathId && o.dir === this.dir) score += 0.25; // continuity bias
      if (score > bestScore) {
        bestScore = score;
        best = o;
        this.lastScore = want.x * o.heading.x + want.y * o.heading.y;
      }
    }
    return best;
  }

  /** Space / action button: take the other route at the nearest junction. */
  private handleAction() {
    const near = this.tunnels.junctionsNear(this.pathId, this.s, JUNCTION_RADIUS)[0];
    if (!near) return;
    const best = this.bestOption(near.junction, this.tangent(), true);
    if (best) this.pending = { junction: near.junction, option: best };
  }

  private stepToPending(dt: number): boolean {
    const p = this.pending!;
    const js = p.junction.at.get(this.pathId);
    if (js === undefined) {
      this.pending = null; // body turned onto another path; let the player re-decide
      return false;
    }
    if (p.option.path.id === this.pathId) {
      this.pending = null;
      if (p.option.dir !== this.dir) this.startTurn();
      return false;
    }
    const diff = js - this.s;
    const step = this.cfg.speed * dt;
    if (Math.abs(diff) <= step) {
      this.s = js;
      this.recordTrail();
      this.switchTo(p.option, p.junction);
      this.pending = null;
      return true;
    }
    const want: 1 | -1 = diff > 0 ? 1 : -1;
    if (want !== this.dir) {
      // Junction is behind us: turn around first, keep the pending move.
      this.startTurn();
      return false;
    }
    this.s += want * step;
    this.recordTrail();
    return true;
  }

  private switchTo(o: JunctionOption, j: Junction) {
    this.pathId = o.path.id;
    this.s = o.s;
    this.dir = o.dir;
    this.lastJunction = j;
  }

  /** Move `dist` along the network, resolving junctions and path ends on the way. */
  private advance(dist: number, inVec: Point): boolean {
    let remaining = dist;
    let moved = false;
    let guard = 0;
    while (remaining > 0.0001 && guard++ < 6) {
      const path = this.tunnels.get(this.pathId);
      const s0 = this.s;
      let s1 = s0 + this.dir * remaining;
      const end = this.dir > 0 ? path.length : 0;
      const pastEnd = this.dir > 0 ? s1 >= path.length : s1 <= 0;
      if (pastEnd) s1 = end;

      // Junctions crossed in this step (excluding the one we are leaving).
      let switched = false;
      for (const c of this.tunnels.junctionsCrossed(this.pathId, s0, s1)) {
        if (c.junction === this.lastJunction) continue;
        const atEnd = Math.abs(c.s - end) < 0.5;
        const want = inVec.x || inVec.y ? inVec : this.tangent();
        const best = this.bestOption(c.junction, want, atEnd);
        if (best && !(best.path.id === this.pathId && best.dir === this.dir)) {
          if (best.path.id === this.pathId) continue; // never auto-reverse mid-crawl
          remaining -= Math.abs(c.s - s0);
          this.s = c.s;
          this.recordTrail();
          this.switchTo(best, c.junction);
          switched = true;
          moved = true;
          break;
        }
      }
      if (switched) continue;

      remaining -= Math.abs(s1 - s0);
      if (Math.abs(s1 - s0) > 0.0001) moved = true;
      this.s = s1;
      this.recordTrail();
      if (pastEnd) {
        // Dead end with no linked route: stop and show the bump.
        if (remaining > 0.0001) this.blockedT = 0.25;
        break;
      }
    }
    return moved;
  }

  private startTurn() {
    this.trimTrail(this.bodyLength);
    this.trail.reverse();
    for (const p of this.trail) p.dir = (p.dir * -1) as 1 | -1;
    const h = this.trail[this.trail.length - 1];
    this.pathId = h.pathId;
    this.s = h.s;
    this.dir = h.dir;
    this.turnT = TURN_TIME;
    this.lastJunction = null;
  }

  // ---------------------------------------------------------------- body

  private layTrail() {
    const path = this.tunnels.get(this.pathId);
    this.trail = [];
    const len = this.bodyLength + 24;
    for (let d = len; d >= 0; d -= 2) {
      const s = Phaser.Math.Clamp(this.s - this.dir * d, 0, path.length);
      const p = path.pointAt(s);
      this.trail.push({ x: p.x, y: p.y, pathId: this.pathId, s, dir: this.dir });
    }
  }

  private recordTrail() {
    const p = this.tunnels.get(this.pathId).pointAt(this.s);
    const last = this.trail[this.trail.length - 1];
    if (last && Math.hypot(p.x - last.x, p.y - last.y) < 1.5) {
      last.x = p.x;
      last.y = p.y;
      last.pathId = this.pathId;
      last.s = this.s;
      last.dir = this.dir;
      return;
    }
    this.trail.push({ x: p.x, y: p.y, pathId: this.pathId, s: this.s, dir: this.dir });
    this.trimTrail(this.bodyLength * 1.4 + 40);
  }

  /** Keep only the newest `maxLen` world px of trail. */
  private trimTrail(maxLen: number) {
    let acc = 0;
    for (let i = this.trail.length - 1; i > 0; i--) {
      const a = this.trail[i];
      const b = this.trail[i - 1];
      acc += Math.hypot(a.x - b.x, a.y - b.y);
      if (acc >= maxLen) {
        if (i - 1 > 0) this.trail.splice(0, i - 1);
        return;
      }
    }
  }

  private computeBody() {
    const n = this.cfg.segments;
    const head = this.tunnels.get(this.pathId).pointAt(this.s);
    const moving = this.state === 'moving';
    const squeeze = this.turnT > 0 ? 0.72 + 0.28 * (1 - this.turnT / TURN_TIME) : 1;
    const bump = this.blockedT > 0 ? 0.85 : 1;
    const amp = moving ? 0.17 : 0.05;

    this.body.length = 0;
    this.body.push({ x: head.x, y: head.y });

    let ti = this.trail.length - 1;
    let ax = head.x;
    let ay = head.y;
    for (let i = 1; i < n; i++) {
      // Peristalsis: segment spacing ripples from head to tail.
      let need = this.cfg.spacing * this.scale * squeeze * bump * (1 + amp * Math.sin(this.phase - i * 0.55));
      let px = ax;
      let py = ay;
      while (ti >= 0) {
        const t = this.trail[ti];
        const d = Math.hypot(t.x - px, t.y - py);
        if (d >= need) {
          const k = need / d;
          px += (t.x - px) * k;
          py += (t.y - py) * k;
          need = 0;
          break;
        }
        need -= d;
        px = t.x;
        py = t.y;
        ti--;
      }
      ax = px;
      ay = py;
      this.body.push({ x: px, y: py });
    }
  }

  private updatePrompt() {
    this.prompt = null;
    const near = this.tunnels.junctionsNear(this.pathId, this.s, JUNCTION_RADIUS)[0];
    if (!near) return;
    const best = this.bestOption(near.junction, this.tangent(), true);
    if (!best) return;
    const label = best.path.kind === 'surface' ? 'Climb to the surface' : (near.junction.label ?? 'Take this route');
    const key = best.heading.y > 0.45 ? '↓' : best.heading.y < -0.45 ? '↑' : best.heading.x > 0 ? '→' : '←';
    this.prompt = { label, key };
  }

  // ---------------------------------------------------------------- drawing

  draw(g: Phaser.GameObjects.Graphics) {
    g.clear();
    const pts = this.body;
    const n = pts.length;
    if (n < 2) return;
    const R = this.radius;
    const radii = pts.map((_, i) => R * taper(i / (n - 1)));
    const bandA = Math.floor(n * 0.22);
    const bandB = Math.ceil(n * 0.34);

    // Silhouette outline.
    g.fillStyle(COLORS.wormDark, 1);
    for (let i = n - 1; i >= 0; i--) g.fillCircle(pts[i].x, pts[i].y, radii[i] + 1.6);
    // Body fill, tail to head.
    for (let i = n - 1; i >= 0; i--) {
      g.fillStyle(i >= bandA && i <= bandB ? COLORS.wormBand : COLORS.wormBody, 1);
      g.fillCircle(pts[i].x, pts[i].y, radii[i]);
    }
    // Moist highlight along the back and segment rings.
    for (let i = 0; i < n; i++) {
      const nx = this.normal(i);
      const r = radii[i];
      g.fillStyle(COLORS.wormLight, 0.42);
      g.fillCircle(pts[i].x + nx.x * r * 0.38, pts[i].y + nx.y * r * 0.38, r * 0.42);
      if (i > 0 && i < n - 1) {
        g.lineStyle(1, COLORS.wormDark, 0.32);
        g.lineBetween(pts[i].x + nx.x * r * 0.85, pts[i].y + nx.y * r * 0.85, pts[i].x - nx.x * r * 0.85, pts[i].y - nx.y * r * 0.85);
      }
    }
    // Head tip (prostomium).
    const h = pts[0];
    const dx = h.x - pts[1].x;
    const dy = h.y - pts[1].y;
    const dl = Math.hypot(dx, dy) || 1;
    g.fillStyle(COLORS.wormDark, 0.55);
    g.fillCircle(h.x + (dx / dl) * radii[0] * 0.55, h.y + (dy / dl) * radii[0] * 0.55, radii[0] * 0.45);
  }

  /** Unit normal pointing "up" (toward the worm's back) at segment i. */
  private normal(i: number): Point {
    const pts = this.body;
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = a.x - b.x;
    let ty = a.y - b.y;
    const l = Math.hypot(tx, ty) || 1;
    tx /= l;
    ty /= l;
    let nx = ty;
    let ny = -tx;
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
    return { x: nx, y: ny };
  }
}

/** Body profile from head (u=0) to tail (u=1). */
function taper(u: number): number {
  if (u < 0.2) return 0.8 + 0.2 * (u / 0.2);
  return 1 - 0.48 * Math.pow((u - 0.2) / 0.8, 1.3);
}
