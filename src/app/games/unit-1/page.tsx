'use client';

import Link from 'next/link';
import GameCard from '@/components/games/GameCard';
import { getGameSections } from '@/lib/gameData';
import { isGameUnlocked, computeUnit1Completion } from '@/lib/gameState';
import { useProgress } from '@/lib/progressContext';

const SECTION_IS_ARABIC: Record<string, boolean> = {
  Introduction: false,
};

export default function Unit1GamesPage() {
  const { gameSessions } = useProgress();
  const sections = getGameSections();
  const completion = computeUnit1Completion(gameSessions);

  return (
    <div className="px-4 py-8 max-w-2xl lg:max-w-3xl">
      {/* Header */}
      <nav className="flex items-center gap-2 text-sm font-sans text-ink-muted mb-6">
        <Link href="/games" className="hover:text-teal transition-colors">Games</Link>
        <span className="text-gold/40">›</span>
        <span className="text-ink">Unit 1</span>
      </nav>

      <h1 className="font-heading text-2xl text-ink mb-1">Unit 1 — Thulāthī Mujarrad</h1>
      <p className="text-ink-muted font-sans text-sm mb-5">
        Work through each section to master the six bābs of Unit 1.
      </p>

      {/* Progress bar */}
      <div className="card-parchment p-4 mb-8">
        <div className="flex items-center justify-between mb-2">
          <p className="font-sans text-xs font-semibold text-ink-muted uppercase tracking-wide">Overall progress</p>
          <p className="font-heading text-lg text-teal">{completion}%</p>
        </div>
        <div className="h-2 bg-parchment-darker rounded-full overflow-hidden">
          <div
            className="h-full bg-teal rounded-full transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      {sections.map(({ section, games }) => {
        if (games.length === 0) return null;
        const isArabic = !SECTION_IS_ARABIC.hasOwnProperty(section);
        const sectionDone = games.filter((g) => gameSessions[g.id]?.completed).length;

        return (
          <section key={section} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <h2 className={`font-semibold ${isArabic ? 'arabic text-xl text-crimson' : 'font-heading text-lg text-ink'}`}
                dir={isArabic ? 'rtl' : undefined}>
                {section}
              </h2>
              <span className="text-xs font-sans text-ink-muted">
                {sectionDone}/{games.length} complete
              </span>
              <div className="flex-1 border-t border-gold/20" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  config={game}
                  progress={gameSessions[game.id]}
                  locked={!isGameUnlocked(game, gameSessions)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
