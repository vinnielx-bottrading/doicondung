import type { LevelData, PathData, PathKind, TransitionData } from '../data/types';

export interface Point {
  x: number;
  y: number;
}

/** A polyline the worm can crawl along, parameterised by arc length `s`. */
export class TunnelPath {
  readonly id: string;
  readonly kind: PathKind;
  readonly pts: Point[];
  /** Cumulative length at each point. */
  readonly cum: number[];
  readonly length: number;

  constructor(data: PathData) {
    this.id = data.id;
    this.kind = data.kind;
    this.pts = data.points.map(([x, y]) => ({ x, y }));
    this.cum = [0];
    for (let i = 1; i < this.pts.length; i++) {
      const a = this.pts[i - 1];
      const b = this.pts[i];
      this.cum.push(this.cum[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
    }
    this.length = this.cum[this.cum.length - 1];
  }

  private segmentAt(s: number): number {
    const c = this.cum;
    if (s <= 0) return 0;
    if (s >= this.length) return c.length - 2;
    let lo = 0;
    let hi = c.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (c[mid] <= s) lo = mid;
      else hi = mid;
    }
    return lo;
  }

  pointAt(s: number, out: Point = { x: 0, y: 0 }): Point {
    const cs = Math.max(0, Math.min(this.length, s));
    const i = this.segmentAt(cs);
    const a = this.pts[i];
    const b = this.pts[i + 1];
    const segLen = this.cum[i + 1] - this.cum[i] || 1;
    const t = (cs - this.cum[i]) / segLen;
    out.x = a.x + (b.x - a.x) * t;
    out.y = a.y + (b.y - a.y) * t;
    return out;
  }

  /**
   * Unit tangent pointing toward increasing `s`. Smoothed by sampling a short window so
   * direction changes at polyline corners do not snap.
   */
  tangentAt(s: number, out: Point = { x: 0, y: 0 }): Point {
    const w = 10;
    const a = this.pointAt(Math.max(0, s - w));
    const b = this.pointAt(Math.min(this.length, s + w));
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    out.x = dx / len;
    out.y = dy / len;
    return out;
  }

  /** Closest arc-length position to a world point. */
  nearest(x: number, y: number): { s: number; dist: number } {
    let best = { s: 0, dist: Infinity };
    for (let i = 0; i < this.pts.length - 1; i++) {
      const a = this.pts[i];
      const b = this.pts[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len2 = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / len2));
      const px = a.x + dx * t;
      const py = a.y + dy * t;
      const d = Math.hypot(x - px, y - py);
      if (d < best.dist) best = { s: this.cum[i] + Math.sqrt(len2) * t, dist: d };
    }
    return best;
  }
}

/** One way to leave a junction: a path and a travel direction along it. */
export interface JunctionOption {
  path: TunnelPath;
  s: number;
  dir: 1 | -1;
  /** Unit vector of travel when leaving through this option. */
  heading: Point;
}

export interface Junction {
  id: string;
  x: number;
  y: number;
  label?: string;
  /** Position of the junction on each connected path. */
  at: Map<string, number>;
}

/** Path network for a level: the authored routes the worm can use (README §8 terrain strategy). */
export class TunnelSystem {
  readonly paths = new Map<string, TunnelPath>();
  readonly junctions: Junction[] = [];

  constructor(level: LevelData) {
    for (const p of level.paths) this.paths.set(p.id, new TunnelPath(p));
    for (const t of level.transitions) this.addJunction(t);
  }

  private addJunction(t: TransitionData) {
    const at = new Map<string, number>();
    for (const id of t.paths) {
      const path = this.paths.get(id);
      if (!path) {
        console.warn(`[TunnelSystem] transition ${t.id} references unknown path ${id}`);
        continue;
      }
      const n = path.nearest(t.x, t.y);
      if (n.dist > 4) console.warn(`[TunnelSystem] transition ${t.id} is ${n.dist.toFixed(1)}px off path ${id}`);
      at.set(id, n.s);
    }
    this.junctions.push({ id: t.id, x: t.x, y: t.y, label: t.label, at });
  }

  get(id: string): TunnelPath {
    const p = this.paths.get(id);
    if (!p) throw new Error(`Unknown path: ${id}`);
    return p;
  }

  /** Junctions on `pathId` whose position lies within `radius` of `s`. Closest first. */
  junctionsNear(pathId: string, s: number, radius: number): { junction: Junction; s: number; d: number }[] {
    const out: { junction: Junction; s: number; d: number }[] = [];
    for (const j of this.junctions) {
      const js = j.at.get(pathId);
      if (js === undefined) continue;
      const d = Math.abs(js - s);
      if (d <= radius) out.push({ junction: j, s: js, d });
    }
    return out.sort((a, b) => a.d - b.d);
  }

  /** Junctions on `pathId` whose position was crossed while moving from s0 to s1. */
  junctionsCrossed(pathId: string, s0: number, s1: number): { junction: Junction; s: number }[] {
    const lo = Math.min(s0, s1);
    const hi = Math.max(s0, s1);
    const out: { junction: Junction; s: number }[] = [];
    for (const j of this.junctions) {
      const js = j.at.get(pathId);
      if (js === undefined) continue;
      if (js > lo && js <= hi) out.push({ junction: j, s: js });
      else if (js === s0 && s0 === s1) out.push({ junction: j, s: js });
    }
    // Order by travel direction so the first one reached is handled first.
    out.sort((a, b) => (s1 >= s0 ? a.s - b.s : b.s - a.s));
    return out;
  }

  /** Every direction you could leave a junction in. */
  options(j: Junction): JunctionOption[] {
    const opts: JunctionOption[] = [];
    for (const [id, s] of j.at) {
      const path = this.get(id);
      const probe = 14;
      if (s < path.length - 0.5) {
        const t = path.tangentAt(Math.min(path.length, s + probe));
        opts.push({ path, s, dir: 1, heading: t });
      }
      if (s > 0.5) {
        const t = path.tangentAt(Math.max(0, s - probe));
        opts.push({ path, s, dir: -1, heading: { x: -t.x, y: -t.y } });
      }
    }
    return opts;
  }
}
