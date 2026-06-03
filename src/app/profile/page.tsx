'use client';

import { useState } from 'react';
import { useProgress } from '@/lib/progressContext';
import { UNIT1_GAMES } from '@/lib/gameData';

export default function ProfilePage() {
  const {
    hydrated,
    gameSessions,
    totalMastered,
    longestStreak,
    currentStreak,
    accuracy,
    totalAnswered,
    totalCorrect,
    resetAll,
  } = useProgress();

  const [confirmReset, setConfirmReset] = useState(false);

  const gamesCompleted = UNIT1_GAMES.filter((g) => gameSessions[g.id]?.completed).length;

  function handleReset() {
    resetAll();
    setConfirmReset(false);
  }

  return (
    <div className="px-4 py-8 max-w-xl">
      <h1 className="font-heading text-2xl text-ink mb-1">Profile</h1>
      <p className="text-ink-muted font-sans text-sm mb-8">Your progress and statistics.</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="card-parchment p-5 flex flex-col gap-1">
          <p className="font-heading text-3xl text-teal">{hydrated ? gamesCompleted : '—'}</p>
          <p className="text-xs font-sans text-ink-muted">Games completed</p>
          <p className="text-xs font-sans text-ink-muted/60">of {UNIT1_GAMES.length} in Unit 1</p>
        </div>
        <div className="card-parchment p-5 flex flex-col gap-1">
          <p className="font-heading text-3xl text-teal">{hydrated ? totalMastered : '—'}</p>
          <p className="text-xs font-sans text-ink-muted">Forms mastered</p>
          <p className="text-xs font-sans text-ink-muted/60">3 correct in a row</p>
        </div>
        <div className="card-parchment p-5 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-gold fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C9 7 6 9 6 13a6 6 0 0012 0c0-4-3-6-6-11zm0 15a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
            <p className="font-heading text-3xl text-gold">{hydrated ? longestStreak : '—'}</p>
          </div>
          <p className="text-xs font-sans text-ink-muted">Longest streak</p>
          <p className="text-xs font-sans text-ink-muted/60">Current: {hydrated ? currentStreak : '—'} days</p>
        </div>
        <div className="card-parchment p-5 flex flex-col gap-1">
          <p className="font-heading text-3xl text-teal">{hydrated ? `${accuracy}%` : '—'}</p>
          <p className="text-xs font-sans text-ink-muted">Accuracy</p>
          <p className="text-xs font-sans text-ink-muted/60">
            {hydrated ? `${totalCorrect} / ${totalAnswered} correct` : '—'}
          </p>
        </div>
      </div>

      {/* Reset section */}
      <div className="card-parchment p-5 border border-red-100">
        <p className="font-heading text-base text-ink mb-1">Reset progress</p>
        <p className="text-xs font-sans text-ink-muted mb-4">
          Clears all game scores, mastery data, streaks, and activity history. This cannot be undone.
        </p>

        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="px-4 py-2 rounded-xl border border-red-200 text-red-600 font-sans text-sm hover:bg-red-50 transition-colors"
          >
            Reset all progress
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-red-500 text-white font-sans text-sm hover:bg-red-600 transition-colors"
            >
              Yes, reset everything
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="px-4 py-2 rounded-xl border border-gold/30 text-ink font-sans text-sm hover:bg-parchment-dark transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
