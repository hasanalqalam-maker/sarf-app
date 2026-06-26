'use client';

import Link from 'next/link';
import GameCard from '@/components/games/GameCard';
import { getUnit2GameSections, computeUnit2Completion } from '@/lib/unit2GameData';
import { isGameUnlocked } from '@/lib/gameState';
import { useProgress } from '@/lib/progressContext';

export default function Unit2GamesPage() {
  const { gameSessions } = useProgress();
  const sections = getUnit2GameSections();
  const completion = computeUnit2Completion(gameSessions);

  return (
    <div className="px-4 py-8 max-w-2xl lg:max-w-3xl">
      {/* Header */}
      <nav className="flex items-center gap-2 text-sm font-sans text-ink-muted mb-6">
        <Link href="/exercises" className="hover:text-gold transition-colors">Exercises</Link>
        <span className="text-gold/40">›</span>
        <span className="text-ink">Unit 2</span>
      </nav>

      <h1 className="font-heading text-2xl text-ink mb-1">Unit 2 — Thulāthī Mazīd</h1>
      <p className="text-ink-muted font-sans text-sm mb-5">
        Work through each section to master the ten mazīd bābs of Unit 2.
      </p>

      {/* Progress bar */}
      <div className="card-parchment p-4 mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="font-sans text-xs font-semibold text-ink-muted uppercase tracking-wide">Overall progress</p>
          <p className="font-heading text-lg text-gold">{completion}%</p>
        </div>
        <div className="h-2 bg-parchment-darker rounded-full overflow-hidden">
          <div
            className="h-full bg-gold rounded-full transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      {sections.map(({ section, games }) => {
        if (games.length === 0) return null;
        const sectionDone = games.filter((g) => gameSessions[g.id]?.completed).length;

        return (
          <section key={section} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="arabic font-semibold text-xl text-crimson" dir="rtl">
                {section}
              </h2>
              <span className="text-xs font-sans text-ink-muted">
                {sectionDone}/{games.length} complete
              </span>
              <div className="flex-1 border-t border-parchment-darker" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  config={game}
                  progress={gameSessions[game.id]}
                  locked={!isGameUnlocked(game, gameSessions)}
                  basePath="/games/unit-2"
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
