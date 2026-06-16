'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { UNIT1_GAMES } from './gameData';
import { getAllExercises, computeUnit1ExerciseCompletion } from './exerciseData';
import type { ExerciseSessionEntry } from './exerciseData';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SighaProgressEntry {
  seen: number;
  correctStreak: number;
  mastered: boolean;
  lastSeen: number;
}

export interface ActivityEntry {
  form: string;
  babId: string;
  sighaId: string;
  paradigm: string;
  correct: boolean;
  timestamp: number;
}

export interface GameSessionEntry {
  score: number;
  completed: boolean;
  attempts: number;
}

interface StoredState {
  sighaProgress: Record<string, SighaProgressEntry>;
  gameSessions: Record<string, GameSessionEntry>;
  exerciseSessions: Record<string, ExerciseSessionEntry>;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string;
  lastPlayedGameId: string | null;
  recentActivity: ActivityEntry[];
  totalAnswered: number;
  totalCorrect: number;
}

export type { ExerciseSessionEntry };

export interface ProgressContextValue extends StoredState {
  hydrated: boolean;
  unit1Completion: number;
  unit1ExerciseCompletion: number;
  unit1CombinedCompletion: number;
  totalMastered: number;
  accuracy: number;
  recordAnswer: (babId: string, sighaId: string, paradigm: string, form: string, correct: boolean) => void;
  recordGameSession: (gameId: string, score: number) => void;
  recordExerciseSession: (exerciseId: string, score: number, total: number) => void;
  resetAll: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'sarf-progress-v1';

const INITIAL: StoredState = {
  sighaProgress: {},
  gameSessions: {},
  exerciseSessions: {},
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: '',
  lastPlayedGameId: null,
  recentActivity: [],
  totalAnswered: 0,
  totalCorrect: 0,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function load(): StoredState {
  if (typeof window === 'undefined') return INITIAL;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...INITIAL, ...JSON.parse(raw) } : INITIAL;
  } catch {
    return INITIAL;
  }
}

function persist(s: StoredState) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function computeStreak(streak: number, longest: number, lastDate: string): { streak: number; longest: number } {
  const today = getToday();
  if (lastDate === today) return { streak, longest };
  if (!lastDate) return { streak: 1, longest: Math.max(1, longest) };
  const diff = Math.round((new Date(today).getTime() - new Date(lastDate).getTime()) / 86400000);
  if (diff === 1) { const ns = streak + 1; return { streak: ns, longest: Math.max(ns, longest) }; }
  return { streak: 1, longest };
}

// ── Context ───────────────────────────────────────────────────────────────────

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StoredState>(INITIAL);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(load());
    setHydrated(true);
  }, []);

  const recordAnswer = useCallback((babId: string, sighaId: string, paradigm: string, form: string, correct: boolean) => {
    setState((prev) => {
      const key = `${babId}|${sighaId}|${paradigm}`;
      const entry = prev.sighaProgress[key] ?? { seen: 0, correctStreak: 0, mastered: false, lastSeen: 0 };
      const newStreak = correct ? entry.correctStreak + 1 : 0;
      const newEntry: SighaProgressEntry = {
        seen: entry.seen + 1,
        correctStreak: newStreak,
        mastered: entry.mastered || newStreak >= 3,
        lastSeen: Date.now(),
      };
      const activity: ActivityEntry = { form, babId, sighaId, paradigm, correct, timestamp: Date.now() };
      const next: StoredState = {
        ...prev,
        sighaProgress: { ...prev.sighaProgress, [key]: newEntry },
        recentActivity: [activity, ...prev.recentActivity].slice(0, 20),
        totalAnswered: prev.totalAnswered + 1,
        totalCorrect: prev.totalCorrect + (correct ? 1 : 0),
      };
      persist(next);
      return next;
    });
  }, []);

  const recordGameSession = useCallback((gameId: string, score: number) => {
    setState((prev) => {
      const existing = prev.gameSessions[gameId];
      const { streak, longest } = computeStreak(prev.currentStreak, prev.longestStreak, prev.lastActivityDate);
      const next: StoredState = {
        ...prev,
        gameSessions: {
          ...prev.gameSessions,
          [gameId]: { score, completed: score >= 80, attempts: (existing?.attempts ?? 0) + 1 },
        },
        currentStreak: streak,
        longestStreak: longest,
        lastActivityDate: getToday(),
        lastPlayedGameId: gameId,
      };
      persist(next);
      return next;
    });
  }, []);

  const recordExerciseSession = useCallback((exerciseId: string, score: number, total: number) => {
    setState((prev) => {
      const existing = prev.exerciseSessions[exerciseId];
      const pct = total > 0 ? Math.round((score / total) * 100) : 0;
      const prevBest = existing?.bestPct ?? 0;
      const { streak, longest } = computeStreak(prev.currentStreak, prev.longestStreak, prev.lastActivityDate);
      const next: StoredState = {
        ...prev,
        exerciseSessions: {
          ...prev.exerciseSessions,
          [exerciseId]: {
            score,
            total,
            completed: pct >= 70,
            attempts: (existing?.attempts ?? 0) + 1,
            bestPct: Math.max(pct, prevBest),
          },
        },
        currentStreak: streak,
        longestStreak: longest,
        lastActivityDate: getToday(),
        totalAnswered: prev.totalAnswered + total,
        totalCorrect: prev.totalCorrect + score,
      };
      persist(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    persist(INITIAL);
    setState(INITIAL);
  }, []);

  const unit1Completion = useMemo(() => {
    const total = UNIT1_GAMES.length;
    const done = UNIT1_GAMES.filter((g) => state.gameSessions[g.id]?.completed).length;
    return total === 0 ? 0 : Math.round((done / total) * 100);
  }, [state.gameSessions]);

  const unit1ExerciseCompletion = useMemo(
    () => computeUnit1ExerciseCompletion(state.exerciseSessions),
    [state.exerciseSessions],
  );

  const unit1CombinedCompletion = useMemo(() => {
    const gameTotal = UNIT1_GAMES.length;
    const exTotal = getAllExercises().filter((e) => e.exerciseType !== 'verbal-practice').length;
    const gameDone = UNIT1_GAMES.filter((g) => state.gameSessions[g.id]?.completed).length;
    const exDone = getAllExercises().filter(
      (e) => e.exerciseType !== 'verbal-practice' && state.exerciseSessions[e.id]?.completed,
    ).length;
    const total = gameTotal + exTotal;
    return total === 0 ? 0 : Math.round(((gameDone + exDone) / total) * 100);
  }, [state.gameSessions, state.exerciseSessions]);

  const totalMastered = useMemo(
    () => Object.values(state.sighaProgress).filter((e) => e.mastered).length,
    [state.sighaProgress]
  );

  const accuracy = state.totalAnswered > 0
    ? Math.round((state.totalCorrect / state.totalAnswered) * 100)
    : 0;

  return (
    <ProgressContext.Provider value={{
      ...state, hydrated, unit1Completion, unit1ExerciseCompletion, unit1CombinedCompletion,
      totalMastered, accuracy,
      recordAnswer, recordGameSession, recordExerciseSession, resetAll,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be inside ProgressProvider');
  return ctx;
}
