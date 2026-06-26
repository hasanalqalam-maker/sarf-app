'use client';

import { useCallback, useMemo, useState } from 'react';
import ExerciseSessionWrapper from './ExerciseSessionWrapper';
import type { Exercise, ExerciseItem, MCOption } from '@/lib/exerciseData';
import { buildOptions, TYPE_LABELS, shuffle } from '@/lib/exerciseData';
import { useProgress } from '@/lib/progressContext';

interface Props {
  exercise: Exercise;
  onComplete: (score: number, total: number) => void;
}

type AnswerState = 'idle' | 'correct' | 'wrong';

function correctFor(item: ExerciseItem, type: string): string | null {
  const a = item.answer as Record<string, string> | undefined;
  if (type === 'translate-arabic-to-english') return a?.english ?? null;
  if (type === 'translate-english-to-arabic') return a?.arabic ?? null;
  return null;
}

export default function GridTranslateSession({ exercise, onComplete }: Props) {
  const { recordAnswer } = useProgress();
  const isArabicToEnglish = exercise.exerciseType === 'translate-arabic-to-english';

  const scoreable = useMemo(() => exercise.items.filter(i => !i.unclear), [exercise.items]);
  const pendingReview = exercise.items.length - scoreable.length;

  const [focused, setFocused] = useState<number | null>(null);
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [chosen, setChosen] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const answered = Object.keys(results).length;
  const score = Object.values(results).filter(Boolean).length;

  const currentItem: ExerciseItem | undefined = focused !== null ? scoreable[focused] : undefined;

  const options: MCOption[] = useMemo(() => {
    if (!currentItem) return [];
    const correct = correctFor(currentItem, exercise.exerciseType);
    if (!correct) return [];
    return buildOptions(correct, scoreable, exercise.exerciseType);
  }, [currentItem, exercise, scoreable]);

  const correctText = useMemo(() => {
    if (!currentItem) return '';
    return correctFor(currentItem, exercise.exerciseType) ?? '';
  }, [currentItem, exercise.exerciseType]);

  function handleAnswer(text: string) {
    if (answerState !== 'idle' || focused === null) return;
    setChosen(text);
    const correct = text === correctText;
    setAnswerState(correct ? 'correct' : 'wrong');
    setResults(r => ({ ...r, [focused]: correct }));
    recordAnswer('unit1-exercise', exercise.id, exercise.exerciseType, currentItem?.arabic ?? '', correct);
  }

  function dismissFocused() {
    setFocused(null);
    setAnswerState('idle');
    setChosen(null);
    if (answered + 1 >= scoreable.length) {
      const finalScore = score + (answerState === 'correct' ? 1 : 0);
      setDone(true);
      onComplete(finalScore, scoreable.length);
    }
  }

  const reset = useCallback(() => {
    setFocused(null);
    setResults({});
    setAnswerState('idle');
    setChosen(null);
    setDone(false);
  }, []);

  const isRTL = (t: string) => /[؀-ۿ]/.test(t);
  const typeLabel = TYPE_LABELS[exercise.exerciseType] ?? exercise.exerciseType;
  const title = `Ex ${exercise.exerciseNumber} · ${typeLabel}`;

  return (
    <ExerciseSessionWrapper
      exerciseId={exercise.id}
      title={title}
      page={exercise.page}
      score={score}
      total={scoreable.length}
      completed={done}
      pendingReview={pendingReview}
      onRetry={reset}
    >
      {/* Focused item overlay */}
      {currentItem && focused !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center px-4 pb-6">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-parchment-darker">
            <p className="text-xs font-sans text-ink-muted mb-3 text-center">{focused + 1} of {scoreable.length}</p>

            {/* Prompt */}
            <div className="text-center mb-5">
              {isArabicToEnglish ? (
                <p dir="rtl" className="arabic text-4xl leading-[3.5rem] text-ink">{currentItem.arabic}</p>
              ) : (
                <p className="font-sans text-lg text-ink">{currentItem.english}</p>
              )}
            </div>

            {/* Options */}
            {answerState === 'idle' ? (
              <div className="grid grid-cols-1 gap-2">
                {options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt.text)}
                    className="px-4 py-3 rounded-[10px] border border-parchment-darker bg-white text-sm font-sans text-ink hover:border-gold/40 transition-colors text-left"
                  >
                    <span dir={isRTL(opt.text) ? 'rtl' : undefined} className={isRTL(opt.text) ? 'arabic text-base' : ''}>
                      {opt.text}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className={`rounded-xl px-4 py-3 text-sm font-sans flex items-start gap-2 ${answerState === 'correct' ? 'bg-[var(--color-secondary-light)] text-teal-dark' : 'bg-[var(--color-accent-light)] text-crimson-dark'}`}>
                  <span className="shrink-0 font-bold mt-0.5">{answerState === 'correct' ? '✓' : '✗'}</span>
                  <div>
                    <p className="font-semibold mb-0.5">{answerState === 'correct' ? 'Correct!' : 'Not quite.'}</p>
                    {answerState === 'wrong' && (
                      <p className="text-xs">
                        Answer:{' '}
                        <span dir={isRTL(correctText) ? 'rtl' : undefined} className={isRTL(correctText) ? 'arabic' : ''}>
                          {correctText}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={dismissFocused}
                  className="w-full py-3 rounded-[10px] bg-gold text-white font-sans font-medium text-sm transition-opacity hover:opacity-90"
                >
                  {answered + 1 >= scoreable.length ? 'See results' : 'Next →'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="px-4 py-6">
        {/* Instruction */}
        <div className="bg-[var(--color-secondary-light)] border-l-[3px] border-l-teal px-4 py-3 mb-5">
          <p className="text-xs font-sans text-teal-dark leading-relaxed">{exercise.instructionText}</p>
        </div>

        <p className="text-xs font-sans text-ink-muted mb-4">
          {answered} / {scoreable.length} answered
          {pendingReview > 0 && ` · ${pendingReview} skipped (unclear)`}
        </p>

        {/* Item grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {scoreable.map((item, idx) => {
            const res = results[idx];
            const isAnswered = res !== undefined;
            const isCorrect = res === true;

            return (
              <button
                key={item.number}
                onClick={() => {
                  if (isAnswered) return;
                  setFocused(idx);
                  setAnswerState('idle');
                  setChosen(null);
                }}
                disabled={isAnswered}
                className={`
                  relative p-3 rounded-xl border text-left transition-all
                  ${isAnswered
                    ? isCorrect
                      ? 'border-teal bg-[var(--color-secondary-light)] cursor-default'
                      : 'border-crimson/40 bg-[var(--color-accent-light)] cursor-default'
                    : 'border-parchment-darker bg-white hover:border-gold/40 cursor-pointer'
                  }
                `}
              >
                <span className="text-[10px] font-sans text-ink-muted block mb-1">#{item.number}</span>
                {isArabicToEnglish ? (
                  <span dir="rtl" className="arabic text-base leading-relaxed text-ink block">{item.arabic}</span>
                ) : (
                  <span className="text-xs font-sans text-ink block leading-snug">{item.english}</span>
                )}
                {isAnswered && (
                  <span className={`absolute top-2 right-2 text-xs font-bold ${isCorrect ? 'text-teal' : 'text-crimson'}`}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Finish button when all answered */}
        {answered >= scoreable.length && !done && (
          <button
            onClick={() => { setDone(true); onComplete(score, scoreable.length); }}
            className="w-full mt-6 py-3 rounded-[10px] bg-gold text-white font-sans font-medium text-sm transition-opacity hover:opacity-90"
          >
            See results
          </button>
        )}
      </div>
    </ExerciseSessionWrapper>
  );
}
