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

// Return the correct answer text for an item given an exercise type
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
    case 'fill-tasrif-saghir':
      return (a as Record<string, unknown>).madiMaloom as string ?? null;
    default:
      return null;
  }
}

// Irab secondary question for identify-sigha-and-irab
function irabFor(item: ExerciseItem): string | null {
  const a = item.answer as Record<string, string> | undefined;
  return a?.irab ?? null;
}

// Build 4-option MCQ for bāb identification
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

type AnswerState = 'idle' | 'correct' | 'wrong';

// For identify-sigha-and-irab we ask sigha then irab as two steps
type Step = 'sigha' | 'irab' | 'done';

export default function MultiChoiceSession({ exercise, onComplete }: Props) {
  const { recordAnswer } = useProgress();

  const scoreable = useMemo(
    () => exercise.items.filter(i => !i.unclear),
    [exercise.items],
  );
  const pendingReview = exercise.items.length - scoreable.length;

  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>('sigha'); // for irab exercises
  const [score, setScore] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [chosen, setChosen] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const current: ExerciseItem | undefined = scoreable[index];

  // Build options for current item / step
  const options: MCOption[] = useMemo(() => {
    if (!current) return [];
    const type = exercise.exerciseType;

    if (type === 'identify-sigha-and-irab') {
      if (step === 'sigha') {
        const correct = (current.answer as Record<string, string>)?.sigha;
        return correct ? sighaOptions(correct) : [];
      }
      const correct = (current.answer as Record<string, string>)?.irab ?? 'مَرْفُوْع';
      return irabOptions(correct);
    }

    if (type === 'identify-sigha') {
      const correct = (current.answer as Record<string, string>)?.sigha;
      return correct ? sighaOptions(correct) : [];
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
  }, [current, exercise, step, scoreable]);

  // Correct text for current step
  const correctText: string = useMemo(() => {
    if (!current) return '';
    const type = exercise.exerciseType;
    if (type === 'identify-sigha-and-irab') {
      if (step === 'sigha') return (current.answer as Record<string, string>)?.sigha ?? '';
      return (current.answer as Record<string, string>)?.irab ?? 'مَرْفُوْع';
    }
    if (type === 'identify-bab') {
      const possibleBabs: string[] = (current.answer as Record<string, string[]>)?.possibleBabs ?? [];
      const b = BAB_OPTIONS.find(x => x.code === possibleBabs[0]);
      return b ? `${b.madi} ${b.mudari}` : possibleBabs[0] ?? '';
    }
    return correctFor(current, type) ?? '';
  }, [current, exercise.exerciseType, step]);

  // Question prompt (what to show in the Arabic card)
  const prompt = useMemo(() => {
    if (!current) return '';
    if (exercise.exerciseType === 'identify-sigha-and-irab' && step === 'irab') {
      // Show the form again
      return current.arabic ?? current.pattern ?? '';
    }
    if (exercise.exerciseType === 'translate-english-to-arabic') return null; // handled in grid
    return current.arabic ?? current.pattern ?? current.masdar ?? '';
  }, [current, exercise.exerciseType, step]);

  const englishPrompt = useMemo(() => {
    if (!current) return null;
    const a = current.answer as Record<string, unknown> | undefined;
    if (exercise.exerciseType === 'negate-with-particle') {
      return `Add (${current.particle}) and adjust iʿrāb`;
    }
    if (exercise.exerciseType === 'fill-tasrif-saghir') return current.masdar ?? null;
    if (exercise.exerciseType === 'identify-sigha-and-irab' && step === 'irab') {
      return `صِيْغَة: ${(a as Record<string, string>)?.sigha ?? ''}`;
    }
    return null;
  }, [current, exercise.exerciseType, step]);

  // Step label
  const stepLabel = useMemo(() => {
    if (exercise.exerciseType !== 'identify-sigha-and-irab') return null;
    return step === 'sigha' ? 'Name the sīgha' : 'What is its grammatical state?';
  }, [exercise.exerciseType, step]);

  function handleAnswer(text: string) {
    if (answerState !== 'idle' || !current) return;
    setChosen(text);

    const isIrabType = exercise.exerciseType === 'identify-sigha-and-irab';

    // For identify-bab, any of the possibleBabs counts as correct
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

    // Record progress if it's the final step
    if (!isIrabType || step === 'irab') {
      if (correct) setScore(s => s + 1);
      recordAnswer('unit1-exercise', exercise.id, exercise.exerciseType, current.arabic ?? current.pattern ?? '', correct);
    }
  }

  function advance() {
    const type = exercise.exerciseType;
    const isIrabType = type === 'identify-sigha-and-irab';

    // For irab exercises: correct on sigha step → move to irab step
    if (isIrabType && step === 'sigha' && answerState === 'correct' && current) {
      const hasIrab = !!(current.answer as Record<string, string>)?.irab;
      if (hasIrab) {
        setStep('irab');
        setAnswerState('idle');
        setChosen(null);
        return;
      }
    }

    // Wrong on sigha step for irab: skip irab, don't count
    if (isIrabType && step === 'sigha' && answerState === 'wrong') {
      // count as wrong already handled above (nothing recorded yet)
      recordAnswer('unit1-exercise', exercise.id, exercise.exerciseType, current?.arabic ?? '', false);
    }

    // Move to next item
    const next = index + 1;
    if (next >= scoreable.length) {
      setDone(true);
      onComplete(score + (answerState === 'correct' && (!isIrabType || step === 'irab') ? 1 : 0), scoreable.length);
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
  }, []);

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
      total={scoreable.length}
      completed={done}
      pendingReview={pendingReview}
      onRetry={reset}
    >
      <div className="flex flex-col min-h-full px-4 py-6">

        {/* Counter */}
        <p className="text-center text-xs font-sans text-ink-muted mb-3">
          {index + 1} of {scoreable.length}
          {stepLabel && <span className="ml-2 text-gold">· {stepLabel}</span>}
        </p>

        {/* Instruction card */}
        <div className="bg-ink/5 rounded-xl px-4 py-3 mb-5">
          <p className="text-xs font-sans text-ink-muted leading-relaxed">{exercise.instructionText}</p>
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
            let cls = 'border-gold/20 bg-parchment-dark text-ink';
            if (answerState !== 'idle') {
              if (isCorrect) cls = 'border-teal bg-teal/10 text-teal';
              else if (isChosen && !isCorrect) cls = 'border-red-400 bg-red-50 text-red-700';
            }
            const arabic = isRTL(opt.text);
            return (
              <button
                key={i}
                onClick={() => handleAnswer(opt.text)}
                disabled={answerState !== 'idle'}
                className={`px-3 py-3 rounded-xl border font-sans text-sm transition-colors text-center ${cls}`}
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
          <div className={`rounded-xl px-4 py-3 mb-4 text-sm font-sans ${answerState === 'correct' ? 'bg-teal/10 text-teal-dark' : 'bg-red-50 text-red-700'}`}>
            <p className="font-semibold mb-1">{answerState === 'correct' ? 'Correct!' : 'Not quite.'}</p>
            <p className="text-xs leading-relaxed">
              {answerState === 'wrong' && (
                <>Correct answer: <span dir="rtl" className="arabic">{correctText}</span></>
              )}
            </p>
          </div>
        )}

        {answerState !== 'idle' && (
          <button
            onClick={advance}
            className="w-full py-3 rounded-xl bg-ink text-parchment font-sans font-medium text-sm hover:bg-ink-light transition-colors"
          >
            {index + 1 >= scoreable.length ? 'See results' : 'Next →'}
          </button>
        )}
      </div>
    </ExerciseSessionWrapper>
  );
}
