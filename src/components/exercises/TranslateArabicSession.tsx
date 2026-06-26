'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import ExerciseSessionWrapper from './ExerciseSessionWrapper';
import type { Exercise, ExerciseItem } from '@/lib/exerciseData';
import { TYPE_LABELS, shuffle } from '@/lib/exerciseData';
import { useProgress } from '@/lib/progressContext';

interface Props {
  exercise: Exercise;
  onComplete: (score: number, total: number) => void;
}

// ── leniency check ────────────────────────────────────────────────────────────

function isTranslationCorrect(student: string, model: string): boolean {
  const norm = (s: string) =>
    s.toLowerCase().replace(/[()\/\-,;!?'"]/g, ' ').replace(/\s+/g, ' ').trim();

  const s = norm(student);
  if (!s || s.length < 2) return false;

  const alternatives = model.split('/').map(a => norm(a.trim()));

  const stopWords = new Set([
    'he', 'she', 'it', 'they', 'you', 'we', 'i', 'him', 'her', 'them',
    'a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'and', 'or', 'but',
    'not', 'no', 'all', 'both', 'two', 'one', 'did', 'will', 'would', 'shall',
    'm', 'f', 's', 'p', 'd', 'pl',
  ]);

  for (const m of alternatives) {
    if (s === m) return true;

    const modelWords = m.split(' ').filter(w => w.length > 1 && !stopWords.has(w));
    if (modelWords.length === 0) {
      if (s.length > 1) return true;
      continue;
    }

    const modelIsPassive = ['was', 'were'].some(w => m.split(' ').includes(w));
    if (modelIsPassive) {
      const studentHasPassive = ['was', 'were'].some(w => s.split(' ').includes(w));
      if (!studentHasPassive) continue;
    }

    if (modelWords.some(w => s.includes(w))) return true;
  }

  return false;
}

// ── strip Arabic diacritics ───────────────────────────────────────────────────

function stripDiacritics(s: string): string {
  return s.replace(/[ً-ٰٟ]/g, '');
}

// ── MCQ option builders ───────────────────────────────────────────────────────

function buildSighaOptions(correct: string, items: ExerciseItem[]): { text: string; correct: boolean }[] {
  const pool = items
    .filter(i => !i.unclear)
    .map(i => (i.answer as Record<string, string>)?.sigha)
    .filter((s): s is string => !!s && s !== correct);
  const unique = [...new Set(pool)];
  const distractors = shuffle(unique).slice(0, 3);
  while (distractors.length < 3) distractors.push('—');
  return shuffle([{ text: correct, correct: true }, ...distractors.map(d => ({ text: d, correct: false }))]);
}

function buildDameerOptions(correct: string, items: ExerciseItem[]): { text: string; correct: boolean }[] {
  const pool = items
    .filter(i => !i.unclear)
    .map(i => (i.answer as Record<string, string>)?.dameer)
    .filter((d): d is string => !!d && d !== correct);
  const unique = [...new Set(pool)];
  const distractors = shuffle(unique).slice(0, 3);
  while (distractors.length < 3) distractors.push('—');
  return shuffle([{ text: correct, correct: true }, ...distractors.map(d => ({ text: d, correct: false }))]);
}

function buildVerbTypeOptions(correct: string, items: ExerciseItem[]): { text: string; correct: boolean }[] {
  const pool = items
    .filter(i => !i.unclear)
    .map(i => (i.answer as Record<string, string>)?.verbType)
    .filter((v): v is string => !!v && v !== correct);
  const unique = [...new Set(pool)];
  const distractors = shuffle(unique).slice(0, 3);
  while (distractors.length < 3) distractors.push('—');
  return shuffle([{ text: correct, correct: true }, ...distractors.map(d => ({ text: d, correct: false }))]);
}

// ── step type ─────────────────────────────────────────────────────────────────

type Step = 'translation' | 'sigha' | 'dameer' | 'verbType';

// ── main component ────────────────────────────────────────────────────────────

export default function TranslateArabicSession({ exercise, onComplete }: Props) {
  const { recordAnswer } = useProgress();
  const inputRef = useRef<HTMLInputElement>(null);

  const scoreable = useMemo(() => exercise.items.filter(i => !i.unclear), [exercise.items]);
  const pendingReview = exercise.items.length - scoreable.length;

  const instructionStripped = useMemo(
    () => stripDiacritics(exercise.instructionText ?? ''),
    [exercise.instructionText],
  );

  const hasSigha = useMemo(
    () => instructionStripped.includes('صيغة') && scoreable.some(i => !!(i.answer as Record<string, string>)?.sigha),
    [instructionStripped, scoreable],
  );
  const hasDameer = useMemo(
    () => instructionStripped.includes('ضمير') && scoreable.some(i => !!(i.answer as Record<string, string>)?.dameer),
    [instructionStripped, scoreable],
  );
  const hasVerbType = useMemo(
    () => scoreable.some(i => !!(i.answer as Record<string, string>)?.verbType),
    [scoreable],
  );

  const steps: Step[] = useMemo(() => {
    const s: Step[] = ['translation'];
    if (hasSigha) s.push('sigha');
    if (hasDameer) s.push('dameer');
    if (hasVerbType) s.push('verbType');
    return s;
  }, [hasSigha, hasDameer, hasVerbType]);

  const stepsPerItem = steps.length;
  const total = scoreable.length * stepsPerItem;

  const [index, setIndex] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const [typedAnswer, setTypedAnswer] = useState('');
  const [translationChecked, setTranslationChecked] = useState(false);
  const [translationCorrect, setTranslationCorrect] = useState(false);

  const [mcqChosen, setMcqChosen] = useState<string | null>(null);
  const [mcqAnswered, setMcqAnswered] = useState(false);

  const current = scoreable[index];
  const currentStep = steps[stepIdx];

  const answer = current ? (current.answer as Record<string, string>) : null;
  const modelEnglish = answer?.english ?? '';
  const modelSigha = answer?.sigha ?? '';
  const modelDameer = answer?.dameer ?? '';
  const modelVerbType = answer?.verbType ?? '';

  const mcqOptions = useMemo(() => {
    if (!current || currentStep === 'translation') return [];
    if (currentStep === 'sigha') return buildSighaOptions(modelSigha, scoreable);
    if (currentStep === 'dameer') return buildDameerOptions(modelDameer, scoreable);
    if (currentStep === 'verbType') return buildVerbTypeOptions(modelVerbType, scoreable);
    return [];
  }, [current, currentStep, modelSigha, modelDameer, modelVerbType, scoreable]);

  const mcqCorrectText =
    currentStep === 'sigha' ? modelSigha :
    currentStep === 'dameer' ? modelDameer :
    modelVerbType;

  function handleCheckTranslation() {
    if (!typedAnswer.trim() || translationChecked) return;
    const isCorrect = isTranslationCorrect(typedAnswer, modelEnglish);
    setTranslationCorrect(isCorrect);
    setTranslationChecked(true);
    if (isCorrect) setScore(s => s + 1);
    recordAnswer('unit1-exercise', exercise.id, exercise.exerciseType, current.arabic ?? '', isCorrect);
  }

  function handleMcqAnswer(text: string) {
    if (mcqAnswered) return;
    setMcqChosen(text);
    setMcqAnswered(true);
    const isCorrect = text === mcqCorrectText;
    if (isCorrect) setScore(s => s + 1);
    recordAnswer('unit1-exercise', exercise.id, exercise.exerciseType, mcqCorrectText, isCorrect);
  }

  function advance() {
    const nextStepIdx = stepIdx + 1;
    if (nextStepIdx < steps.length) {
      setStepIdx(nextStepIdx);
      setMcqChosen(null);
      setMcqAnswered(false);
      return;
    }
    const nextIndex = index + 1;
    if (nextIndex >= scoreable.length) {
      setDone(true);
      onComplete(score, total);
    } else {
      setIndex(nextIndex);
      setStepIdx(0);
      setTypedAnswer('');
      setTranslationChecked(false);
      setTranslationCorrect(false);
      setMcqChosen(null);
      setMcqAnswered(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  const reset = useCallback(() => {
    setIndex(0);
    setStepIdx(0);
    setScore(0);
    setDone(false);
    setTypedAnswer('');
    setTranslationChecked(false);
    setTranslationCorrect(false);
    setMcqChosen(null);
    setMcqAnswered(false);
  }, []);

  if (!current) return null;

  const title = `Ex ${exercise.exerciseNumber} · ${TYPE_LABELS[exercise.exerciseType] ?? exercise.exerciseType}`;

  const stepLabel =
    currentStep === 'translation' ? 'Translate'
    : currentStep === 'sigha' ? 'Write the sīgha'
    : currentStep === 'dameer' ? 'Identify the ḍamīr'
    : 'What type of verb is this?';

  const itemProgress = index * stepsPerItem + stepIdx + 1;

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
          {index + 1} of {scoreable.length}
          {stepsPerItem > 1 && (
            <span className="ml-2 text-gold">· {stepLabel}</span>
          )}
        </p>

        {/* Instruction */}
        <div className="bg-[var(--color-secondary-light)] border-l-[3px] border-l-teal px-4 py-3 mb-5">
          <p className="text-xs font-sans text-teal-dark leading-relaxed">{exercise.instructionText}</p>
        </div>

        {/* Arabic prompt card */}
        <div className="flex-1 flex items-center justify-center mb-6">
          <div className="w-full bg-white border border-parchment-darker rounded-xl px-6 py-8 text-center">
            <p dir="rtl" className="arabic text-ink text-center" style={{ fontSize: '38px', lineHeight: '3.5rem' }}>
              {current.arabic ?? current.pattern ?? ''}
            </p>
            {current.note && (
              <p className="text-xs font-sans text-gold/80 italic text-center mt-3 max-w-xs mx-auto">{current.note}</p>
            )}
          </div>
        </div>

        {/* ── Translation step ─────────────────────────────────────────────── */}
        {currentStep === 'translation' && (
          <>
            <div className="mb-3">
              <input
                ref={inputRef}
                type="text"
                value={typedAnswer}
                onChange={e => !translationChecked && setTypedAnswer(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !translationChecked && handleCheckTranslation()}
                placeholder="Type your English translation…"
                className="w-full px-4 py-3 rounded-[10px] border border-parchment-darker bg-white font-sans text-[15px] text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-gold transition-colors"
                disabled={translationChecked}
                autoFocus
              />
            </div>

            {translationChecked && (
              <div className={`rounded-xl px-4 py-3 mb-3 text-sm font-sans flex items-start gap-2 ${translationCorrect ? 'bg-[var(--color-secondary-light)] text-teal-dark' : 'bg-[var(--color-accent-light)] text-crimson-dark'}`}>
                <span className="shrink-0 font-bold mt-0.5">{translationCorrect ? '✓' : '✗'}</span>
                <div>
                  <p className="font-semibold mb-0.5">{translationCorrect ? 'Correct!' : 'Not quite.'}</p>
                  <p className="text-xs leading-relaxed">
                    Model answer: <span className="font-medium">{modelEnglish}</span>
                  </p>
                </div>
              </div>
            )}

            {!translationChecked ? (
              <button
                onClick={handleCheckTranslation}
                disabled={!typedAnswer.trim()}
                className="w-full py-3 rounded-[10px] bg-gold text-white font-sans font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Check
              </button>
            ) : (
              <button
                onClick={advance}
                className="w-full py-3 rounded-[10px] bg-gold text-white font-sans font-medium text-sm transition-opacity hover:opacity-90"
              >
                {itemProgress >= total ? 'See results' : 'Next →'}
              </button>
            )}
          </>
        )}

        {/* ── MCQ step (sigha / dameer / verbType) ─────────────────────────── */}
        {(currentStep === 'sigha' || currentStep === 'dameer' || currentStep === 'verbType') && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {mcqOptions.map((opt, i) => {
                const isChosen = mcqChosen === opt.text;
                const isCorrect = opt.correct;
                let cls = 'border-parchment-darker bg-white text-ink';
                if (mcqAnswered) {
                  if (isCorrect) cls = 'border-teal bg-[var(--color-secondary-light)] text-teal-dark';
                  else if (isChosen) cls = 'border-crimson/40 bg-[var(--color-accent-light)] text-crimson-dark';
                  else cls = 'border-parchment-darker bg-white text-ink opacity-40';
                }
                const isArabic = /[؀-ۿ]/.test(opt.text);
                return (
                  <button
                    key={i}
                    onClick={() => handleMcqAnswer(opt.text)}
                    disabled={mcqAnswered}
                    className={`px-3 py-3 rounded-[10px] border font-sans text-sm transition-colors text-center ${cls}`}
                  >
                    <span
                      dir={isArabic ? 'rtl' : undefined}
                      className={isArabic ? 'arabic text-base leading-relaxed' : ''}
                    >
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {mcqAnswered && (
              <>
                {mcqChosen !== mcqCorrectText && (
                  <div className="rounded-xl px-4 py-3 mb-3 text-sm font-sans bg-[var(--color-accent-light)] text-crimson-dark flex items-center gap-2">
                    <span className="font-bold">✗</span>
                    <p className="text-xs">
                      Correct: <span dir="rtl" className="arabic">{mcqCorrectText}</span>
                    </p>
                  </div>
                )}
                <button
                  onClick={advance}
                  className="w-full py-3 rounded-[10px] bg-gold text-white font-sans font-medium text-sm transition-opacity hover:opacity-90"
                >
                  {itemProgress >= total ? 'See results' : 'Next →'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </ExerciseSessionWrapper>
  );
}
