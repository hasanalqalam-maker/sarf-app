'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useProgress } from '@/lib/progressContext';
import { UNIT1_GAMES, getGameConfig } from '@/lib/gameData';
import { isGameUnlocked } from '@/lib/gameState';

export default function HomePage() {
  const {
    hydrated,
    currentStreak,
    unit1Completion,
    totalMastered,
    accuracy,
    lastPlayedGameId,
    recentActivity,
    gameSessions,
  } = useProgress();

  const continueGame = useMemo(() => {
    if (!lastPlayedGameId) return null;
    return getGameConfig(lastPlayedGameId) ?? null;
  }, [lastPlayedGameId]);

  const suggestedGame = useMemo(() => {
    return UNIT1_GAMES.find(
      (g) => isGameUnlocked(g, gameSessions) && !gameSessions[g.id]?.completed,
    ) ?? null;
  }, [gameSessions]);

  const recentFour = recentActivity.slice(0, 4);

  const paradigmLabel = (p: string) => {
    const map: Record<string, string> = {
      madi_malum: 'Māḍī', mudari_malum: 'Muḍāriʿ',
      madi_majhul: 'Māḍī Majhūl', mudari_majhul: 'Muḍāriʿ Majhūl',
      amr: 'Amr', nahy: 'Nahy',
    };
    return map[p] ?? p;
  };

  return (
    <div className="px-4 py-8 max-w-xl space-y-6">

      {/* Greeting */}
      <div>
        <p dir="rtl" className="arabic text-2xl text-ink mb-0.5">اَلسَّلَامُ عَلَيْكُمْ</p>
        <p className="font-heading text-lg text-ink-muted">Welcome back, student.</p>
      </div>

      {/* Streak + progress bar */}
      <div className="bg-white border border-parchment-darker rounded-xl p-4 flex items-center gap-4">
        <div className="flex items-center gap-2.5 shrink-0">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-crimson fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C9 7 6 9 6 13a6 6 0 0012 0c0-4-3-6-6-11zm0 15a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
          <div>
            <p className="font-heading text-3xl text-crimson leading-none">{hydrated ? currentStreak : '—'}</p>
            <p className="text-xs font-sans text-ink-muted">day streak</p>
          </div>
        </div>
        <div className="flex-1 border-l border-parchment-darker pl-4 min-w-0">
          <p className="font-sans text-xs text-ink-muted mb-1.5">Unit 1 progress</p>
          <div className="h-2 bg-parchment-darker rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all duration-500"
              style={{ width: `${hydrated ? unit1Completion : 0}%` }}
            />
          </div>
          <p className="text-xs font-sans text-ink-muted mt-1">{hydrated ? unit1Completion : 0}% complete</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-parchment-darker rounded-xl p-4 text-center">
          <p className="font-heading text-3xl text-gold leading-none mb-1">{hydrated ? totalMastered : '—'}</p>
          <p className="text-xs font-sans text-ink-muted">Forms mastered</p>
        </div>
        <div className="bg-white border border-parchment-darker rounded-xl p-4 text-center">
          <p className="font-heading text-3xl text-gold leading-none mb-1">{hydrated ? `${accuracy}%` : '—'}</p>
          <p className="text-xs font-sans text-ink-muted">Accuracy</p>
        </div>
      </div>

      {/* Continue */}
      {hydrated && continueGame && (
        <div>
          <p className="font-sans text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Continue</p>
          <Link
            href={`/exercises/unit-1/session/${encodeURIComponent(continueGame.id)}`}
            className="bg-white border border-parchment-darker border-l-[3px] border-l-teal rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-shadow group block"
          >
            <div>
              <p className="font-heading text-base text-ink group-hover:text-teal transition-colors">{continueGame.title}</p>
              <p className="text-xs font-sans text-ink-muted mt-0.5">{continueGame.description}</p>
            </div>
            <span className="text-teal text-lg ml-3 shrink-0">→</span>
          </Link>
        </div>
      )}

      {/* Up next */}
      {hydrated && suggestedGame && suggestedGame.id !== continueGame?.id && (
        <div>
          <p className="font-sans text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Up next</p>
          <Link
            href={`/exercises/unit-1/session/${encodeURIComponent(suggestedGame.id)}`}
            className="bg-white border border-parchment-darker border-l-[3px] border-l-teal rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition-shadow group"
          >
            <div>
              <p className="font-heading text-base text-ink group-hover:text-teal transition-colors">{suggestedGame.title}</p>
              <p className="text-xs font-sans text-ink-muted mt-0.5">{suggestedGame.description}</p>
            </div>
            <span className="text-teal text-lg ml-3 shrink-0">→</span>
          </Link>
        </div>
      )}

      {/* Mini Sarf Map */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="font-sans text-xs font-semibold text-ink-muted uppercase tracking-wide">Sarf Map</p>
          <Link href="/progress" className="text-xs font-sans text-gold hover:underline">View full map →</Link>
        </div>
        <Link href="/progress" className="bg-white border border-parchment-darker rounded-xl p-4 block hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: 20 }).map((_, i) => (
                  <span
                    key={i}
                    className={`inline-block w-4 h-4 rounded-sm ${
                      i % 3 === 0 ? 'bg-teal' : i % 3 === 2 ? 'bg-parchment-darker' : ''
                    }`}
                    style={i % 3 === 1 ? { backgroundColor: 'var(--color-primary-light)' } : undefined}
                  />
                ))}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="font-heading text-xl text-teal">{hydrated ? totalMastered : '—'}</p>
              <p className="text-xs font-sans text-ink-muted">mastered</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent activity */}
      {hydrated && recentFour.length > 0 && (
        <div>
          <p className="font-sans text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Recent activity</p>
          <div className="space-y-2">
            {recentFour.map((a, i) => (
              <div key={i} className="bg-white border border-parchment-darker rounded-xl px-4 py-3 flex items-center gap-3">
                <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
                  a.correct ? 'bg-teal/15 text-teal' : 'bg-crimson/10 text-crimson'
                }`}>
                  {a.correct ? '✓' : '✗'}
                </span>
                <div className="flex-1 min-w-0">
                  <span dir="rtl" className="arabic text-base text-ink">{a.form}</span>
                </div>
                <span className="text-xs font-sans text-ink-muted shrink-0">{paradigmLabel(a.paradigm)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA banner — empty state */}
      {hydrated && recentFour.length === 0 && (
        <div className="bg-gold rounded-xl p-6 text-center">
          <p dir="rtl" className="arabic text-xl text-white mb-2">اِبْدَأِ الْآن</p>
          <p className="font-sans text-sm text-white/80 mb-5">Start your first exercise to track progress here.</p>
          <Link
            href="/exercises/unit-1"
            className="inline-block bg-white text-gold font-sans text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-parchment-dark transition-colors"
          >
            Go to Exercises
          </Link>
        </div>
      )}
    </div>
  );
}
