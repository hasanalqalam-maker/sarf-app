import { UNIT1_GAMES } from './gameData';
import { getAllExercises, computeUnit1ExerciseCompletion } from './exerciseData';
import { computeUnit1Completion } from './gameState';
import type { StoredState } from './progressContext';

export interface ProgressSummary {
  unit1Games: number;
  unit1Exercises: number;
  unit1Combined: number;
  totalMastered: number;
  accuracy: number;
  currentStreak: number;
  longestStreak: number;
  totalAnswered: number;
  recentActivity: StoredState['recentActivity'];
  lastActivityDate: string;
}

const EMPTY: Pick<
  StoredState,
  'sighaProgress' | 'gameSessions' | 'exerciseSessions' | 'recentActivity'
> = {
  sighaProgress: {},
  gameSessions: {},
  exerciseSessions: {},
  recentActivity: [],
};

/**
 * Derive the same headline numbers the Progress page shows, from a plain
 * progress state. Works on a partial state (e.g. one hydrated from Supabase
 * for another user), filling gaps with zeroes.
 */
export function summarizeProgress(state: Partial<StoredState>): ProgressSummary {
  const s = { ...EMPTY, ...state };

  const unit1Games = computeUnit1Completion(s.gameSessions);
  const unit1Exercises = computeUnit1ExerciseCompletion(s.exerciseSessions);

  const scoreableExercises = getAllExercises().filter(
    (e) => e.exerciseType !== 'verbal-practice',
  );
  const gamesDone = UNIT1_GAMES.filter((g) => s.gameSessions[g.id]?.completed).length;
  const exercisesDone = scoreableExercises.filter(
    (e) => s.exerciseSessions[e.id]?.completed,
  ).length;
  const combinedTotal = UNIT1_GAMES.length + scoreableExercises.length;
  const unit1Combined =
    combinedTotal === 0
      ? 0
      : Math.round(((gamesDone + exercisesDone) / combinedTotal) * 100);

  const totalMastered = Object.values(s.sighaProgress).filter((e) => e.mastered).length;
  const totalAnswered = state.totalAnswered ?? 0;
  const totalCorrect = state.totalCorrect ?? 0;
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  return {
    unit1Games,
    unit1Exercises,
    unit1Combined,
    totalMastered,
    accuracy,
    currentStreak: state.currentStreak ?? 0,
    longestStreak: state.longestStreak ?? 0,
    totalAnswered,
    recentActivity: s.recentActivity,
    lastActivityDate: state.lastActivityDate ?? '',
  };
}
