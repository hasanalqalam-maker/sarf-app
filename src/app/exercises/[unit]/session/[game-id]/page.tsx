'use client';

import { useParams } from 'next/navigation';
import { useCallback } from 'react';
import { getUnitGameConfig } from '@/lib/unitGameData';
import { useProgress } from '@/lib/progressContext';
import NameThatSigha from '@/components/games/NameThatSigha';
import FillTheTable from '@/components/games/FillTheTable';
import Flashcards from '@/components/games/Flashcards';
import MatchUp from '@/components/games/MatchUp';
import WhichBab from '@/components/games/WhichBab';
import DictionaryForm from '@/components/games/DictionaryForm';

/**
 * Generic session router for units 3–9 (see /exercises/[unit]/page.tsx).
 * Reuses the exact same game components Units 1–2 use — they already read
 * their data generically off config.unit.
 */
export default function UnitGameSessionPage() {
  const params = useParams();
  const unitNumber = Number((params.unit as string)?.match(/^unit-(\d+)$/)?.[1]);
  const gameId = decodeURIComponent(params['game-id'] as string);
  const config = getUnitGameConfig(unitNumber, gameId);
  const { recordGameSession } = useProgress();

  const handleComplete = useCallback((score: number, total: number) => {
    const pct = total > 0 ? Math.round((score / total) * 100) : score;
    recordGameSession(gameId, pct);
  }, [gameId, recordGameSession]);

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-dvh px-6">
        <p className="text-ink-muted font-sans text-sm text-center">Game not found: {gameId}</p>
      </div>
    );
  }

  if (config.type === 'name-sigha') {
    return <NameThatSigha config={config} onComplete={handleComplete} />;
  }
  if (config.type === 'fill-table') {
    return <FillTheTable config={config} onComplete={handleComplete} />;
  }
  if (config.type === 'flashcards') {
    return <Flashcards config={config} onComplete={handleComplete} />;
  }
  if (config.type === 'match-up') {
    return <MatchUp config={config} onComplete={handleComplete} />;
  }
  if (config.type === 'which-bab') {
    return <WhichBab config={config} onComplete={handleComplete} />;
  }
  if (config.type === 'dictionary-form') {
    return <DictionaryForm config={config} onComplete={handleComplete} />;
  }

  return <div className="p-8 text-center font-sans text-ink-muted text-sm">Unknown game type.</div>;
}
