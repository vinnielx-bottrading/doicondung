/**
 * Level data schema. Coordinate convention: world pixels, origin top-left, +y down.
 * Paths are the routes the worm can crawl along; the worm's body centre sits on them.
 * A transition is a point shared by two or more paths (a fork, tunnel mouth or link).
 */

export type Vec2 = [number, number];

export type PathKind = 'surface' | 'tunnel';

export interface PathData {
  id: string;
  kind: PathKind;
  points: Vec2[];
}

export interface TransitionData {
  id: string;
  x: number;
  y: number;
  paths: string[];
  /** Optional prompt override, e.g. "Enter the safe tunnel". */
  label?: string;
}

export interface RootData {
  points: Vec2[];
  width: number;
}

export interface StoneData {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

export interface LeafData {
  x: number;
  y: number;
  angle: number;
  length: number;
}

export interface PuddleData {
  x: number;
  y: number;
  width: number;
}

export interface ChamberData {
  id: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
}

export interface PlayerStartData {
  pathId: string;
  /** Distance along the path. */
  s: number;
  dir: 1 | -1;
}

export interface LevelData {
  id: string;
  name: string;
  areaId: string;
  world: { width: number; height: number };
  objective: { id: string; text: string; targetCount: number };
  completionReward: { growthStage: string; unlockStageId: string; discoveryId: string };
  playerStart: PlayerStartData;
  paths: PathData[];
  transitions: TransitionData[];
  chambers: ChamberData[];
  decor: {
    roots: RootData[];
    stones: StoneData[];
    leaves: LeafData[];
    puddles: PuddleData[];
  };
  /** Filled in Milestone 2/3. */
  food: unknown[];
  creatures: unknown[];
  discoveries: unknown[];
  hazards: unknown[];
}
