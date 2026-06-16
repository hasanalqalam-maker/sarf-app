'use client';

import { useParams } from 'next/navigation';
import { useCallback } from 'react';
import { getGameConfig } from '@/lib/gameData';
import { useProgress } from '@/lib/progressContext';
import NameThatSigha from '@/components/games/NameThatSigha';
import FillTheTable from '@/components/games/FillTheTable';
import Flashcards from '@/components/games/Flashcards';
import MatchUp from '@/components/games/MatchUp';

export default function GameSessionPage() {
  const params = useParams();
  const gameId = decodeURIComponent(params['game-id'] as string);
  const config = getGameConfig(gameId);
  const { recordGameSession } = useProgress();

  const handleComplete = useCallback((score: number, total: number) => {
    const pct = total > 0 ? Math.round((score / total) * 100) : score;
    recordGameSession(gameId, pct);
  }, [gameId, recordGameSession]);

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <p className="text-ink-muted font-sans text-sm">Game not found: {gameId}</p>
      </div>
    );
  }

  const backHref = '/exercises/unit-1';

  if (config.type === 'name-sigha') return <NameThatSigha config={config} onComplete={handleComplete} />;
  if (config.type === 'fill-table') return <FillTheTable config={config} onComplete={handleComplete} />;
  if (config.type === 'flashcards') return <Flashcards config={config} onComplete={handleComplete} />;
  if (config.type === 'match-up') return <MatchUp config={config} onComplete={handleComplete} />;

  return <div className="p-8 text-center font-sans text-ink-muted text-sm">Unknown game type.</div>;
}
