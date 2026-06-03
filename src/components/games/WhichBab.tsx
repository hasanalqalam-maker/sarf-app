'use client';

import { useCallback, useEffect, useState } from 'react';
import GameSessionWrapper from './GameSessionWrapper';
import { generateWhichBabQuestions } from '@/lib/unit2GameData';
import type { GameConfig, Paradigm } from '@/lib/gameData';
import type { WhichBabQuestion, WhichBabOption } from '@/lib/unit2GameData';

interface Props {
  config: GameConfig;
  onComplete: (score: number, total: number) => void;
}

export default function WhichBab({ config, onComplete }: Props) {
  const [questions, setQuestions] = useState<WhichBabQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const COUNT = 10;

  const reset = useCallback(() => {
    const qs = generateWhichBabQuestions(config.paradigm as Paradigm, COUNT);
    setQuestions(qs);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setDone(false);
  }, [config.paradigm]);

  useEffect(() => { reset(); }, [reset]);

  function handleSelect(babId: string) {
    if (revealed) return;
    setSelected(babId);
    setRevealed(true);
    if (babId === questions[current]?.correctBabId) {
      setScore((s) => s + 1);
    }
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      setDone(true);
      onComplete(score + (selected === questions[current]?.correctBabId ? 1 : 0), questions.length);
      return;
    }
    setCurrent((c) => c + 1);
    setSelected(null);
    setRevealed(false);
  }

  const q = questions[current];

  function optionClass(opt: WhichBabOption): string {
    if (!revealed) {
      return 'border-gold/30 bg-parchment-dark text-ink hover:border-gold/60 cursor-pointer';
    }
    if (opt.babId === q.correctBabId) {
      return 'border-teal bg-teal/10 text-teal cursor-default';
    }
    if (opt.babId === selected) {
      return 'border-red-300 bg-red-50 text-red-600 cursor-default';
    }
    return 'border-gold/15 bg-parchment-dark/50 text-ink-muted cursor-default opacity-60';
  }

  return (
    <GameSessionWrapper
      gameId={config.id}
      title={config.title}
      score={score}
      total={questions.length}
      completed={done}
      onRetry={reset}
    >
      <div className="flex flex-col px-4 py-6 min-h-full">
        {q && (
          <>
            <p className="text-xs font-sans text-ink-muted text-center mb-1">
              Question {current + 1} of {questions.length}
            </p>

            {/* Form display */}
            <div className="card-parchment rounded-2xl p-8 mb-6 text-center">
              <p className="text-[10px] font-sans text-ink-muted uppercase tracking-wide mb-3">
                Which bāb does this form belong to?
              </p>
              <p dir="rtl" className="arabic text-4xl leading-[4rem] text-ink">
                {q.form}
              </p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-2 mb-4">
              {q.options.map((opt) => (
                <button
                  key={opt.babId}
                  onClick={() => handleSelect(opt.babId)}
                  className={`px-4 py-3 rounded-xl border transition-all text-left flex items-center justify-between ${optionClass(opt)}`}
                >
                  <span dir="rtl" className="arabic text-xl leading-relaxed">{opt.madi}</span>
                  <span className="text-xs font-sans opacity-70 text-right leading-tight max-w-[60%]">
                    {opt.arabicName}
                  </span>
                </button>
              ))}
            </div>

            {/* Feedback + next */}
            {revealed && (
              <div className="mt-2">
                {selected === q.correctBabId ? (
                  <p className="text-sm font-sans text-teal text-center mb-4">Correct!</p>
                ) : (
                  <p className="text-sm font-sans text-center mb-4">
                    <span className="text-red-500">Incorrect. </span>
                    <span className="text-ink-muted">The answer is </span>
                    <span dir="rtl" className="arabic text-ink"> {q.correctBabArabicName}</span>
                  </p>
                )}
                <button
                  onClick={handleNext}
                  className="w-full py-3 rounded-xl bg-teal text-parchment text-sm font-sans font-medium hover:bg-teal/90 transition-colors"
                >
                  {current + 1 >= questions.length ? 'Finish' : 'Next →'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </GameSessionWrapper>
  );
}
