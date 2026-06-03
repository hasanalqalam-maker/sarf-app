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

      {/* Streak bar */}
      <div className="card-parchment p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="w-8 h-8 text-gold fill-current shrink-0" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C9 7 6 9 6 13a6 6 0 0012 0c0-4-3-6-6-11zm0 15a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
          <div>
            <p className="font-heading text-2xl text-gold leading-none">{hydrated ? currentStreak : '—'}</p>
            <p className="text-xs font-sans text-ink-muted">day streak</p>
          </div>
        </div>
        <div className="flex-1 border-l border-gold/20 pl-4">
          <p className="font-sans text-xs text-ink-muted mb-1">Unit 1 progress</p>
          <div className="h-2 bg-parchment-darker rounded-full overflow-hidden">
            <div
              className="h-full bg-teal rounded-full transition-all duration-500"
              style={{ width: `${hydrated ? unit1Completion : 0}%` }}
            />
          </div>
          <p className="text-xs font-sans text-ink-muted mt-1">{hydrated ? unit1Completion : 0}% complete</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-parchment p-4 text-center">
          <p className="font-heading text-2xl text-teal">{hydrated ? totalMastered : '—'}</p>
          <p className="text-xs font-sans text-ink-muted">Forms mastered</p>
        </div>
        <div className="card-parchment p-4 text-center">
          <p className="font-heading text-2xl text-teal">{hydrated ? `${accuracy}%` : '—'}</p>
          <p className="text-xs font-sans text-ink-muted">Accuracy</p>
        </div>
      </div>

      {/* Continue card */}
      {hydrated && continueGame && (
        <div>
          <p className="font-sans text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Continue</p>
          <Link
            href={`/games/unit-1/session/${encodeURIComponent(continueGame.id)}`}
            className="card-parchment p-4 block hover:border-teal/40 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-heading text-base text-ink group-hover:text-teal transition-colors">{continueGame.title}</p>
                <p className="text-xs font-sans text-ink-muted mt-0.5">{continueGame.description}</p>
              </div>
              <span className="text-ink-muted group-hover:text-teal transition-colors text-lg ml-3">→</span>
            </div>
          </Link>
        </div>
      )}

      {/* Suggested next */}
      {hydrated && suggestedGame && suggestedGame.id !== continueGame?.id && (
        <div>
          <p className="font-sans text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Up next</p>
          <Link
            href={`/games/unit-1/session/${encodeURIComponent(suggestedGame.id)}`}
            className="card-parchment p-4 block hover:border-gold/40 transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-heading text-base text-ink group-hover:text-gold transition-colors">{suggestedGame.title}</p>
                <p className="text-xs font-sans text-ink-muted mt-0.5">{suggestedGame.description}</p>
              </div>
              <span className="text-ink-muted group-hover:text-gold transition-colors text-lg ml-3">→</span>
            </div>
          </Link>
        </div>
      )}

      {/* Mini Sarf Map preview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="font-sans text-xs font-semibold text-ink-muted uppercase tracking-wide">Sarf Map</p>
          <Link href="/sarf-map" className="text-xs font-sans text-teal hover:underline">View full map →</Link>
        </div>
        <Link href="/sarf-map" className="card-parchment p-4 block hover:border-teal/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: 20 }).map((_, i) => (
                  <span key={i} className={`inline-block w-4 h-4 rounded-sm ${i % 3 === 0 ? 'bg-teal/20' : i % 3 === 1 ? 'bg-gold/20' : 'bg-parchment-darker'}`} />
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
              <div key={i} className="card-parchment px-4 py-3 flex items-center gap-3">
                <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs ${a.correct ? 'bg-teal/20 text-teal' : 'bg-red-100 text-red-500'}`}>
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

      {hydrated && recentFour.length === 0 && (
        <div className="card-parchment p-6 text-center">
          <p dir="rtl" className="arabic text-xl text-ink-muted mb-2">اِبْدَأِ الْآن</p>
          <p className="font-sans text-sm text-ink-muted mb-4">Start your first game to track progress here.</p>
          <Link href="/games/unit-1" className="inline-block bg-teal text-parchment font-sans text-sm px-5 py-2.5 rounded-xl hover:bg-teal-dark transition-colors">
            Go to Games
          </Link>
        </div>
      )}
    </div>
  );
}
