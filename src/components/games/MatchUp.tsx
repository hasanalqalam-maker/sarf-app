'use client';

import { useCallback, useEffect, useState } from 'react';
import GameSessionWrapper from './GameSessionWrapper';
import { generateMatchUpItems, shuffle } from '@/lib/gameData';
import type { GameConfig, MatchItem } from '@/lib/gameData';

interface Props {
  config: GameConfig;
  onComplete: (score: number, total: number) => void;
}

interface ZoneState {
  zoneId: string;
  zoneLabel: string;
  placedChipId: string | null;
  correct: boolean | null;
}

export default function MatchUp({ config, onComplete }: Props) {
  const [allItems, setAllItems] = useState<MatchItem[]>([]);
  const [chips, setChips] = useState<MatchItem[]>([]);
  const [zones, setZones] = useState<ZoneState[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [shaking, setShaking] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);

  const BATCH = 4;

  const reset = useCallback(() => {
    const items = generateMatchUpItems(config).slice(0, BATCH);
    setAllItems(items);
    setChips(shuffle([...items]));
    setZones(shuffle(items.map((it) => ({ zoneId: it.zoneId, zoneLabel: it.zoneLabel, placedChipId: null, correct: null }))));
    setSelected(null);
    setCorrectCount(0);
    setDone(false);
  }, [config]);

  useEffect(() => { reset(); }, [reset]);

  function handleChipTap(chipId: string) {
    if (selected === chipId) {
      setSelected(null);
    } else {
      setSelected(chipId);
    }
  }

  function handleZoneTap(zoneId: string) {
    if (!selected) return;

    const item = allItems.find((it) => it.chipId === selected);
    if (!item) return;

    const isCorrect = item.zoneId === zoneId;

    if (isCorrect) {
      setZones((prev) =>
        prev.map((z) => z.zoneId === zoneId ? { ...z, placedChipId: selected, correct: true } : z)
      );
      setChips((prev) => prev.filter((c) => c.chipId !== selected));
      setSelected(null);
      const newCorrect = correctCount + 1;
      setCorrectCount(newCorrect);
      if (newCorrect >= allItems.length) {
        setDone(true);
        onComplete(100, 100);
      }
    } else {
      setShaking(zoneId);
      setSelected(null);
      setTimeout(() => setShaking(null), 500);
    }
  }

  return (
    <GameSessionWrapper
      gameId={config.id}
      title={config.title}
      score={correctCount}
      total={allItems.length}
      completed={done}
      onRetry={reset}
    >
      <div className="flex flex-col min-h-full px-4 py-6">
        <p className="text-xs font-sans text-ink-muted text-center mb-6">
          Tap a form, then tap its matching label
        </p>

        {/* Chip bank */}
        <div className="mb-8">
          <p className="text-[10px] font-sans text-ink-muted uppercase tracking-wide mb-3">Forms</p>
          <div className="flex flex-wrap gap-2">
            {chips.map((chip) => (
              <button
                key={chip.chipId}
                onClick={() => handleChipTap(chip.chipId)}
                className={`px-4 py-2.5 rounded-xl border font-sans text-sm transition-all ${
                  selected === chip.chipId
                    ? 'border-teal bg-teal text-parchment shadow-md scale-105'
                    : 'border-gold/30 bg-parchment-dark text-ink hover:border-gold/60'
                }`}
              >
                <span dir="rtl" className="arabic text-lg leading-relaxed">{chip.chipArabic}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Drop zones */}
        <div>
          <p className="text-[10px] font-sans text-ink-muted uppercase tracking-wide mb-3">Match to</p>
          <div className="grid grid-cols-1 gap-2">
            {zones.map((zone) => {
              const isShaking = shaking === zone.zoneId;
              return (
                <button
                  key={zone.zoneId}
                  onClick={() => !zone.correct && handleZoneTap(zone.zoneId)}
                  disabled={zone.correct === true}
                  className={`
                    flex items-center justify-between px-4 py-3 rounded-xl border transition-all
                    ${zone.correct === true
                      ? 'border-teal bg-teal/10 cursor-default'
                      : selected
                      ? 'border-gold/50 bg-parchment-dark hover:bg-gold/10 cursor-pointer'
                      : 'border-gold/20 bg-parchment-dark cursor-default'
                    }
                    ${isShaking ? 'animate-bounce' : ''}
                  `}
                >
                  <span dir="rtl" className="arabic text-lg text-ink leading-relaxed">{zone.zoneLabel}</span>
                  {zone.correct === true && zone.placedChipId && (
                    <span dir="rtl" className="arabic text-lg text-teal leading-relaxed ml-2">
                      {allItems.find((it) => it.chipId === zone.placedChipId)?.chipArabic}
                    </span>
                  )}
                  {zone.correct === true && (
                    <svg className="w-5 h-5 text-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </GameSessionWrapper>
  );
}
