/** Global tuning values. Gameplay code reads from here, never hard-codes them. */

export const GAME_TITLE = 'WORM LIFE';
export const STUDIO = 'Vinh Làm Game';
export const TAGLINE = 'A Tiny Life Beneath a Giant World';

/**
 * Target visible world area. zoom = min(viewportH / VIEW_HEIGHT, viewportW / VIEW_WIDTH), clamped,
 * so the worm stays readable on landscape phones and portrait screens still see enough garden.
 */
export const VIEW_HEIGHT = 560;
export const VIEW_WIDTH = 700;
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 1.6;

/** Radius of carved tunnels (world px). Must stay larger than the biggest worm radius. */
export const TUNNEL_RADIUS = 20;
/** How far below a surface path point the ground line is drawn. */
export const SURFACE_GROUND_OFFSET = 9;

/** Distance (along a path) inside which a junction is considered "near". */
export const JUNCTION_RADIUS = 34;

export const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export const COLORS = {
  bg: 0x1b130d,
  skyTop: 0xc9ddd3,
  skyBottom: 0xf2e2b6,
  farPlant: 0x9fb59a,
  midPlant: 0x5d7a48,
  midPlantDark: 0x46613a,
  grass: 0x6f8f3e,
  grassDark: 0x4f6d2c,
  soilTop: 0x6b4529,
  soil2: 0x58381f,
  soil3: 0x472d19,
  soil4: 0x372213,
  tunnelRim: 0x2a1a0f,
  tunnel: 0x3b2717,
  tunnelMoist: 0x3f3a30,
  root: 0xa27b52,
  rootDark: 0x6e4f31,
  stone: 0x8a7f72,
  stoneDark: 0x5d554c,
  puddle: 0x7fa3a3,
  leaf: 0xa8813d,
  leafDark: 0x7a5a28,
  wormBody: 0xc98272,
  wormDark: 0x8e4f45,
  wormLight: 0xe7b3a4,
  wormBand: 0xd8907c,
  text: 0xf3e6c8,
  textDim: 0xb8a68a,
  panel: 0x22170f,
  accent: 0xe0b45a,
  danger: 0xd9583b,
} as const;

export const CSS = {
  text: '#f3e6c8',
  textDim: '#b8a68a',
  accent: '#e0b45a',
  dark: '#1b130d',
} as const;

export type GrowthStage = 'hatchling' | 'young' | 'growing' | 'explorer' | 'resilient' | 'mature';

export const GROWTH_ORDER: GrowthStage[] = ['hatchling', 'young', 'growing', 'explorer', 'resilient', 'mature'];

export interface GrowthConfig {
  label: string;
  segments: number;
  /** Max body radius (world px). */
  radius: number;
  /** Distance between segment centres (world px). */
  spacing: number;
  /** Crawl speed (world px / s). */
  speed: number;
}

/** Body shape per life stage. Labels are game progression names, not biology. */
export const GROWTH: Record<GrowthStage, GrowthConfig> = {
  hatchling: { label: 'Hatchling', segments: 14, radius: 6.5, spacing: 5.2, speed: 150 },
  young: { label: 'Young', segments: 18, radius: 7.8, spacing: 5.8, speed: 160 },
  growing: { label: 'Growing', segments: 22, radius: 9, spacing: 6.3, speed: 168 },
  explorer: { label: 'Explorer', segments: 25, radius: 10.2, spacing: 6.8, speed: 176 },
  resilient: { label: 'Resilient', segments: 28, radius: 11.2, spacing: 7.2, speed: 182 },
  mature: { label: 'Mature', segments: 32, radius: 12.5, spacing: 7.6, speed: 190 },
};

export const SAVE_KEY = 'worm-life.save';
export const SAVE_VERSION = 1;
