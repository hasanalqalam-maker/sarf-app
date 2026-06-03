'use client';

import SarfMapGrid from '@/components/SarfMapGrid';
import CircularProgress from '@/components/CircularProgress';
import { useProgress } from '@/lib/progressContext';

export default function SarfMapPage() {
  const { totalMastered, accuracy, currentStreak, unit1Completion, hydrated } = useProgress();

  return (
    <div className="px-4 py-8 max-w-3xl">
      <h1 className="font-heading text-2xl text-ink mb-1">Sarf Map</h1>
      <p className="text-ink-muted font-sans text-sm mb-6">
        Your mastery across all sīghas and bābs. Tap any cell to see details.
      </p>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="card-parchment p-4 flex flex-col items-center gap-1">
          <CircularProgress pct={hydrated ? unit1Completion : 0} size={72} />
          <p className="text-xs font-sans text-ink-muted text-center mt-1">Unit 1 complete</p>
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
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-gold fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C9 7 6 9 6 13a6 6 0 0012 0c0-4-3-6-6-11zm0 15a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
            <p className="font-heading text-3xl text-gold">{hydrated ? currentStreak : '—'}</p>
          </div>
          <p className="text-xs font-sans text-ink-muted text-center">Day streak</p>
        </div>
      </div>

      <SarfMapGrid />
    </div>
  );
}
