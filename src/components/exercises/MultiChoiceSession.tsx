'use client';

import { useCallback, useMemo, useState } from 'react';
import ExerciseSessionWrapper from './ExerciseSessionWrapper';
import type { Exercise, ExerciseItem, MCOption } from '@/lib/exerciseData';
import { buildOptions, SIGHA_NAMES_AR, BAB_OPTIONS, IRAB_OPTIONS, TYPE_LABELS, shuffle } from '@/lib/exerciseData';
import { useProgress } from '@/lib/progressContext';

interface Props {
  exercise: Exercise;
  onComplete: (score: number, total: number) => void;
}

function correctFor(item: ExerciseItem, type: string): string | null {
  const a = item.answer as Record<string, unknown> | unknown[] | undefined;
  if (!a) return null;
  switch (type) {
    case 'identify-sigha':
    case 'identify-sigha-and-irab':
      return (a as Record<string, string>).sigha ?? null;
    case 'change-gender':
    case 'change-tense': {
      if (Array.isArray(a)) return (a[0] as Record<string, string>).arabic ?? null;
      return (a as Record<string, string>).arabic ?? null;
    }
    case 'negate-and-translate':
      return (a as Record<string, string>).negated ?? null;
    case 'negate-with-particle':
      return (a as Record<string, string>).negated ?? null;
    case 'active-passive-table':
      return (a as Record<string, string>).passive ?? null;
    default:
      return null;
  }
}

function irabFor(item: ExerciseItem): string | null {
  const a = item.answer as Record<string, string> | undefined;
  return a?.irab ?? null;
}

function englishFor(item: ExerciseItem): string | null {
  const a = item.answer as Record<string, string> | undefined;
  return a?.english ?? null;
}

function babOptions(correct: string): MCOption[] {
  const correctBab = BAB_OPTIONS.find(b => b.code === correct || b.pattern === correct || b.madi === correct);
  if (!correctBab) return [];
  const correctText = `${correctBab.madi} ${correctBab.mudari}`;
  const distractors = shuffle(BAB_OPTIONS.filter(b => b.code !== correctBab.code))
    .slice(0, 3)
    .map(b => ({ text: `${b.madi} ${b.mudari}`, correct: false }));
  return shuffle([{ text: correctText, correct: true }, ...distractors]);
}

function sighaOptions(correct: string): MCOption[] {
  const pool = SIGHA_NAMES_AR.filter(s => s !== correct);
  return shuffle([
    { text: correct, correct: true },
    ...shuffle(pool).slice(0, 3).map(s => ({ text: s, correct: false })),
  ]);
}

function irabOptions(correct: string): MCOption[] {
  const pool = IRAB_OPTIONS.filter(o => o.ar !== correct);
  return shuffle([
    { text: correct, correct: true },
    ...shuffle(pool).slice(0, 3).map(o => ({ text: o.ar, correct: false })),
  ]);
}

function englishPronounOptions(correct: string, items: ExerciseItem[]): MCOption[] {
  const pool = items
    .filter(i => !i.unclear)
    .map(i => englishFor(i))
    .filter((e): e is string => !!e && e !== correct);
  const unique = [...new Set(pool)];
  const distractors = shuffle(unique).slice(0, 3);
  while (distractors.length < 3) distractors.push('?');
  return shuffle([{ text: correct, correct: true }, ...distractors.map(d => ({ text: d, correct: false }))]);
}

type AnswerState = 'idle' | 'correct' | 'wrong';
type Step = 'sigha' | 'irab' | 'english' | 'done';

export default function MultiChoiceSession({ exercise, onComplete }: Props) {
  const { recordAnswer } = useProgress();

  const scoreable = useMemo(
    () => exercise.items.filter(i => !i.unclear),
    [exercise.items],
  );
  const pendingReview = exercise.items.length - scoreable.length;

  const isSighaType = exercise.exerciseType === 'identify-sigha';
  const isIrabType = exercise.exerciseType === 'identify-sigha-and-irab';

  // identify-sigha: 2 scored steps per item (sigha + english pronoun)
  const total = isSighaType ? scoreable.length * 2 : scoreable.length;

  // Worked example intro for identify-sigha exercises
  const hasWorkedExample = isSighaType && !!(exercise.instructionText ?? '').includes('One has been done for you');
  const [showIntro, setShowIntro] = useState(hasWorkedExample);

  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>('sigha');
  const [score, setScore] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [chosen, setChosen] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const current: ExerciseItem | undefined = scoreable[index];

  const options: MCOption[] = useMemo(() => {
    if (!current) return [];
    const type = exercise.exerciseType;

    if (isIrabType) {
      if (step === 'sigha') {
        const correct = (current.answer as Record<string, string>)?.sigha;
        return correct ? sighaOptions(correct) : [];
      }
      const correct = (current.answer as Record<string, string>)?.irab ?? 'مَرْفُوْع';
      return irabOptions(correct);
    }

    if (isSighaType) {
      if (step === 'sigha') {
        const correct = (current.answer as Record<string, string>)?.sigha;
        return correct ? sighaOptions(correct) : [];
      }
      if (step === 'english') {
        const correct = englishFor(current);
        return correct ? englishPronounOptions(correct, scoreable) : [];
      }
      return [];
    }

    if (type === 'identify-bab') {
      const possibleBabs: string[] = (current.answer as Record<string, string[]>)?.possibleBabs ?? [];
      if (possibleBabs.length === 0) return [];
      const correctBabs = possibleBabs.map(code => {
        const b = BAB_OPTIONS.find(x => x.code === code);
        return b ? `${b.madi} ${b.mudari}` : code;
      });
      const correctText = correctBabs[0];
      const distractors = shuffle(BAB_OPTIONS.filter(b => !possibleBabs.includes(b.code)))
        .slice(0, 3)
        .map(b => ({ text: `${b.madi} ${b.mudari}`, correct: false }));
      return shuffle([{ text: correctText, correct: true }, ...distractors]);
    }

    const correct = correctFor(current, type);
    if (!correct) return [];
    return buildOptions(correct, scoreable, exercise.exerciseType);
  }, [current, exercise, step, scoreable, isIrabType, isSighaType]);

  const correctText: string = useMemo(() => {
    if (!current) return '';
    const type = exercise.exerciseType;
    if (isIrabType) {
      if (step === 'sigha') return (current.answer as Record<string, string>)?.sigha ?? '';
      return (current.answer as Record<string, string>)?.irab ?? 'مَرْفُوْع';
    }
    if (isSighaType) {
      if (step === 'sigha') return (current.answer as Record<string, string>)?.sigha ?? '';
      if (step === 'english') return englishFor(current) ?? '';
      return '';
    }
    if (type === 'identify-bab') {
      const possibleBabs: string[] = (current.answer as Record<string, string[]>)?.possibleBabs ?? [];
      const b = BAB_OPTIONS.find(x => x.code === possibleBabs[0]);
      return b ? `${b.madi} ${b.mudari}` : possibleBabs[0] ?? '';
    }
    return correctFor(current, type) ?? '';
  }, [current, exercise.exerciseType, step, isIrabType, isSighaType]);

  const prompt = useMemo(() => {
    if (!current) return '';
    if (isIrabType && step === 'irab') return current.arabic ?? current.pattern ?? '';
    return current.arabic ?? current.pattern ?? current.masdar ?? '';
  }, [current, isIrabType, step]);

  const englishPrompt = useMemo(() => {
    if (!current) return null;
    const a = current.answer as Record<string, unknown> | undefined;
    if (exercise.exerciseType === 'negate-with-particle') {
      return `Add (${current.particle}) and adjust iʿrāb`;
    }
    if (exercise.exerciseType === 'fill-tasrif-saghir') return current.masdar ?? null;
    if (isIrabType && step === 'irab') {
      return `صِيْغَة: ${(a as Record<string, string>)?.sigha ?? ''}`;
    }
    return null;
  }, [current, exercise.exerciseType, step, isIrabType]);

  const stepLabel = useMemo(() => {
    if (isSighaType) {
      return step === 'sigha' ? 'Name the sīgha' : 'English pronoun';
    }
    if (!isIrabType) return null;
    return step === 'sigha' ? 'Name the sīgha' : 'What is its grammatical state?';
  }, [exercise.exerciseType, step, isSighaType, isIrabType]);

  function handleAnswer(text: string) {
    if (answerState !== 'idle' || !current) return;
    setChosen(text);

    let correct = false;
    if (exercise.exerciseType === 'identify-bab') {
      const possibleBabs: string[] = (current.answer as Record<string, string[]>)?.possibleBabs ?? [];
      const chosen_codes = BAB_OPTIONS
        .filter(b => `${b.madi} ${b.mudari}` === text)
        .map(b => b.code);
      correct = chosen_codes.some(c => possibleBabs.includes(c));
    } else {
      correct = text === correctText;
    }

    setAnswerState(correct ? 'correct' : 'wrong');

    if (isSighaType) {
      if (correct) setScore(s => s + 1);
      recordAnswer('unit1-exercise', exercise.id, exercise.exerciseType, current.arabic ?? current.pattern ?? '', correct);
    } else if (isIrabType) {
      if (step === 'irab') {
        if (correct) setScore(s => s + 1);
        recordAnswer('unit1-exercise', exercise.id, exercise.exerciseType, current.arabic ?? current.pattern ?? '', correct);
      }
    } else {
      if (correct) setScore(s => s + 1);
      recordAnswer('unit1-exercise', exercise.id, exercise.exerciseType, current.arabic ?? current.pattern ?? '', correct);
    }
  }

  function advance() {
    if (isSighaType) {
      if (step === 'sigha') {
        setStep('english');
        setAnswerState('idle');
        setChosen(null);
        return;
      }
    } else if (isIrabType) {
      if (step === 'sigha' && answerState === 'correct' && current) {
        const hasIrab = !!(current.answer as Record<string, string>)?.irab;
        if (hasIrab) {
          setStep('irab');
          setAnswerState('idle');
          setChosen(null);
          return;
        }
      }
      if (step === 'sigha' && answerState === 'wrong') {
        recordAnswer('unit1-exercise', exercise.id, exercise.exerciseType, current?.arabic ?? '', false);
      }
    }

    const next = index + 1;
    if (next >= scoreable.length) {
      setDone(true);
      onComplete(score, total);
    } else {
      setIndex(next);
      setStep('sigha');
      setAnswerState('idle');
      setChosen(null);
    }
  }

  const reset = useCallback(() => {
    setIndex(0);
    setStep('sigha');
    setScore(0);
    setAnswerState('idle');
    setChosen(null);
    setDone(false);
    if (hasWorkedExample) setShowIntro(true);
  }, [hasWorkedExample]);

  const isRTL = (text: string) => /[؀-ۿ]/.test(text);

  if (!current) return null;

  const typeLabel = TYPE_LABELS[exercise.exerciseType] ?? exercise.exerciseType;
  const title = `Ex ${exercise.exerciseNumber} · ${typeLabel}`;

  return (
    <ExerciseSessionWrapper
      exerciseId={exercise.id}
      title={title}
      page={exercise.page}
      score={score}
      total={total}
      completed={done}
      pendingReview={pendingReview}
      onRetry={reset}
    >
      <div className="flex flex-col min-h-full px-4 py-6">

        {/* ── Worked example intro ─────────────────────────────────────────── */}
        {showIntro && (
          <div className="flex flex-col min-h-full justify-between">
            <div>
              <div className="bg-[var(--color-secondary-light)] border-l-[3px] border-l-teal px-4 py-3 mb-5">
                <p className="text-xs font-sans text-teal-dark leading-relaxed">{exercise.instructionText}</p>
              </div>
              <div className="bg-teal/10 border border-teal/30 rounded-xl px-4 py-4 mb-4">
                <p className="text-[11px] font-sans font-semibold text-teal uppercase tracking-wide mb-2">
                  Worked Example
                </p>
                <p className="text-xs font-sans text-ink leading-relaxed">{exercise.note}</p>
              </div>
            </div>
            <button
              onClick={() => setShowIntro(false)}
              className="w-full py-3 rounded-[10px] bg-gold text-white font-sans font-medium text-sm transition-opacity hover:opacity-90"
            >
              Got it — start the exercise →
            </button>
          </div>
        )}

        {/* ── Main MCQ ─────────────────────────────────────────────────────── */}
        {!showIntro && (
          <>
            {/* Counter */}
            <p className="text-center text-xs font-sans text-ink-muted mb-3">
              {index + 1} of {scoreable.length}
              {stepLabel && <span className="ml-2 text-gold">· {stepLabel}</span>}
            </p>

            {/* Instruction card */}
            <div className="bg-[var(--color-secondary-light)] border-l-[3px] border-l-teal px-4 py-3 mb-5">
              <p className="text-xs font-sans text-teal-dark leading-relaxed">{exercise.instructionText}</p>
            </div>

            {/* Prompt */}
            <div className="flex-1 flex flex-col items-center justify-center mb-6 gap-2">
              {prompt && (
                <p dir="rtl" className="arabic text-5xl leading-[4rem] text-ink text-center">
                  {prompt}
                </p>
              )}
              {englishPrompt && (
                <p className="text-sm font-sans text-ink-muted text-center mt-1">{englishPrompt}</p>
              )}
              {current.note && !englishPrompt && (
                <p className="text-xs font-sans text-gold/80 text-center italic max-w-xs">{current.note}</p>
              )}
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {options.map((opt, i) => {
                const isChosen = chosen === opt.text;
                const isCorrect = opt.correct;
                let cls = 'border-parchment-darker bg-white text-ink';
                if (answerState !== 'idle') {
                  if (isCorrect) cls = 'border-teal bg-[var(--color-secondary-light)] text-teal-dark';
                  else if (isChosen && !isCorrect) cls = 'border-crimson/40 bg-[var(--color-accent-light)] text-crimson-dark';
                  else cls = 'border-parchment-darker bg-white text-ink opacity-40';
                }
                const arabic = isRTL(opt.text);
                return (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt.text)}
                    disabled={answerState !== 'idle'}
                    className={`px-3 py-3 rounded-[10px] border font-sans text-sm transition-colors text-center ${cls}`}
                  >
                    <span
                      dir={arabic ? 'rtl' : undefined}
                      className={arabic ? 'arabic text-base leading-relaxed' : ''}
                    >
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {answerState !== 'idle' && (
              <div className={`rounded-xl px-4 py-3 mb-4 text-sm font-sans flex items-start gap-2 ${answerState === 'correct' ? 'bg-[var(--color-secondary-light)] text-teal-dark' : 'bg-[var(--color-accent-light)] text-crimson-dark'}`}>
                <span className="shrink-0 font-bold mt-0.5">{answerState === 'correct' ? '✓' : '✗'}</span>
                <div>
                  <p className="font-semibold mb-0.5">{answerState === 'correct' ? 'Correct!' : 'Not quite.'}</p>
                  {answerState === 'wrong' && (
                    <p className="text-xs leading-relaxed">
                      Correct answer: <span dir="rtl" className="arabic">{correctText}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {answerState !== 'idle' && (
              <button
                onClick={advance}
                className="w-full py-3 rounded-[10px] bg-gold text-white font-sans font-medium text-sm transition-opacity hover:opacity-90"
              >
                {isSighaType && step === 'sigha'
                  ? 'English pronoun →'
                  : index + 1 >= scoreable.length
                    ? 'See results'
                    : 'Next →'}
              </button>
            )}
          </>
        )}
      </div>
    </ExerciseSessionWrapper>
  );
}
