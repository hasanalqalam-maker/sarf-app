import { UNIT1_GAMES } from './gameData';
import type { GameConfig } from './gameData';

export function isGameUnlocked(config: GameConfig, progress: Record<string, { completed?: boolean }>): boolean {
  return config.unlockAfter.every((id) => progress[id]?.completed === true);
}

export function computeUnit1Completion(progress: Record<string, { completed?: boolean }>): number {
  const total = UNIT1_GAMES.length;
  const done = UNIT1_GAMES.filter((g) => progress[g.id]?.completed).length;
  return total === 0 ? 0 : Math.round((done / total) * 100);
}
