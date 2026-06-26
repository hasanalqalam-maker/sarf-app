'use client';

import { useCallback, useMemo, useState } from 'react';
import ExerciseSessionWrapper from './ExerciseSessionWrapper';
import type { Exercise, ExerciseItem } from '@/lib/exerciseData';
import { TYPE_LABELS, shuffle } from '@/lib/exerciseData';
import { useProgress } from '@/lib/progressContext';

interface Props {
  exercise: Exercise;
  onComplete: (score: number, total: number) => void;
}

type AnswerState = 'idle' | 'partial' | 'correct' | 'wrong';

const TENSE_OPTIONS = [
  { value: 'madi', ar: 'مَاضٍ', en: 'Past (māḍī)' },
  { value: 'mudari', ar: 'مُضَارِعٌ', en: 'Present/Future (muḍāriʿ)' },
];

const VOICE_OPTIONS = [
  { value: 'maloom', ar: 'مَعْلُوْمٌ', en: 'Active (maʿlūm)' },
  { value: 'majhool', ar: 'مَجْهُوْلٌ', en: 'Passive (majhūl)' },
];

export default function TenseVoiceSession({ exercise, onComplete }: Props) {
  const { recordAnswer } = useProgress();

  const scoreable = useMemo(() => exercise.items.filter(i => !i.unclear), [exercise.items]);
  const pendingReview = exercise.items.length - scoreable.length;

  const [index, setIndex] = useState(0);
  const [tenseChoice, setTenseChoice] = useState<string | null>(null);
  const [voiceChoice, setVoiceChoice] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const current: ExerciseItem | undefined = scoreable[index];

  const correctTense = current?.answer_tense ?? '';
  const correctVoice = current?.answer_voice ?? '';

  const bothCorrect = tenseChoice === correctTense && voiceChoice === correctVoice;
  const tenseCorrect = tenseChoice === correctTense;
  const voiceCorrect = voiceChoice === correctVoice;

  function handleSubmit() {
    if (!tenseChoice || !voiceChoice || submitted || !current) return;
    setSubmitted(true);
    const correct = bothCorrect;
    if (correct) setScore(s => s + 1);
    recordAnswer('unit1-exercise', exercise.id, 'identify-tense-voice', current.pattern ?? '', correct);
  }

  function advance() {
    const next = index + 1;
    if (next >= scoreable.length) {
      setDone(true);
      onComplete(score + (submitted && bothCorrect ? 1 : 0), scoreable.length);
    } else {
      setIndex(next);
      setTenseChoice(null);
      setVoiceChoice(null);
      setSubmitted(false);
    }
  }

  const reset = useCallback(() => {
    setIndex(0);
    setTenseChoice(null);
    setVoiceChoice(null);
    setSubmitted(false);
    setScore(0);
    setDone(false);
  }, []);

  if (!current) return null;

  const title = `Ex ${exercise.exerciseNumber} · ${TYPE_LABELS['identify-tense-voice']}`;
  const canSubmit = tenseChoice !== null && voiceChoice !== null && !submitted;

  function optionCls(selected: boolean, correctValue: string, chosenValue: string | null, isSubmitted: boolean): string {
    if (!isSubmitted) {
      return selected
        ? 'border-gold bg-[var(--color-primary-light)] text-gold'
        : 'border-parchment-darker bg-white text-ink hover:border-gold/30';
    }
    if (chosenValue === correctValue && selected) return 'border-teal bg-[var(--color-secondary-light)] text-teal-dark';
    if (selected && chosenValue !== correctValue) return 'border-crimson/40 bg-[var(--color-accent-light)] text-crimson-dark';
    if (chosenValue !== correctValue && !selected && correctValue === (TENSE_OPTIONS.find(o => o.value === correctValue) ? correctValue : correctValue))
      return 'border-teal/40 bg-teal/5 text-teal opacity-70';
    return 'border-parchment-darker bg-white text-ink-muted opacity-40';
  }

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
        </p>

        {/* Instruction card */}
        <div className="bg-[var(--color-secondary-light)] border-l-[3px] border-l-teal px-4 py-3 mb-5">
          <p className="text-xs font-sans text-teal-dark leading-relaxed">{exercise.instructionText}</p>
        </div>

        {/* Pattern */}
        <div className="flex-1 flex flex-col items-center justify-center mb-6 gap-3">
          <p dir="rtl" className="arabic text-5xl leading-[4.5rem] text-ink text-center tracking-wide">
            {current.pattern}
          </p>
          {current.sigha_note && (
            <p className="text-xs font-sans text-ink-muted text-center italic max-w-xs">{current.sigha_note}</p>
          )}
        </div>

        {/* Two questions side by side */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          {/* Tense */}
          <div>
            <p className="text-[11px] font-sans font-semibold text-ink-muted uppercase tracking-wide mb-2 text-center">
              Tense?
            </p>
            <div className="space-y-2">
              {TENSE_OPTIONS.map(opt => {
                const selected = tenseChoice === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => !submitted && setTenseChoice(opt.value)}
                    disabled={submitted}
                    className={`w-full px-3 py-2.5 rounded-xl border text-center transition-colors ${optionCls(selected, correctTense, tenseChoice, submitted)}`}
                  >
                    <span dir="rtl" className="arabic text-base block leading-relaxed">{opt.ar}</span>
                    <span className="text-[10px] font-sans block mt-0.5">{opt.en}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice */}
          <div>
            <p className="text-[11px] font-sans font-semibold text-ink-muted uppercase tracking-wide mb-2 text-center">
              Voice?
            </p>
            <div className="space-y-2">
              {VOICE_OPTIONS.map(opt => {
                const selected = voiceChoice === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => !submitted && setVoiceChoice(opt.value)}
                    disabled={submitted}
                    className={`w-full px-3 py-2.5 rounded-xl border text-center transition-colors ${optionCls(selected, correctVoice, voiceChoice, submitted)}`}
                  >
                    <span dir="rtl" className="arabic text-base block leading-relaxed">{opt.ar}</span>
                    <span className="text-[10px] font-sans block mt-0.5">{opt.en}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Feedback */}
        {submitted && (
          <div className={`rounded-xl px-4 py-3 mb-4 text-sm font-sans flex items-start gap-2 ${bothCorrect ? 'bg-[var(--color-secondary-light)] text-teal-dark' : 'bg-[var(--color-accent-light)] text-crimson-dark'}`}>
            <span className="shrink-0 font-bold mt-0.5">{bothCorrect ? '✓' : '✗'}</span>
            <div>
              <p className="font-semibold mb-0.5">{bothCorrect ? 'Correct!' : 'Not quite.'}</p>
              {!bothCorrect && (
                <p className="text-xs">
                  {!tenseCorrect && <>Tense: <span dir="rtl" className="arabic">{TENSE_OPTIONS.find(o => o.value === correctTense)?.ar}</span> · </>}
                  {!voiceCorrect && <>Voice: <span dir="rtl" className="arabic">{VOICE_OPTIONS.find(o => o.value === correctVoice)?.ar}</span></>}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Buttons */}
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3 rounded-[10px] bg-gold text-white font-sans font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Check
          </button>
        ) : (
          <button
            onClick={advance}
            className="w-full py-3 rounded-[10px] bg-gold text-white font-sans font-medium text-sm transition-opacity hover:opacity-90"
          >
            {index + 1 >= scoreable.length ? 'See results' : 'Next →'}
          </button>
        )}
      </div>
    </ExerciseSessionWrapper>
  );
}
