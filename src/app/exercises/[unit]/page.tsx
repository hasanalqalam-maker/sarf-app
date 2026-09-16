'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import GameCard from '@/components/games/GameCard';
import { getUnitGameSections, computeUnitCompletion, hasUnitGames } from '@/lib/unitGameData';
import { isGameUnlocked } from '@/lib/gameState';
import { useProgress } from '@/lib/progressContext';

/**
 * Generic hub for units whose content is "an irregularity applied across
 * existing bāb patterns" (Units 3–9) — driven entirely by the per-unit game
 * manifest in unitGameData.ts. Units 1 and 2 keep their own bespoke hub
 * pages (richer: exercises + games); this route only matches paths this
 * folder doesn't already have a static sibling for, e.g. /exercises/unit-3.
 */
export default function UnitHubPage() {
  const params = useParams();
  const unitParam = params.unit as string;
  const unitNumber = Number(unitParam?.match(/^unit-(\d+)$/)?.[1]);

  const { gameSessions } = useProgress();
  const sections = getUnitGameSections(unitNumber);
  const completion = computeUnitCompletion(unitNumber, gameSessions);
  const basePath = `/exercises/${unitParam}`;

  if (!unitNumber || !hasUnitGames(unitNumber)) {
    return (
      <div className="px-4 py-8 max-w-2xl">
        <nav className="flex items-center gap-2 text-sm font-sans text-ink-muted mb-6">
          <Link href="/exercises" className="hover:text-gold transition-colors">Exercises</Link>
          <span className="text-parchment-darker">›</span>
          <span className="text-ink">{unitParam}</span>
        </nav>
        <p className="text-sm font-sans text-ink-muted">
          Nothing here yet — Unit {unitNumber || unitParam} hasn&apos;t been built.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 max-w-2xl lg:max-w-3xl">
      <nav className="flex items-center gap-2 text-sm font-sans text-ink-muted mb-6">
        <Link href="/exercises" className="hover:text-gold transition-colors">Exercises</Link>
        <span className="text-parchment-darker">›</span>
        <span className="text-ink">Unit {unitNumber}</span>
      </nav>

      <h1 className="font-heading text-2xl text-ink mb-1">Unit {unitNumber}</h1>
      <p className="text-ink-muted font-sans text-sm mb-6">
        Work through each section to master this unit.
      </p>

      <div className="bg-white border border-parchment-darker rounded-xl p-4 mb-8">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  config={game}
                  progress={gameSessions[game.id]}
                  locked={!isGameUnlocked(game, gameSessions)}
                  basePath={basePath}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
