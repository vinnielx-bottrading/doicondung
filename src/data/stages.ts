import type { GrowthStage } from '../config/game-config';

export interface StageInfo {
  id: string;
  number: number;
  name: string;
  area: string;
  objective: string;
  reward: string;
  growthTo: GrowthStage;
  /** Only stages with a level file are playable. */
  playable: boolean;
}

/** Journey from README §5. Stage 1 is the only playable stage in v0.1. */
export const STAGES: StageInfo[] = [
  { id: 'stage-01', number: 1, name: 'The First Leaf', area: 'Garden after rain', objective: 'Find 3 pieces of organic matter and reach a safe burrow', reward: 'First discovery entry & a safe resting place', growthTo: 'young', playable: true },
  { id: 'stage-02', number: 2, name: 'The Root Maze', area: 'Root zone', objective: 'Explore the root network and find a second way through', reward: 'Root-network map entry & a shortcut', growthTo: 'growing', playable: false },
  { id: 'stage-03', number: 3, name: 'The Ant Border', area: 'Insect territory', objective: 'Observe the ant patrol, avoid it and reach a protected chamber', reward: 'Insect journal entry & a new route', growthTo: 'explorer', playable: false },
  { id: 'stage-04', number: 4, name: 'The Search for Moisture', area: 'Dry soil', objective: 'Follow clues to a moist refuge', reward: 'Moisture refuge & a safe checkpoint', growthTo: 'resilient', playable: false },
  { id: 'stage-05', number: 5, name: 'The Underground Flood', area: 'Changing garden', objective: 'Escape the rising water and reach higher soil', reward: 'Flood route & a permanent passage', growthTo: 'mature', playable: false },
  { id: 'stage-06', number: 6, name: 'The Living Garden', area: 'Compost-rich garden', objective: 'Connect the burrow network', reward: 'Final journal entry & ending scene', growthTo: 'mature', playable: false },
];

export function getStage(id: string): StageInfo | undefined {
  return STAGES.find((s) => s.id === id);
}
