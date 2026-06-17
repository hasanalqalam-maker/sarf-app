'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ExerciseSessionWrapper from './ExerciseSessionWrapper';
import type { Exercise } from '@/lib/exerciseData';
import { TYPE_LABELS, shuffle } from '@/lib/exerciseData';
import { useProgress } from '@/lib/progressContext';

interface Props {
  exercise: Exercise;
  onComplete: (score: number, total: number) => void;
}

interface ActiveCell {
  key: string;
  correct: string;
  options: string[];
  sigha: string;
  label: string; // "Active" or "Passive"
}

export default function ActivePassiveTableSession({ exercise, onComplete }: Props) {
  const { recordAnswer } = useProgress();

  const hasWorkedExample = (exercise.instructionText ?? '').includes('One has been done for you');

  const allClear = useMemo(() => exercise.items.filter(i => !i.unclear), [exercise.items]);
  const workedExampleItem = hasWorkedExample ? allClear[0] : null;
  const scoreable = useMemo(
    () => hasWorkedExample ? allClear.slice(1) : allClear,
    [allClear, hasWorkedExample],
  );
  const pendingReview = exercise.items.length - allClear.length;

  // Two cells per row: active + passive
  const totalCells = scoreable.length * 2;

  const [cellStates, setCellStates] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [hadWrong, setHadWrong] = useState<Set<string>>(new Set());
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [done, setDone] = useState(false);

  const correctCount = Object.values(cellStates).filter(s => s === 'correct').length;
  const firstAttemptScore = correctCount
    - Object.keys(cellStates).filter(k => cellStates[k] === 'correct' && hadWrong.has(k)).length;

  // Auto-complete when all cells filled
  useEffect(() => {
    if (!done && totalCells > 0 && correctCount === totalCells) {
      setDone(true);
      onComplete(firstAttemptScore, totalCells);
    }
  }, [correctCount, totalCells, done, firstAttemptScore, onComplete]);

  function openCell(rowIdx: number, col: 'active' | 'passive') {
    const key = `${rowIdx}|${col}`;
    if (cellStates[key] === 'correct') return;

    const item = scoreable[rowIdx];
    const answer = item.answer as Record<string, string>;
    const correct = answer[col];
    if (!correct) return;

    // Distractors from other rows' same column
    const others = scoreable
      .filter((_, i) => i !== rowIdx)
      .map(it => (it.answer as Record<string, string>)[col])
      .filter((v): v is string => !!v && v !== correct);
    const distractors = shuffle([...new Set(others)]).slice(0, 3);
    while (distractors.length < 3) distractors.push('—');

    const answer2 = item.answer as Record<string, string>;
    setActiveCell({
      key,
      correct,
      options: shuffle([correct, ...distractors]),
      sigha: answer2.sigha ?? '',
      label: col === 'active' ? 'Active (maʿlūm)' : 'Passive (majhūl)',
    });
  }

  function handleCellAnswer(option: string) {
    if (!activeCell) return;
    const { key, correct } = activeCell;
    const isCorrect = option === correct;
    setActiveCell(null);

    if (isCorrect) {
      setCellStates(s => ({ ...s, [key]: 'correct' }));
      recordAnswer('unit1-exercise', exercise.id, exercise.exerciseType, correct, true);
    } else {
      setHadWrong(w => new Set([...w, key]));
      setCellStates(s => ({ ...s, [key]: 'wrong' }));
      recordAnswer('unit1-exercise', exercise.id, exercise.exerciseType, correct, false);
      setTimeout(() => {
        setCellStates(s => {
          const n = { ...s };
          if (n[key] === 'wrong') delete n[key];
          return n;
        });
      }, 700);
    }
  }

  function handleDone() {
    setDone(true);
    onComplete(firstAttemptScore, totalCells);
  }

  const reset = useCallback(() => {
    setCellStates({});
    setHadWrong(new Set());
    setActiveCell(null);
    setDone(false);
  }, []);

  const title = `Ex ${exercise.exerciseNumber} · ${TYPE_LABELS[exercise.exerciseType] ?? exercise.exerciseType}`;

  return (
    <ExerciseSessionWrapper
      exerciseId={exercise.id}
      title={title}
      page={exercise.page}
      score={correctCount}
      total={totalCells}
      completed={done}
      pendingReview={pendingReview}
      onRetry={reset}
    >
      <div className="px-4 py-6">
        {/* Instruction */}
        <div className="bg-ink/5 rounded-xl px-4 py-3 mb-5">
          <p className="text-xs font-sans text-ink-muted leading-relaxed">{exercise.instructionText}</p>
        </div>

        {/* Column headers */}
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full min-w-max border-collapse">
            <thead>
              <tr className="border-b border-gold/20">
                <th className="pb-2 text-left text-[10px] font-sans font-semibold text-ink-muted uppercase tracking-wide pr-2 min-w-[120px]">
                  English
                </th>
                <th className="pb-2 text-center px-2 text-[10px] font-sans font-semibold text-ink-muted uppercase tracking-wide min-w-[60px]">
                  صِيْغَة
                </th>
                <th className="pb-2 text-center px-2 text-[10px] font-sans font-semibold text-teal uppercase tracking-wide min-w-[80px]">
                  مَعْلُوم
                </th>
                <th className="pb-2 text-center px-2 text-[10px] font-sans font-semibold text-gold uppercase tracking-wide min-w-[80px]">
                  مَجْهُوْل
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Worked example row (pre-filled, non-interactive) */}
              {workedExampleItem && (() => {
                const wa = workedExampleItem.answer as Record<string, string>;
                return (
                  <tr className="border-b border-teal/20 bg-teal/8">
                    <td className="py-2.5 pr-2">
                      <p className="font-sans text-xs text-teal leading-snug">{workedExampleItem.english}</p>
                      <span className="text-[9px] font-sans text-teal/60 uppercase tracking-wide">example</span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span dir="rtl" className="arabic text-xs text-teal">{wa.sigha}</span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span dir="rtl" className="arabic text-sm text-teal">{wa.active}</span>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span dir="rtl" className="arabic text-sm text-teal">{wa.passive}</span>
                    </td>
                  </tr>
                );
              })()}
              {scoreable.map((item, ri) => {
                const answer = item.answer as Record<string, string>;
                const activeKey = `${ri}|active`;
                const passiveKey = `${ri}|passive`;
                const activeState = cellStates[activeKey];
                const passiveState = cellStates[passiveKey];

                return (
                  <tr key={ri} className="border-b border-gold/10 last:border-0">
                    {/* English */}
                    <td className="py-2.5 pr-2">
                      <p className="font-sans text-xs text-ink leading-snug">{item.english}</p>
                    </td>
                    {/* Sigha */}
                    <td className="py-2.5 px-2 text-center">
                      <span dir="rtl" className="arabic text-xs text-ink-muted">{answer.sigha}</span>
                    </td>
                    {/* Active cell */}
                    <td className="py-2 px-1.5 text-center">
                      {activeState === 'correct' ? (
                        <span dir="rtl" className="arabic text-sm text-teal">{answer.active}</span>
                      ) : (
                        <button
                          onClick={() => openCell(ri, 'active')}
                          className={`inline-flex items-center justify-center w-[60px] h-8 rounded-lg text-[11px] font-sans font-medium transition-all ${
                            activeState === 'wrong'
                              ? 'bg-red-100 border border-red-300 text-red-600'
                              : 'bg-teal/10 border border-teal/25 text-teal hover:bg-teal/20'
                          }`}
                        >
                          {activeState === 'wrong' ? '✗' : 'Fill'}
                        </button>
                      )}
                    </td>
                    {/* Passive cell */}
                    <td className="py-2 px-1.5 text-center">
                      {passiveState === 'correct' ? (
                        <span dir="rtl" className="arabic text-sm text-gold-dark">{answer.passive}</span>
                      ) : (
                        <button
                          onClick={() => openCell(ri, 'passive')}
                          className={`inline-flex items-center justify-center w-[60px] h-8 rounded-lg text-[11px] font-sans font-medium transition-all ${
                            passiveState === 'wrong'
                              ? 'bg-red-100 border border-red-300 text-red-600'
                              : 'bg-gold/10 border border-gold/25 text-gold hover:bg-gold/20'
                          }`}
                        >
                          {passiveState === 'wrong' ? '✗' : 'Fill'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <button
            onClick={handleDone}
            disabled={done}
            className="w-full py-2.5 rounded-xl bg-teal text-parchment text-xs font-sans font-medium hover:bg-teal-dark transition-colors disabled:opacity-50"
          >
            Done ({correctCount}/{totalCells})
          </button>
        </div>
      </div>

      {/* MCQ cell picker overlay */}
      {activeCell && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setActiveCell(null)} />
          <div className="relative w-full bg-parchment rounded-t-2xl p-5 pb-8 shadow-xl">
            <p className="text-center text-xs font-sans text-ink-muted mb-1">{activeCell.label}</p>
            <p className="text-center text-xs font-sans text-ink-muted mb-4">
              صِيْغَة: <span dir="rtl" className="arabic text-sm text-ink">{activeCell.sigha}</span>
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {activeCell.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleCellAnswer(opt)}
                  className="py-3 px-2 rounded-xl border border-gold/20 bg-parchment-dark hover:bg-gold/8 text-center transition-colors active:scale-95"
                >
                  <span dir="rtl" className="arabic text-lg text-ink leading-relaxed">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </ExerciseSessionWrapper>
  );
}
