'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import ExerciseSessionWrapper from './ExerciseSessionWrapper';
import type { Exercise } from '@/lib/exerciseData';
import { TYPE_LABELS, buildOptions, shuffle } from '@/lib/exerciseData';
import { useProgress } from '@/lib/progressContext';

interface Props {
  exercise: Exercise;
  onComplete: (score: number, total: number) => void;
}

// ── leniency check (same as TranslateArabicSession) ───────────────────────────

function isTranslationCorrect(student: string, model: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[()\/\-,;!?'"]/g, ' ').replace(/\s+/g, ' ').trim();

  const s = norm(student);
  if (!s || s.length < 2) return false;

  const alternatives = model.split('/').map(a => norm(a.trim()));
  const stopWords = new Set([
    'he', 'she', 'it', 'they', 'you', 'we', 'i', 'him', 'her', 'them',
    'a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'and', 'or', 'but',
    'not', 'no', 'all', 'both', 'two', 'one', 'did', 'will', 'would',
    'm', 'f', 's', 'p', 'd', 'pl',
  ]);

  for (const m of alternatives) {
    if (s === m) return true;
    const modelWords = m.split(' ').filter(w => w.length > 1 && !stopWords.has(w));
    if (modelWords.length === 0 && s.length > 1) return true;
    const modelIsPassive = ['was', 'were'].some(w => m.split(' ').includes(w));
    if (modelIsPassive && !['was', 'were'].some(w => s.split(' ').includes(w))) continue;
    if (modelWords.some(w => s.includes(w))) return true;
  }
  return false;
}

// ── main component ────────────────────────────────────────────────────────────

type Step = 'negate' | 'translate';

export default function NegateTranslateSession({ exercise, onComplete }: Props) {
  const { recordAnswer } = useProgress();
  const inputRef = useRef<HTMLInputElement>(null);

  const scoreable = useMemo(() => exercise.items.filter(i => !i.unclear), [exercise.items]);
  const pendingReview = exercise.items.length - scoreable.length;

  // Score: 1 per negation + 1 per translation = total items × 2
  const total = scoreable.length * 2;

  const [index, setIndex] = useState(0);
  const [step, setStep] = useState<Step>('negate');
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  // Negate MCQ state
  const [mcqChosen, setMcqChosen] = useState<string | null>(null);
  const [mcqAnswered, setMcqAnswered] = useState(false);
  const [negateCorrect, setNegateCorrect] = useState(false);

  // Translation state
  const [typedAnswer, setTypedAnswer] = useState('');
  const [translationChecked, setTranslationChecked] = useState(false);
  const [translationCorrect, setTranslationCorrect] = useState(false);

  const current = scoreable[index];
  const answer = current ? (current.answer as Record<string, string>) : null;
  const correctNegated = answer?.negated ?? '';
  const modelEnglish = answer?.english ?? '';

  // MCQ options for negation step
  const negateOptions = useMemo(() => {
    if (!current) return [];
    return buildOptions(correctNegated, scoreable, exercise.exerciseType);
  }, [current, correctNegated, scoreable, exercise.exerciseType]);

  function handleNegateAnswer(text: string) {
    if (mcqAnswered) return;
    setMcqChosen(text);
    setMcqAnswered(true);
    const isCorrect = text === correctNegated;
    setNegateCorrect(isCorrect);
    if (isCorrect) setScore(s => s + 1);
    recordAnswer('unit1-exercise', exercise.id, exercise.exerciseType, correctNegated, isCorrect);
  }

  function advanceToTranslation() {
    setStep('translate');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function handleCheckTranslation() {
    if (!typedAnswer.trim() || translationChecked) return;
    const isCorrect = isTranslationCorrect(typedAnswer, modelEnglish);
    setTranslationCorrect(isCorrect);
    setTranslationChecked(true);
    if (isCorrect) setScore(s => s + 1);
    recordAnswer('unit1-exercise', exercise.id, 'negate-and-translate-translation', modelEnglish, isCorrect);
  }

  function advance() {
    const next = index + 1;
    if (next >= scoreable.length) {
      setDone(true);
      onComplete(score, total);
    } else {
      setIndex(next);
      setStep('negate');
      setMcqChosen(null);
      setMcqAnswered(false);
      setNegateCorrect(false);
      setTypedAnswer('');
      setTranslationChecked(false);
      setTranslationCorrect(false);
    }
  }

  const reset = useCallback(() => {
    setIndex(0);
    setStep('negate');
    setScore(0);
    setDone(false);
    setMcqChosen(null);
    setMcqAnswered(false);
    setNegateCorrect(false);
    setTypedAnswer('');
    setTranslationChecked(false);
    setTranslationCorrect(false);
  }, []);

  if (!current) return null;

  const title = `Ex ${exercise.exerciseNumber} · ${TYPE_LABELS[exercise.exerciseType] ?? exercise.exerciseType}`;
  const itemNum = index + 1;

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

        {/* Counter */}
        <p className="text-center text-xs font-sans text-ink-muted mb-3">
          {itemNum} of {scoreable.length}
          <span className="ml-2 text-gold">· {step === 'negate' ? 'Negate' : 'Translate'}</span>
        </p>

        {/* Instruction */}
        <div className="bg-ink/5 rounded-xl px-4 py-3 mb-5">
          <p className="text-xs font-sans text-ink-muted leading-relaxed">{exercise.instructionText}</p>
        </div>

        {/* Arabic prompt */}
        <div className="flex-1 flex flex-col items-center justify-center mb-6 gap-2">
          <p dir="rtl" className="arabic text-5xl leading-[4.5rem] text-ink text-center">
            {current.arabic ?? ''}
          </p>
          {step === 'translate' && negateCorrect && (
            <p dir="rtl" className="arabic text-2xl text-teal text-center">{correctNegated}</p>
          )}
          {step === 'translate' && !negateCorrect && (
            <p className="text-xs font-sans text-ink-muted text-center">
              Negated form: <span dir="rtl" className="arabic text-sm text-ink ml-1">{correctNegated}</span>
            </p>
          )}
        </div>

        {/* ── Negate step ──────────────────────────────────────────────────── */}
        {step === 'negate' && (
          <>
            <p className="text-center text-[11px] font-sans text-ink-muted uppercase tracking-wide mb-3">
              Which is the negated form?
            </p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {negateOptions.map((opt, i) => {
                const isChosen = mcqChosen === opt.text;
                let cls = 'border-gold/20 bg-parchment-dark text-ink';
                if (mcqAnswered) {
                  if (opt.correct) cls = 'border-teal bg-teal/10 text-teal';
                  else if (isChosen) cls = 'border-red-400 bg-red-50 text-red-700';
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleNegateAnswer(opt.text)}
                    disabled={mcqAnswered}
                    className={`px-3 py-3 rounded-xl border text-sm transition-colors text-center ${cls}`}
                  >
                    <span dir="rtl" className="arabic text-base leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {mcqAnswered && (
              <>
                {!negateCorrect && (
                  <div className="rounded-xl px-4 py-3 mb-3 bg-red-50 text-red-700 text-xs font-sans">
                    Answer: <span dir="rtl" className="arabic text-sm ml-1">{correctNegated}</span>
                  </div>
                )}
                <button
                  onClick={advanceToTranslation}
                  className="w-full py-3 rounded-xl bg-ink text-parchment font-sans font-medium text-sm hover:bg-ink-light transition-colors"
                >
                  Translate →
                </button>
              </>
            )}
          </>
        )}

        {/* ── Translate step ────────────────────────────────────────────────── */}
        {step === 'translate' && (
          <>
            <p className="text-center text-[11px] font-sans text-ink-muted uppercase tracking-wide mb-3">
              Now translate into English
            </p>
            <div className="mb-3">
              <input
                ref={inputRef}
                type="text"
                value={typedAnswer}
                onChange={e => !translationChecked && setTypedAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !translationChecked && handleCheckTranslation()}
                placeholder="Type your English translation…"
                className="w-full px-4 py-3 rounded-xl border border-gold/30 bg-parchment-dark font-sans text-sm text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-teal/50 transition-colors"
                disabled={translationChecked}
                autoFocus
              />
            </div>

            {translationChecked && (
              <div className={`rounded-xl px-4 py-3 mb-3 text-sm font-sans ${translationCorrect ? 'bg-teal/10 text-teal-dark' : 'bg-red-50 text-red-700'}`}>
                <p className="font-semibold mb-1">{translationCorrect ? 'Correct!' : 'Not quite.'}</p>
                <p className="text-xs">Model answer: <span className="font-medium">{modelEnglish}</span></p>
              </div>
            )}

            {!translationChecked ? (
              <button
                onClick={handleCheckTranslation}
                disabled={!typedAnswer.trim()}
                className="w-full py-3 rounded-xl bg-ink text-parchment font-sans font-medium text-sm hover:bg-ink-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Check
              </button>
            ) : (
              <button
                onClick={advance}
                className="w-full py-3 rounded-xl bg-ink text-parchment font-sans font-medium text-sm hover:bg-ink-light transition-colors"
              >
                {index + 1 >= scoreable.length ? 'See results' : 'Next →'}
              </button>
            )}
          </>
        )}
      </div>
    </ExerciseSessionWrapper>
  );
}
