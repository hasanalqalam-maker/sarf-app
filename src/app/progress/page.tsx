'use client';

import SarfMapGrid from '@/components/SarfMapGrid';
import CircularProgress from '@/components/CircularProgress';
import { useProgress } from '@/lib/progressContext';

export default function ProgressPage() {
  const {
    totalMastered, accuracy, currentStreak,
    unit1Completion, unit1ExerciseCompletion, unit1CombinedCompletion,
    hydrated,
  } = useProgress();

  return (
    <div className="px-4 py-8 max-w-3xl">
      <h1 className="font-heading text-2xl text-ink mb-1">Progress</h1>
      <p className="text-ink-muted font-sans text-sm mb-6">
        Your mastery across all sīghas and bābs. Tap any cell to see details.
      </p>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card-parchment p-4 flex flex-col items-center gap-1">
          <CircularProgress pct={hydrated ? unit1CombinedCompletion : 0} size={72} />
          <p className="text-xs font-sans text-ink-muted text-center mt-1">Unit 1 overall</p>
        </div>
        <div className="card-parchment p-4 flex flex-col items-center justify-center gap-1">
          <p className="font-heading text-3xl text-teal">{hydrated ? totalMastered : '—'}</p>
          <p className="text-xs font-sans text-ink-muted text-center">Forms mastered</p>
        </div>
        <div className="card-parchment p-4 flex flex-col items-center justify-center gap-1">
          <p className="font-heading text-3xl text-gold">{hydrated ? `${accuracy}%` : '—'}</p>
          <p className="text-xs font-sans text-ink-muted text-center">Accuracy</p>
        </div>
        <div className="card-parchment p-4 flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-1">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-gold fill-current">
              <path d="M12 2C9 7 6 9 6 13a6 6 0 0012 0c0-4-3-6-6-11zm0 15a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
            <p className="font-heading text-3xl text-gold">{hydrated ? currentStreak : '—'}</p>
          </div>
          <p className="text-xs font-sans text-ink-muted text-center">Day streak</p>
        </div>
      </div>

      {/* Breakdown bar */}
      {hydrated && (
        <div className="card-parchment p-4 mb-8">
          <p className="font-sans text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">Unit 1 breakdown</p>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-sans text-ink-muted">Games</span>
                <span className="text-xs font-sans text-teal">{unit1Completion}%</span>
              </div>
              <div className="h-1.5 bg-parchment-darker rounded-full overflow-hidden">
                <div className="h-full bg-teal rounded-full transition-all duration-500" style={{ width: `${unit1Completion}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-xs font-sans text-ink-muted">Exercises</span>
                <span className="text-xs font-sans text-gold">{unit1ExerciseCompletion}%</span>
              </div>
              <div className="h-1.5 bg-parchment-darker rounded-full overflow-hidden">
                <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${unit1ExerciseCompletion}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      <SarfMapGrid />
    </div>
  );
}
