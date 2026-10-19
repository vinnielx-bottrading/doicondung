import { GROWTH_ORDER, SAVE_KEY, SAVE_VERSION, type GrowthStage } from '../config/game-config';

export interface SaveData {
  version: number;
  levelId: string;
  currentStageId: string;
  completedStageIds: string[];
  growthStage: GrowthStage;
  /** Worm head position on the path network. */
  playerPosition: { pathId: string; s: number; dir: 1 | -1 } | null;
  discoveredIds: string[];
  collectedFoodIds: string[];
  unlockedRoutes: string[];
  settings: { muted: boolean };
  updatedAt: number;
}

export function newSave(): SaveData {
  return {
    version: SAVE_VERSION,
    levelId: 'stage-01',
    currentStageId: 'stage-01',
    completedStageIds: [],
    growthStage: 'hatchling',
    playerPosition: null,
    discoveredIds: [],
    collectedFoodIds: [],
    unlockedRoutes: [],
    settings: { muted: false },
    updatedAt: Date.now(),
  };
}

const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** Validate untrusted LocalStorage data; anything malformed falls back to defaults field by field. */
function sanitize(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.version !== 'number') return null;
  // Future migrations go here: if (r.version === 1) { ...upgrade to 2 }
  if (r.version > SAVE_VERSION) return null;

  const d = newSave();
  if (typeof r.levelId === 'string') d.levelId = r.levelId;
  if (typeof r.currentStageId === 'string') d.currentStageId = r.currentStageId;
  d.completedStageIds = strArr(r.completedStageIds);
  if (typeof r.growthStage === 'string' && (GROWTH_ORDER as string[]).includes(r.growthStage)) {
    d.growthStage = r.growthStage as GrowthStage;
  }
  const p = r.playerPosition as Record<string, unknown> | null | undefined;
  if (p && typeof p.pathId === 'string' && typeof p.s === 'number' && Number.isFinite(p.s)) {
    d.playerPosition = { pathId: p.pathId, s: p.s, dir: p.dir === -1 ? -1 : 1 };
  }
  d.discoveredIds = strArr(r.discoveredIds);
  d.collectedFoodIds = strArr(r.collectedFoodIds);
  d.unlockedRoutes = strArr(r.unlockedRoutes);
  const st = r.settings as Record<string, unknown> | undefined;
  if (st && typeof st.muted === 'boolean') d.settings.muted = st.muted;
  if (typeof r.updatedAt === 'number') d.updatedAt = r.updatedAt;
  return d;
}

export const SaveSystem = {
  load(): SaveData | null {
    try {
      const txt = localStorage.getItem(SAVE_KEY);
      if (!txt) return null;
      return sanitize(JSON.parse(txt));
    } catch {
      return null;
    }
  },

  save(data: SaveData): boolean {
    try {
      data.updatedAt = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  },

  clear() {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* storage unavailable */
    }
  },

  hasSave(): boolean {
    return this.load() !== null;
  },
};
