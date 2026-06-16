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
  verb: string;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function parseVerbKeys(givenRow: Record<string, string>): string[] {
  return ['verb1', 'verb2', 'verb3', 'verb4', 'verb5']
    .map(k => givenRow[k])
    .filter((v): v is string => !!v);
}

// ── main component ────────────────────────────────────────────────────────────

export default function ExFillTableSession({ exercise, onComplete }: Props) {
  const { recordAnswer } = useProgress();

  const isTasrif = exercise.exerciseType === 'fill-tasrif-saghir';
  const givenRow = exercise.givenRow as Record<string, string> | undefined;
  const givenWords = exercise.given_words ?? [];

  // Variant A: givenRow + item.answer dict (most fill-table exercises)
  const hasDictAnswers = !isTasrif && !!givenRow && givenWords.length === 0;
  // Variant B: given_words + item.word_1/2/3/4 (u1-p8-ex4 ism-mafool)
  const hasWordCols = !isTasrif && givenWords.length > 0;

  // Columns for variant A
  const verbKeys = useMemo(
    () => (hasDictAnswers && givenRow ? parseVerbKeys(givenRow) : []),
    [hasDictAnswers, givenRow],
  );

  // Rows for variant A: {sigha, answers}
  const dictRows = useMemo(() => {
    if (!hasDictAnswers) return [];
    return (exercise.items ?? []).map(item => ({
      sigha: item.sigha ?? '',
      answers: (item.answer as Record<string, string>) ?? {},
    }));
  }, [hasDictAnswers, exercise.items]);

  // Rows for variant B: {sigha, words[]}
  const wordRows = useMemo(() => {
    if (!hasWordCols) return [];
    return (exercise.items ?? []).map(item => ({
      sigha: item.sigha ?? '',
      words: [item.word_1 ?? '', item.word_2 ?? '', item.word_3 ?? '', item.word_4 ?? ''],
    }));
  }, [hasWordCols, exercise.items]);

  // Given sigha label for variant B
  const givenSigha = givenRow?.sigha ?? '';

  // Total empty cells
  const totalCells = useMemo(() => {
    if (isTasrif) return (exercise.items?.length ?? 0) * 8;
    if (hasDictAnswers) return dictRows.length * verbKeys.length;
    if (hasWordCols) {
      const fillRows = wordRows.filter(r => r.sigha !== givenSigha);
      return fillRows.length * givenWords.length;
    }
    return 0;
  }, [isTasrif, hasDictAnswers, hasWordCols, dictRows, verbKeys, wordRows, givenSigha, givenWords, exercise.items]);

  // ── cell state ─────────────────────────────────────────────────────────────
  const [cellStates, setCellStates] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [hadWrong, setHadWrong] = useState<Set<string>>(new Set());
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [done, setDone] = useState(false);

  // fill-tasrif-saghir reveal state
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [manualReveals, setManualReveals] = useState(0);

  const correctCount = Object.values(cellStates).filter(s => s === 'correct').length;
  const firstAttemptScore = correctCount
    - Object.keys(cellStates).filter(k => cellStates[k] === 'correct' && hadWrong.has(k)).length;

  // Auto-complete fill-table when all cells filled correctly
  useEffect(() => {
    if (!isTasrif && !done && totalCells > 0 && correctCount === totalCells) {
      setDone(true);
      onComplete(firstAttemptScore, totalCells);
    }
  }, [correctCount, totalCells, done, isTasrif, firstAttemptScore, onComplete]);

  // ── open MCQ picker ────────────────────────────────────────────────────────

  function openDictCell(ri: number, vk: string) {
    if (cellStates[`d|${ri}|${vk}`] === 'correct') return;
    const correct = dictRows[ri].answers[vk];
    if (!correct) return;
    const others = dictRows
      .filter((_, i) => i !== ri)
      .map(r => r.answers[vk])
      .filter((v): v is string => !!v && v !== correct);
    const distractors = shuffle([...new Set(others)]).slice(0, 3);
    while (distractors.length < 3) distractors.push('—');
    setActiveCell({
      key: `d|${ri}|${vk}`,
      correct,
      options: shuffle([correct, ...distractors]),
      sigha: dictRows[ri].sigha,
      verb: vk,
    });
  }

  function openWordCell(fillRowIdx: number, colIdx: number) {
    const key = `w|${fillRowIdx}|${colIdx}`;
    if (cellStates[key] === 'correct') return;
    const fillRows = wordRows.filter(r => r.sigha !== givenSigha);
    const correct = fillRows[fillRowIdx]?.words[colIdx];
    if (!correct) return;
    const others = fillRows
      .filter((_, i) => i !== fillRowIdx)
      .map(r => r.words[colIdx])
      .filter((v): v is string => !!v && v !== correct);
    const distractors = shuffle([...new Set(others)]).slice(0, 3);
    while (distractors.length < 3) distractors.push('—');
    setActiveCell({
      key,
      correct,
      options: shuffle([correct, ...distractors]),
      sigha: fillRows[fillRowIdx].sigha,
      verb: givenWords[colIdx] ?? '',
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
    if (isTasrif) {
      const score = Math.round((manualReveals / Math.max(totalCells, 1)) * 100);
      onComplete(score, 100);
    } else {
      onComplete(firstAttemptScore, totalCells);
    }
  }

  // tasrif helpers
  function toggleTasrifCell(key: string) {
    if (revealed.has(key)) return;
    setRevealed(r => new Set([...r, key]));
    setManualReveals(c => c + 1);
  }

  function revealAllTasrif() {
    const allKeys: string[] = [];
    exercise.items?.forEach((_, ri) => {
      ['madiMaloom', 'mudariMaloom', 'madiMajhool', 'mudariMajhool', 'amr', 'nahy', 'ismFail', 'ismMafool'].forEach(
        col => allKeys.push(`${ri}|${col}`),
      );
    });
    setRevealed(new Set(allKeys));
  }

  const reset = useCallback(() => {
    setCellStates({});
    setHadWrong(new Set());
    setActiveCell(null);
    setRevealed(new Set());
    setManualReveals(0);
    setDone(false);
  }, []);

  const title = `Ex ${exercise.exerciseNumber} · ${TYPE_LABELS[exercise.exerciseType] ?? exercise.exerciseType}`;
  const headerScore = isTasrif ? revealed.size : correctCount;

  return (
    <ExerciseSessionWrapper
      exerciseId={exercise.id}
      title={title}
      page={exercise.page}
      score={headerScore}
      total={totalCells}
      completed={done}
      pendingReview={0}
      onRetry={reset}
    >
      <div className="px-4 py-6">
        {/* Instruction */}
        <div className="bg-ink/5 rounded-xl px-4 py-3 mb-5">
          <p className="text-xs font-sans text-ink-muted leading-relaxed">{exercise.instructionText}</p>
        </div>

        {exercise.pdfDiscrepancyNote && (
          <p className="text-[11px] font-sans text-gold italic mb-4 leading-relaxed">{exercise.pdfDiscrepancyNote}</p>
        )}

        {/* ── Variant A: givenRow + answer-dict ─────────────────────────── */}
        {hasDictAnswers && givenRow && (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-max border-collapse">
              <thead>
                <tr className="border-b border-gold/20">
                  <th className="pb-2 text-left text-[10px] font-sans font-semibold text-ink-muted uppercase tracking-wide pr-3 min-w-[90px]">
                    صِيْغَة
                  </th>
                  {verbKeys.map((vk, i) => (
                    <th key={i} className="pb-2 text-center px-2 min-w-[72px]">
                      <span dir="rtl" className="arabic text-sm text-ink">{vk}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Given row */}
                <tr className="border-b border-teal/20 bg-teal/8">
                  <td className="py-2.5 pr-3">
                    <span dir="rtl" className="arabic text-sm text-teal">{givenRow.sigha}</span>
                    <span className="ml-1.5 text-[9px] font-sans text-teal/60 uppercase tracking-wide">given</span>
                  </td>
                  {verbKeys.map((vk, i) => (
                    <td key={i} className="py-2.5 px-2 text-center">
                      <span dir="rtl" className="arabic text-sm text-teal">{vk}</span>
                    </td>
                  ))}
                </tr>
                {/* Fill rows */}
                {dictRows.map((row, ri) => (
                  <tr key={ri} className="border-b border-gold/10 last:border-0">
                    <td className="py-2.5 pr-3">
                      <span dir="rtl" className="arabic text-sm text-ink">{row.sigha}</span>
                    </td>
                    {verbKeys.map((vk, ci) => {
                      const key = `d|${ri}|${vk}`;
                      const state = cellStates[key];
                      return (
                        <td key={ci} className="py-2 px-1.5 text-center">
                          {state === 'correct' ? (
                            <span dir="rtl" className="arabic text-sm text-teal">{row.answers[vk]}</span>
                          ) : (
                            <button
                              onClick={() => openDictCell(ri, vk)}
                              className={`inline-flex items-center justify-center w-[60px] h-8 rounded-lg text-[11px] font-sans font-medium transition-all ${
                                state === 'wrong'
                                  ? 'bg-red-100 border border-red-300 text-red-600'
                                  : 'bg-teal/10 border border-teal/25 text-teal hover:bg-teal/20'
                              }`}
                            >
                              {state === 'wrong' ? '✗' : 'Fill'}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Variant B: given_words + word_X ────────────────────────────── */}
        {hasWordCols && (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-max border-collapse">
              <thead>
                <tr className="border-b border-gold/20">
                  <th className="pb-2 text-left text-[10px] font-sans font-semibold text-ink-muted uppercase tracking-wide pr-3 min-w-[90px]">
                    صِيْغَة
                  </th>
                  {givenWords.map((w, i) => (
                    <th key={i} className="pb-2 text-center px-2 min-w-[72px]">
                      <span dir="rtl" className="arabic text-sm text-ink">{w}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {wordRows.map((row, ri) => {
                  const isGiven = row.sigha === givenSigha;
                  const fillRows = wordRows.filter(r => r.sigha !== givenSigha);
                  const fillRowIdx = fillRows.indexOf(row);
                  return (
                    <tr key={ri} className={`border-b border-gold/10 last:border-0 ${isGiven ? 'bg-teal/8 border-teal/20' : ''}`}>
                      <td className="py-2.5 pr-3">
                        <span dir="rtl" className="arabic text-sm text-ink">{row.sigha}</span>
                        {isGiven && (
                          <span className="ml-1.5 text-[9px] font-sans text-teal/60 uppercase tracking-wide">given</span>
                        )}
                      </td>
                      {row.words.map((w, ci) => {
                        if (isGiven) {
                          return (
                            <td key={ci} className="py-2.5 px-2 text-center">
                              <span dir="rtl" className="arabic text-sm text-teal">{w}</span>
                            </td>
                          );
                        }
                        const key = `w|${fillRowIdx}|${ci}`;
                        const state = cellStates[key];
                        return (
                          <td key={ci} className="py-2 px-1.5 text-center">
                            {state === 'correct' ? (
                              <span dir="rtl" className="arabic text-sm text-teal">{w}</span>
                            ) : (
                              <button
                                onClick={() => openWordCell(fillRowIdx, ci)}
                                className={`inline-flex items-center justify-center w-[60px] h-8 rounded-lg text-[11px] font-sans font-medium transition-all ${
                                  state === 'wrong'
                                    ? 'bg-red-100 border border-red-300 text-red-600'
                                    : 'bg-teal/10 border border-teal/25 text-teal hover:bg-teal/20'
                                }`}
                              >
                                {state === 'wrong' ? '✗' : 'Fill'}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── fill-tasrif-saghir ─────────────────────────────────────────── */}
        {isTasrif && (
          <div className="space-y-6">
            {(exercise.items ?? []).map((item, ri) => {
              const a = item.answer as Record<string, string> | undefined;
              const cols = [
                { key: 'madiMaloom',    label: 'مَاضِي مَعْلُوم' },
                { key: 'mudariMaloom',  label: 'مُضَارِع مَعْلُوم' },
                { key: 'madiMajhool',   label: 'مَاضِي مَجْهُوْل' },
                { key: 'mudariMajhool', label: 'مُضَارِع مَجْهُوْل' },
                { key: 'amr',           label: 'أَمْر' },
                { key: 'nahy',          label: 'نَهْي' },
                { key: 'ismFail',       label: 'اسْم الْفَاعِل' },
                { key: 'ismMafool',     label: 'اسْم الْمَفْعُوْل' },
              ];
              return (
                <div key={ri} className="card-parchment p-4">
                  <p className="text-[11px] font-sans font-semibold text-gold uppercase tracking-wide mb-3">
                    مَصْدَر: <span dir="rtl" className="arabic text-sm text-ink">{item.masdar ?? ''}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {cols.map(({ key, label }) => {
                      const cellKey = `${ri}|${key}`;
                      const isRev = revealed.has(cellKey);
                      const val = a?.[key] ?? '';
                      return (
                        <div key={key} className="flex flex-col gap-1">
                          <span className="text-[9px] font-sans text-ink-muted">{label}</span>
                          {isRev ? (
                            <span dir="rtl" className="arabic text-sm text-ink">{val || '—'}</span>
                          ) : (
                            <button
                              onClick={() => toggleTasrifCell(cellKey)}
                              className="flex items-center justify-center h-8 rounded-lg bg-teal/15 border border-teal/30 text-teal text-[10px] font-sans font-medium hover:bg-teal/25 transition-colors"
                            >
                              Reveal
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Footer ────────────────────────────────────────────────────────── */}
        <div className="flex gap-2 mt-6">
          {isTasrif && (
            <button
              onClick={revealAllTasrif}
              className="flex-1 py-2.5 rounded-xl border border-gold/30 text-xs font-sans font-medium text-ink-muted hover:bg-gold/5 transition-colors"
            >
              Reveal all
            </button>
          )}
          <button
            onClick={handleDone}
            disabled={!isTasrif && done}
            className="flex-1 py-2.5 rounded-xl bg-teal text-parchment text-xs font-sans font-medium hover:bg-teal-dark transition-colors disabled:opacity-50"
          >
            {isTasrif
              ? `Done (${revealed.size}/${totalCells})`
              : `Done (${correctCount}/${totalCells})`}
          </button>
        </div>
      </div>

      {/* ── MCQ cell picker overlay ──────────────────────────────────────────── */}
      {activeCell && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setActiveCell(null)} />
          <div className="relative w-full bg-parchment rounded-t-2xl p-5 pb-8 shadow-xl">
            <p className="text-center text-xs font-sans text-ink-muted mb-1">
              What is the form of
            </p>
            <p className="text-center mb-4">
              <span dir="rtl" className="arabic text-base text-ink">{activeCell.verb}</span>
              <span className="mx-2 text-gold font-sans">for</span>
              <span dir="rtl" className="arabic text-base text-ink">{activeCell.sigha}</span>
              <span className="text-gold font-sans">?</span>
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
