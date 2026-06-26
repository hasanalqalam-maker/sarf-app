'use client';

import { useCallback, useEffect, useState } from 'react';
import GameSessionWrapper from './GameSessionWrapper';
import { generateNameSighaQuestions } from '@/lib/gameData';
import type { GameConfig, NameSighaQuestion } from '@/lib/gameData';
import { useProgress } from '@/lib/progressContext';

interface Props {
  config: GameConfig;
  onComplete: (score: number, total: number) => void;
}

type AnswerState = 'idle' | 'correct' | 'wrong';

export default function NameThatSigha({ config, onComplete }: Props) {
  const { recordAnswer } = useProgress();
  const [questions, setQuestions] = useState<NameSighaQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const reset = useCallback(() => {
    const qs = generateNameSighaQuestions(config, 8);
    setQuestions(qs);
    setIndex(0);
    setScore(0);
    setAnswerState('idle');
    setChosenId(null);
    setDone(false);
  }, [config]);

  useEffect(() => { reset(); }, [reset]);

  const current = questions[index];

  function handleAnswer(sighaId: string) {
    if (answerState !== 'idle' || !current) return;
    setChosenId(sighaId);
    const correct = sighaId === current.correctSighaId;
    setAnswerState(correct ? 'correct' : 'wrong');
    if (correct) setScore((s) => s + 1);
    recordAnswer(current.babId, current.correctSighaId, current.paradigm, current.form, correct);
  }

  function advance() {
    if (index + 1 >= questions.length) {
      const finalScore = answerState === 'correct' ? score : score;
      setDone(true);
      onComplete(finalScore, questions.length);
    } else {
      setIndex((i) => i + 1);
      setAnswerState('idle');
      setChosenId(null);
    }
  }

  function handleRetry() {
    reset();
  }

  if (questions.length === 0) {
    return <div className="p-8 text-center font-sans text-ink-muted text-sm">Loading questions…</div>;
  }

  return (
    <GameSessionWrapper
      gameId={config.id}
      title={config.title}
      score={score}
      total={questions.length}
      completed={done}
      onRetry={handleRetry}
    >
      {current && (
        <div className="flex flex-col min-h-full px-4 py-6">
          {/* Question counter */}
          <p className="text-center text-xs font-sans text-ink-muted mb-4">
            Question {index + 1} of {questions.length}
          </p>

          {/* Arabic verb form */}
          <div className="flex-1 flex items-center justify-center mb-6">
            <div className="text-center">
              <p dir="rtl" className="arabic text-[3.5rem] leading-[5rem] text-ink">
                {current.form}
              </p>
              <p className="text-xs font-sans text-ink-muted mt-2">
                {current.paradigm === 'madi_malum' ? 'Māḍī Maʿlūm'
                  : current.paradigm === 'mudari_malum' ? 'Muḍāriʿ Maʿlūm'
                  : current.paradigm === 'madi_majhul' ? 'Māḍī Majhūl'
                  : current.paradigm === 'mudari_majhul' ? 'Muḍāriʿ Majhūl'
                  : current.paradigm === 'amr' ? 'Amr'
                  : 'Nahy'}
                {' — '}
                <span dir="rtl" className="arabic text-xs">{current.babArabicName}</span>
              </p>
            </div>
          </div>

          {/* Answer options */}
          <div className="grid grid-cols-1 gap-2 mb-4">
            {current.options.map((opt) => {
              const isChosen = chosenId === opt.sighaId;
              const isCorrect = opt.sighaId === current.correctSighaId;
              let cls = 'border-parchment-darker bg-white text-ink';
              if (answerState !== 'idle') {
                if (isCorrect) cls = 'border-teal bg-[var(--color-secondary-light)] text-teal-dark';
                else if (isChosen) cls = 'border-crimson/40 bg-[var(--color-accent-light)] text-crimson-dark';
                else cls = 'border-parchment-darker bg-white text-ink opacity-40';
              }
              return (
                <button
                  key={opt.sighaId}
                  onClick={() => handleAnswer(opt.sighaId)}
                  disabled={answerState !== 'idle'}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-sans text-sm transition-colors text-left ${cls}`}
                >
                  <div dir="rtl" className="flex items-baseline gap-2 flex-1">
                    <span className="arabic text-lg leading-relaxed">{opt.arabicName}</span>
                    <span className="arabic text-base text-ink-muted leading-relaxed">{opt.pronoun}</span>
                  </div>
                  <span className="text-xs text-ink-muted shrink-0">{opt.english}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {answerState !== 'idle' && (
            <div className={`rounded-xl px-4 py-3 mb-4 text-sm font-sans ${answerState === 'correct' ? 'bg-[var(--color-secondary-light)] text-teal-dark' : 'bg-[var(--color-accent-light)] text-crimson-dark'}`}>
              <p className="font-semibold mb-1">{answerState === 'correct' ? 'Correct!' : 'Not quite.'}</p>
              <p className="leading-relaxed">{current.rule}</p>
            </div>
          )}

          {answerState !== 'idle' && (
            <button
              onClick={advance}
              className="w-full py-3 rounded-[10px] bg-gold text-white font-sans font-medium text-sm hover:opacity-90 transition-opacity"
            >
              {index + 1 >= questions.length ? 'See results' : 'Next →'}
            </button>
          )}
        </div>
      )}
    </GameSessionWrapper>
  );
}
