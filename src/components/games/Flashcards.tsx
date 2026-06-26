'use client';

import { useCallback, useEffect, useState } from 'react';
import GameSessionWrapper from './GameSessionWrapper';
import { generateFlashcards } from '@/lib/gameData';
import type { GameConfig, FlashCard } from '@/lib/gameData';
import { useProgress } from '@/lib/progressContext';

interface Props {
  config: GameConfig;
  onComplete: (score: number, total: number) => void;
  initialCards?: FlashCard[];
}

type Rating = 'again' | 'hard' | 'easy';

interface CardState {
  card: FlashCard;
  dueIn: number;
}

export default function Flashcards({ config, onComplete, initialCards }: Props) {
  const { recordAnswer } = useProgress();
  const [deck, setDeck] = useState<CardState[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [easyCount, setEasyCount] = useState(0);
  const [totalSeen, setTotalSeen] = useState(0);
  const [done, setDone] = useState(false);
  const [initialCount, setInitialCount] = useState(0);

  const reset = useCallback(() => {
    const cards = initialCards ?? generateFlashcards(config);
    setDeck(cards.map((c) => ({ card: c, dueIn: 0 })));
    setFlipped(false);
    setEasyCount(0);
    setTotalSeen(0);
    setDone(false);
    setInitialCount(cards.length);
  }, [config, initialCards]);

  useEffect(() => { reset(); }, [reset]);

  const current = deck.find((s) => s.dueIn === 0);

  function rate(rating: Rating) {
    if (!current) return;
    setTotalSeen((n) => n + 1);

    if (current.card.sighaId && current.card.cardParadigm) {
      recordAnswer(
        current.card.backBabId,
        current.card.sighaId,
        current.card.cardParadigm,
        current.card.frontForm,
        rating === 'easy',
      );
    }

    setDeck((prev) => {
      const next = prev
        .map((s) => ({ ...s, dueIn: Math.max(0, s.dueIn - 1) }))
        .filter((s) => s.card.id !== current.card.id || rating !== 'easy');

      if (rating === 'easy') {
        setEasyCount((e) => e + 1);
      } else {
        const dueIn = rating === 'again' ? 2 : 4;
        next.push({ card: current.card, dueIn });
      }

      if (next.filter((s) => s.dueIn === 0).length === 0 && !next.some((s) => s.dueIn > 0)) {
        setDone(true);
        onComplete(Math.round((easyCount + (rating === 'easy' ? 1 : 0)) / initialCount * 100), 100);
      }

      return next;
    });

    setFlipped(false);
  }

  return (
    <GameSessionWrapper
      gameId={config.id}
      title={config.title}
      score={easyCount}
      total={initialCount}
      completed={done}
      onRetry={reset}
    >
      <div className="flex flex-col items-center px-4 py-8 min-h-full">
        <p className="text-xs font-sans text-ink-muted mb-6">
          {deck.filter((s) => s.dueIn === 0).length} remaining · {easyCount} mastered
        </p>

        {current ? (
          <>
            {/* Card */}
            <div
              className="w-full max-w-sm cursor-pointer select-none"
              onClick={() => setFlipped((f) => !f)}
              style={{ perspective: '1000px' }}
            >
              <div
                className="relative w-full transition-transform duration-500"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  minHeight: '260px',
                }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 card-parchment flex flex-col items-center justify-center p-6 rounded-2xl"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <p dir="rtl" className="arabic text-[3rem] leading-[4.5rem] text-ink text-center mb-4">
                    {current.card.frontForm}
                  </p>
                  <p className="text-xs font-sans text-ink-muted">Tap to flip</p>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 card-parchment flex flex-col items-center justify-center p-6 rounded-2xl"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <div dir="rtl" className="text-center mb-4">
                    <p className="arabic text-xl text-ink leading-relaxed mb-1">{current.card.backSigha}</p>
                    {current.card.backPronoun && (
                      <p className="arabic text-base text-teal leading-relaxed mb-1">{current.card.backPronoun}</p>
                    )}
                    <p className="arabic text-sm text-ink-muted leading-relaxed">{current.card.backBabForm}</p>
                  </div>
                  <p className="text-xs font-sans text-ink-muted text-center">{current.card.backEnglish}</p>
                </div>
              </div>
            </div>

            {/* Rating buttons */}
            {flipped && (
              <div className="flex gap-2 mt-6 w-full max-w-sm">
                <button onClick={() => rate('again')} className="flex-1 py-3 rounded-xl border border-red-200 bg-red-50 text-red-600 text-xs font-sans font-medium hover:bg-red-100 transition-colors">
                  Again
                </button>
                <button onClick={() => rate('hard')} className="flex-1 py-3 rounded-xl border border-parchment-darker bg-white text-ink-muted text-xs font-sans font-medium hover:bg-parchment-dark transition-colors">
                  Hard
                </button>
                <button onClick={() => rate('easy')} className="flex-1 py-3 rounded-xl border border-teal/30 bg-[var(--color-secondary-light)] text-teal-dark text-xs font-sans font-medium hover:bg-teal/10 transition-colors">
                  Easy
                </button>
              </div>
            )}
            {!flipped && (
              <p className="text-xs font-sans text-ink-muted mt-4">Tap the card to see the answer</p>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="font-heading text-xl text-ink mb-2">Deck complete!</p>
            <p className="text-sm font-sans text-ink-muted">All cards rated Easy.</p>
          </div>
        )}
      </div>
    </GameSessionWrapper>
  );
}
