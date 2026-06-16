'use client';

import Link from 'next/link';
import { useState } from 'react';
import GameCard from '@/components/games/GameCard';
import ExerciseCard from '@/components/exercises/ExerciseCard';
import { getGameSections } from '@/lib/gameData';
import { isGameUnlocked, computeUnit1Completion } from '@/lib/gameState';
import {
  getAllExercises,
  getExerciseParts,
  getExercisesByPart,
  isExerciseUnlocked,
  computeUnit1ExerciseCompletion,
  parsePart,
} from '@/lib/exerciseData';
import { useProgress } from '@/lib/progressContext';

type Tab = 'exercises' | 'games';

const SECTION_IS_ARABIC: Record<string, boolean> = { Introduction: false };

export default function Unit1HubPage() {
  const { gameSessions, exerciseSessions } = useProgress();
  const [tab, setTab] = useState<Tab>('exercises');

  const gameCompletion = computeUnit1Completion(gameSessions);
  const exCompletion = computeUnit1ExerciseCompletion(exerciseSessions);
  const combined = Math.round((gameCompletion + exCompletion) / 2);

  const parts = getExerciseParts();
  const gameSections = getGameSections();

  return (
    <div className="px-4 py-8 max-w-2xl lg:max-w-3xl">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm font-sans text-ink-muted mb-6">
        <Link href="/exercises" className="hover:text-teal transition-colors">Exercises</Link>
        <span className="text-gold/40">›</span>
        <span className="text-ink">Unit 1</span>
      </nav>

      <h1 className="font-heading text-2xl text-ink mb-1">Unit 1 — Thulāthī Mujarrad</h1>
      <p className="text-ink-muted font-sans text-sm mb-5">
        Six bābs of the unmixed trilateral verb — exercises and games.
      </p>

      {/* Combined progress bar */}
      <div className="card-parchment p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <p className="font-sans text-xs font-semibold text-ink-muted uppercase tracking-wide">Overall progress</p>
          <p className="font-heading text-lg text-teal">{combined}%</p>
        </div>
        <div className="h-2 bg-parchment-darker rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-teal rounded-full transition-all duration-500"
            style={{ width: `${combined}%` }}
          />
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal shrink-0" />
            <span className="text-[11px] font-sans text-ink-muted">Games {gameCompletion}%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gold shrink-0" />
            <span className="text-[11px] font-sans text-ink-muted">Exercises {exCompletion}%</span>
          </div>
        </div>
      </div>

      {/* Segmented control */}
      <div className="flex bg-parchment-darker rounded-xl p-1 mb-8 gap-1">
        <button
          onClick={() => setTab('exercises')}
          className={`flex-1 py-2 rounded-lg text-sm font-sans font-medium transition-colors ${
            tab === 'exercises'
              ? 'bg-parchment text-ink shadow-sm'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          Exercises
        </button>
        <button
          onClick={() => setTab('games')}
          className={`flex-1 py-2 rounded-lg text-sm font-sans font-medium transition-colors ${
            tab === 'games'
              ? 'bg-parchment text-ink shadow-sm'
              : 'text-ink-muted hover:text-ink'
          }`}
        >
          Games
        </button>
      </div>

      {/* ── EXERCISES TAB ─────────────────────────────────────────── */}
      {tab === 'exercises' && (
        <div>
          {parts.map((part) => {
            const exercises = getExercisesByPart(part);
            const { label, arabic } = parsePart(part);
            const done = exercises.filter(e => exerciseSessions[e.id]?.completed).length;
            const scoreable = exercises.filter(e => e.exerciseType !== 'verbal-practice').length;

            return (
              <section key={part} className="mb-10">
                {/* Part heading */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      {label && (
                        <span className="font-heading text-sm text-ink-muted font-medium shrink-0">{label} ·</span>
                      )}
                      <span dir="rtl" className="arabic text-xl text-crimson leading-relaxed">{arabic}</span>
                    </div>
                  </div>
                  <span className="text-xs font-sans text-ink-muted shrink-0 whitespace-nowrap">
                    {done}/{scoreable} complete
                  </span>
                  <div className="flex-1 border-t border-gold/20 min-w-0" />
                </div>

                {/* Exercise cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {exercises.map((ex) => (
                    <ExerciseCard
                      key={ex.id}
                      exercise={ex}
                      session={exerciseSessions[ex.id]}
                      locked={!isExerciseUnlocked(ex, exerciseSessions)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ── GAMES TAB ─────────────────────────────────────────────── */}
      {tab === 'games' && (
        <div>
          {gameSections.map(({ section, games }) => {
            if (games.length === 0) return null;
            const isArabic = !SECTION_IS_ARABIC.hasOwnProperty(section);
            const sectionDone = games.filter(g => gameSessions[g.id]?.completed).length;

            return (
              <section key={section} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <h2
                    className={`font-semibold ${isArabic ? 'arabic text-xl text-crimson' : 'font-heading text-lg text-ink'}`}
                    dir={isArabic ? 'rtl' : undefined}
                  >
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
                      basePath="/exercises/unit-1/session"
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
