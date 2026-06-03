'use client';

import { useCallback, useMemo, useState } from 'react';
import GameSessionWrapper from './GameSessionWrapper';
import { generateFillTableData } from '@/lib/gameData';
import type { GameConfig, FillTableBab } from '@/lib/gameData';

interface Props {
  config: GameConfig;
  onComplete: (score: number, total: number) => void;
}

const PARADIGM_LABELS: Record<string, string> = {
  madi_malum: 'الْمَاضِي الْمَعْلُوم',
  mudari_malum: 'الْمُضَارِع الْمَعْلُوم',
  madi_majhul: 'الْمَاضِي الْمَجْهُول',
  mudari_majhul: 'الْمُضَارِع الْمَجْهُول',
  amr: 'الْأَمْر',
  nahy: 'النَّهْي',
};

export default function FillTheTable({ config, onComplete }: Props) {
  const allBabs = useMemo(() => generateFillTableData(config), [config]);
  const [activeBabIdx, setActiveBabIdx] = useState(0);
  const [revealed, setRevealed] = useState<Record<string, Set<string>>>({});
  const [usedRevealAll, setUsedRevealAll] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);
  const [manualCount, setManualCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const currentBab: FillTableBab | undefined = allBabs[activeBabIdx];

  const revealedForBab = (babId: string): Set<string> => revealed[babId] ?? new Set();

  function toggleCell(babId: string, sighaId: string) {
    setRevealed((prev) => {
      const set = new Set(prev[babId] ?? []);
      if (!set.has(sighaId)) {
        set.add(sighaId);
        if (!usedRevealAll.has(babId)) {
          setManualCount((c) => c + 1);
        }
      }
      return { ...prev, [babId]: set };
    });
  }

  function revealAll(babId: string, rows: FillTableBab['rows']) {
    setUsedRevealAll((prev) => new Set([...prev, babId]));
    setRevealed((prev) => ({
      ...prev,
      [babId]: new Set(rows.map((r) => r.sighaId)),
    }));
  }

  function handleDone() {
    const total = allBabs.reduce((acc, b) => acc + b.rows.length, 0);
    const manual = manualCount;
    setTotalCount(total);
    setDone(true);
    const score = total > 0 ? Math.round((manual / total) * 100) : 0;
    onComplete(score, 100);
  }

  const reset = useCallback(() => {
    setActiveBabIdx(0);
    setRevealed({});
    setUsedRevealAll(new Set());
    setDone(false);
    setManualCount(0);
    setTotalCount(0);
  }, []);

  const allRevealedForCurrent = currentBab
    ? revealedForBab(currentBab.babId).size >= currentBab.rows.length
    : false;

  const totalRevealed = allBabs.reduce((acc, b) => acc + revealedForBab(b.babId).size, 0);
  const totalForms = allBabs.reduce((acc, b) => acc + b.rows.length, 0);

  return (
    <GameSessionWrapper
      gameId={config.id}
      title={config.title}
      score={totalRevealed}
      total={totalForms}
      completed={done}
      onRetry={reset}
    >
      {currentBab && (
        <div className="flex flex-col min-h-full">
          {/* Bāb tabs */}
          <div className="flex overflow-x-auto gap-1 px-4 pt-4 pb-2 shrink-0">
            {allBabs.map((b, i) => {
              const rev = revealedForBab(b.babId).size;
              const tot = b.rows.length;
              const complete = rev >= tot;
              return (
                <button
                  key={b.babId}
                  onClick={() => setActiveBabIdx(i)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors ${
                    i === activeBabIdx
                      ? 'bg-teal text-parchment'
                      : complete
                      ? 'bg-teal/10 text-teal'
                      : 'bg-parchment-dark text-ink-muted hover:bg-gold/10'
                  }`}
                >
                  <span dir="rtl" className="arabic text-sm">{b.babId === 'fataha' ? 'فَتَحَ' : b.babId === 'samiʿa' ? 'سَمِعَ' : b.babId === 'daraba' ? 'ضَرَبَ' : b.babId === 'nasara' ? 'نَصَرَ' : b.babId === 'karuma' ? 'كَرُمَ' : 'حَسِبَ'}</span>
                  {complete && ' ✓'}
                </button>
              );
            })}
          </div>

          {/* Paradigm label */}
          <div className="px-4 pb-3 text-right">
            <span dir="rtl" className="arabic text-sm text-ink-muted">{PARADIGM_LABELS[config.paradigm]}</span>
          </div>

          {/* Table */}
          <div className="flex-1 px-4 overflow-y-auto">
            <table className="w-full mb-4">
              <thead>
                <tr className="border-b border-gold/20">
                  <th className="pb-2 text-left text-[10px] font-sans font-semibold text-ink-muted uppercase tracking-wide">Sīgha</th>
                  <th className="pb-2 text-right text-[10px] font-sans font-semibold text-ink-muted uppercase tracking-wide">Form</th>
                </tr>
              </thead>
              <tbody>
                {currentBab.rows.map((row) => {
                  const isRevealed = revealedForBab(currentBab.babId).has(row.sighaId);
                  return (
                    <tr key={row.sighaId} className="border-b border-gold/10 last:border-0">
                      <td className="py-2.5 pr-3">
                        <div dir="rtl" className="flex items-baseline gap-1.5">
                          <span className="arabic text-sm text-ink leading-relaxed">{row.sighaArabicName}</span>
                          {row.pronoun && <span className="arabic text-xs text-ink-muted leading-relaxed">{row.pronoun}</span>}
                        </div>
                      </td>
                      <td className="py-2.5 text-right">
                        {isRevealed ? (
                          <span dir="rtl" className="arabic text-arabic-lg text-ink leading-relaxed">
                            {row.form}
                          </span>
                        ) : (
                          <button
                            onClick={() => toggleCell(currentBab.babId, row.sighaId)}
                            className="inline-flex items-center justify-center w-24 h-9 rounded-lg bg-teal/15 border border-teal/30 text-teal text-xs font-sans font-medium hover:bg-teal/25 transition-colors"
                          >
                            Tap to reveal
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer actions */}
          <div className="px-4 pb-6 pt-2 flex gap-2 shrink-0 border-t border-gold/10">
            {!allRevealedForCurrent && (
              <button
                onClick={() => revealAll(currentBab.babId, currentBab.rows)}
                className="flex-1 py-2.5 rounded-lg border border-gold/30 text-xs font-sans font-medium text-ink-muted hover:bg-gold/5 transition-colors"
              >
                Reveal all
              </button>
            )}
            <button
              onClick={handleDone}
              className="flex-1 py-2.5 rounded-lg bg-teal text-parchment text-xs font-sans font-medium hover:bg-teal-dark transition-colors"
            >
              Done ({totalRevealed}/{totalForms})
            </button>
          </div>
        </div>
      )}
    </GameSessionWrapper>
  );
}
