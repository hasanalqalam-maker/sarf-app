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

  const hasDictAnswers = !isTasrif && !!givenRow && givenWords.length === 0;
  const hasWordCols = !isTasrif && givenWords.length > 0;

  const verbKeys = useMemo(
    () => (hasDictAnswers && givenRow ? parseVerbKeys(givenRow) : []),
    [hasDictAnswers, givenRow],
  );

  const dictRows = useMemo(() => {
    if (!hasDictAnswers) return [];
    return (exercise.items ?? []).map(item => ({
      sigha: item.sigha ?? '',
      answers: (item.answer as Record<string, string>) ?? {},
    }));
  }, [hasDictAnswers, exercise.items]);

  const wordRows = useMemo(() => {
    if (!hasWordCols) return [];
    return (exercise.items ?? []).map(item => ({
      sigha: item.sigha ?? '',
      words: [item.word_1 ?? '', item.word_2 ?? '', item.word_3 ?? '', item.word_4 ?? ''],
    }));
  }, [hasWordCols, exercise.items]);

  const givenSigha = givenRow?.sigha ?? '';

  const totalCells = useMemo(() => {
    if (isTasrif) return (exercise.items?.length ?? 0) * 8;
    if (hasDictAnswers) return dictRows.length * verbKeys.length;
    if (hasWordCols) {
      const fillRows = wordRows.filter(r => r.sigha !== givenSigha);
      return fillRows.length * givenWords.length;
    }
    return 0;
  }, [isTasrif, hasDictAnswers, hasWordCols, dictRows, verbKeys, wordRows, givenSigha, givenWords, exercise.items]);

  const [cellStates, setCellStates] = useState<Record<string, 'correct' | 'wrong'>>({});
  const [hadWrong, setHadWrong] = useState<Set<string>>(new Set());
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [done, setDone] = useState(false);

  const correctCount = Object.values(cellStates).filter(s => s === 'correct').length;
  const firstAttemptScore = correctCount
    - Object.keys(cellStates).filter(k => cellStates[k] === 'correct' && hadWrong.has(k)).length;

  useEffect(() => {
    if (!done && totalCells > 0 && correctCount === totalCells) {
      setDone(true);
      onComplete(firstAttemptScore, totalCells);
    }
  }, [correctCount, totalCells, done, firstAttemptScore, onComplete]);

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

  function openTasrifCell(ri: number, colKey: string) {
    const key = `t|${ri}|${colKey}`;
    if (cellStates[key] === 'correct') return;
    const a = exercise.items?.[ri]?.answer as Record<string, string> | undefined;
    const correct = a?.[colKey];
    if (!correct) return;
    const others = (exercise.items ?? [])
      .filter((_, i) => i !== ri)
      .map(item => (item.answer as Record<string, string>)?.[colKey])
      .filter((v): v is string => !!v && v !== correct);
    const distractors = shuffle([...new Set(others)]).slice(0, 3);
    while (distractors.length < 3) distractors.push('—');
    setActiveCell({
      key,
      correct,
      options: shuffle([correct, ...distractors]),
      sigha: exercise.items?.[ri]?.masdar ?? '',
      verb: colKey,
    });
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
  const headerScore = correctCount;

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
        <div className="bg-[var(--color-secondary-light)] border-l-[3px] border-l-teal px-4 py-3 mb-5">
          <p className="text-xs font-sans text-teal-dark leading-relaxed">{exercise.instructionText}</p>
        </div>

        {exercise.pdfDiscrepancyNote && (
          <p className="text-[11px] font-sans text-gold italic mb-4 leading-relaxed">{exercise.pdfDiscrepancyNote}</p>
        )}

        {/* ── Variant A: givenRow + answer-dict ─────────────────────────── */}
        {hasDictAnswers && givenRow && (
          <div className="overflow-x-auto -mx-4">
            <div className="min-w-max mx-4 rounded-t-[8px] overflow-hidden border border-parchment-darker">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gold text-white">
                    <th className="py-2.5 px-3 text-left text-[10px] font-sans font-semibold uppercase tracking-wide text-white/80 min-w-[90px] sticky left-0 bg-gold z-10">
                      صِيْغَة
                    </th>
                    {verbKeys.map((vk, i) => (
                      <th key={i} className="py-2.5 px-2 text-center min-w-[72px]">
                        <span dir="rtl" className="arabic text-sm text-white">{vk}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Given row */}
                  <tr>
                    <td className="py-2.5 px-3 sticky left-0 z-10 font-medium border-b border-parchment-darker/40" style={{ background: 'var(--color-primary-light)' }}>
                      <span dir="rtl" className="arabic text-sm text-gold">{givenRow.sigha}</span>
                      <span className="ml-1.5 text-[9px] font-sans text-gold/60 uppercase tracking-wide">given</span>
                    </td>
                    {verbKeys.map((vk, i) => (
                      <td key={i} className="py-2.5 px-2 text-center border-b border-parchment-darker/40" style={{ background: 'var(--color-primary-light)' }}>
                        <span dir="rtl" className="arabic text-sm text-gold">{vk}</span>
                      </td>
                    ))}
                  </tr>
                  {/* Fill rows */}
                  {dictRows.map((row, ri) => {
                    const rowBg = ri % 2 === 0 ? '#ffffff' : '#F8F9FA';
                    return (
                      <tr key={ri} className="border-b border-parchment-darker/40 last:border-0">
                        <td className="py-2.5 px-3 sticky left-0 z-10 font-medium" style={{ background: rowBg }}>
                          <span dir="rtl" className="arabic text-sm text-ink">{row.sigha}</span>
                        </td>
                        {verbKeys.map((vk, ci) => {
                          const key = `d|${ri}|${vk}`;
                          const state = cellStates[key];
                          return (
                            <td key={ci} className="py-2 px-1.5 text-center" style={{ background: state === 'correct' ? 'var(--color-secondary-light)' : rowBg }}>
                              {state === 'correct' ? (
                                <span dir="rtl" className="arabic text-sm text-teal-dark">{row.answers[vk]}</span>
                              ) : (
                                <button
                                  onClick={() => openDictCell(ri, vk)}
                                  className={`inline-flex items-center justify-center w-[60px] h-8 rounded border border-dashed text-sm font-medium transition-all ${
                                    state === 'wrong'
                                      ? 'border-crimson/60 bg-[var(--color-accent-light)] text-crimson'
                                      : 'border-parchment-darker bg-white text-parchment-darker'
                                  }`}
                                >
                                  {state === 'wrong' ? '✗' : '—'}
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
          </div>
        )}

        {/* ── Variant B: given_words + word_X ────────────────────────────── */}
        {hasWordCols && (
          <div className="overflow-x-auto -mx-4">
            <div className="min-w-max mx-4 rounded-t-[8px] overflow-hidden border border-parchment-darker">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gold text-white">
                    <th className="py-2.5 px-3 text-left text-[10px] font-sans font-semibold uppercase tracking-wide text-white/80 min-w-[90px] sticky left-0 bg-gold z-10">
                      صِيْغَة
                    </th>
                    {givenWords.map((w, i) => (
                      <th key={i} className="py-2.5 px-2 text-center min-w-[72px]">
                        <span dir="rtl" className="arabic text-sm text-white">{w}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {wordRows.map((row, ri) => {
                    const isGiven = row.sigha === givenSigha;
                    const fillRows = wordRows.filter(r => r.sigha !== givenSigha);
                    const fillRowIdx = fillRows.indexOf(row);
                    const rowBg = isGiven ? 'var(--color-primary-light)' : (ri % 2 === 0 ? '#ffffff' : '#F8F9FA');
                    return (
                      <tr key={ri} className="border-b border-parchment-darker/40 last:border-0">
                        <td className="py-2.5 px-3 sticky left-0 z-10 font-medium" style={{ background: rowBg }}>
                          <span dir="rtl" className="arabic text-sm" style={{ color: isGiven ? 'var(--color-primary)' : 'var(--color-text)' }}>{row.sigha}</span>
                          {isGiven && (
                            <span className="ml-1.5 text-[9px] font-sans text-gold/60 uppercase tracking-wide">given</span>
                          )}
                        </td>
                        {row.words.map((w, ci) => {
                          if (isGiven) {
                            return (
                              <td key={ci} className="py-2.5 px-2 text-center" style={{ background: rowBg }}>
                                <span dir="rtl" className="arabic text-sm text-gold">{w}</span>
                              </td>
                            );
                          }
                          const key = `w|${fillRowIdx}|${ci}`;
                          const state = cellStates[key];
                          return (
                            <td key={ci} className="py-2 px-1.5 text-center" style={{ background: state === 'correct' ? 'var(--color-secondary-light)' : rowBg }}>
                              {state === 'correct' ? (
                                <span dir="rtl" className="arabic text-sm text-teal-dark">{w}</span>
                              ) : (
                                <button
                                  onClick={() => openWordCell(fillRowIdx, ci)}
                                  className={`inline-flex items-center justify-center w-[60px] h-8 rounded border border-dashed text-sm font-medium transition-all ${
                                    state === 'wrong'
                                      ? 'border-crimson/60 bg-[var(--color-accent-light)] text-crimson'
                                      : 'border-parchment-darker bg-white text-parchment-darker'
                                  }`}
                                >
                                  {state === 'wrong' ? '✗' : '—'}
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
                <div key={ri} className="bg-white border border-parchment-darker rounded-xl p-4">
                  <p className="text-[11px] font-sans font-semibold text-gold uppercase tracking-wide mb-3">
                    مَصْدَر: <span dir="rtl" className="arabic text-sm text-ink">{item.masdar ?? ''}</span>
                    {item.bab && (
                      <span className="ml-2 text-ink-muted font-normal normal-case tracking-normal">({item.bab})</span>
                    )}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {cols.map(({ key, label }) => {
                      const cellKey = `t|${ri}|${key}`;
                      const state = cellStates[cellKey];
                      const val = a?.[key] ?? '';
                      return (
                        <div key={key} className="flex flex-col gap-1">
                          <span className="text-[9px] font-sans text-ink-muted">{label}</span>
                          {state === 'correct' ? (
                            <span dir="rtl" className="arabic text-sm text-teal-dark">{val || '—'}</span>
                          ) : (
                            <button
                              onClick={() => openTasrifCell(ri, key)}
                              className={`flex items-center justify-center h-8 rounded border border-dashed text-sm font-medium transition-all ${
                                state === 'wrong'
                                  ? 'border-crimson/60 bg-[var(--color-accent-light)] text-crimson'
                                  : 'border-parchment-darker bg-white text-parchment-darker'
                              }`}
                            >
                              {state === 'wrong' ? '✗' : '—'}
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
        <div className="mt-6">
          <button
            onClick={handleDone}
            disabled={done}
            className="w-full py-2.5 rounded-xl bg-gold text-white text-xs font-sans font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            Done ({correctCount}/{totalCells})
          </button>
        </div>
      </div>

      {/* ── MCQ cell picker overlay ──────────────────────────────────────────── */}
      {activeCell && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setActiveCell(null)} />
          <div className="relative w-full bg-white rounded-t-2xl border-t border-parchment-darker p-5 pb-8 shadow-xl">
            {activeCell.key.startsWith('t|') ? (
              <p className="text-center text-xs font-sans text-ink-muted mb-4">
                {({'madiMaloom':'مَاضِي مَعْلُوم','mudariMaloom':'مُضَارِع مَعْلُوم','madiMajhool':'مَاضِي مَجْهُوْل','mudariMajhool':'مُضَارِع مَجْهُوْل','amr':'أَمْر','nahy':'نَهْي','ismFail':'اسْم الْفَاعِل','ismMafool':'اسْم الْمَفْعُوْل'} as Record<string,string>)[activeCell.verb] ?? activeCell.verb}
                {' '}of{' '}
                <span dir="rtl" className="arabic text-base text-ink">{activeCell.sigha}</span>?
              </p>
            ) : (
              <>
                <p className="text-center text-xs font-sans text-ink-muted mb-1">
                  What is the form of
                </p>
                <p className="text-center mb-4">
                  <span dir="rtl" className="arabic text-base text-ink">{activeCell.verb}</span>
                  <span className="mx-2 text-gold font-sans">for</span>
                  <span dir="rtl" className="arabic text-base text-ink">{activeCell.sigha}</span>
                  <span className="text-gold font-sans">?</span>
                </p>
              </>
            )}
            <div className="grid grid-cols-2 gap-2.5">
              {activeCell.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleCellAnswer(opt)}
                  className="py-3 px-2 rounded-[10px] border border-parchment-darker bg-white hover:bg-parchment-dark text-center transition-colors active:scale-95"
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
