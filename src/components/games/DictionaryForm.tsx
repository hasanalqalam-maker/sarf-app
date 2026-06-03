'use client';

import { useCallback, useEffect, useState } from 'react';
import GameSessionWrapper from './GameSessionWrapper';
import { generateDictionaryFormQuestions } from '@/lib/unit2GameData';
import type { GameConfig } from '@/lib/gameData';
import type { DictionaryFormQuestion, DictionaryFormOption } from '@/lib/unit2GameData';

interface Props {
  config: GameConfig;
  onComplete: (score: number, total: number) => void;
}

export default function DictionaryForm({ config, onComplete }: Props) {
  const [questions, setQuestions] = useState<DictionaryFormQuestion[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const COUNT = 10;

  const reset = useCallback(() => {
    setQuestions(generateDictionaryFormQuestions(COUNT));
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setDone(false);
  }, []);

  useEffect(() => { reset(); }, [reset]);

  function handleSelect(form: string) {
    if (revealed) return;
    setSelected(form);
    setRevealed(true);
    if (form === questions[current]?.correctDictForm) {
      setScore((s) => s + 1);
    }
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      setDone(true);
      onComplete(score + (selected === questions[current]?.correctDictForm ? 1 : 0), questions.length);
      return;
    }
    setCurrent((c) => c + 1);
    setSelected(null);
    setRevealed(false);
  }

  const q = questions[current];

  function optionClass(opt: DictionaryFormOption): string {
    if (!revealed) {
      return 'border-gold/30 bg-parchment-dark text-ink hover:border-gold/60 cursor-pointer';
    }
    if (opt.form === q.correctDictForm) {
      return 'border-teal bg-teal/10 text-teal cursor-default';
    }
    if (opt.form === selected) {
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
                What is the dictionary form (māḍī ghaib)?
              </p>
              <p dir="rtl" className="arabic text-4xl leading-[4rem] text-ink">
                {q.conjugatedForm}
              </p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {q.options.map((opt) => (
                <button
                  key={opt.babId}
                  onClick={() => handleSelect(opt.form)}
                  className={`px-4 py-4 rounded-xl border transition-all text-center ${optionClass(opt)}`}
                >
                  <span dir="rtl" className="arabic text-2xl leading-relaxed block">{opt.form}</span>
                </button>
              ))}
            </div>

            {/* Feedback + next */}
            {revealed && (
              <div className="mt-2">
                {selected === q.correctDictForm ? (
                  <p className="text-sm font-sans text-teal text-center mb-4">Correct!</p>
                ) : (
                  <p className="text-sm font-sans text-center mb-4">
                    <span className="text-red-500">Incorrect. </span>
                    <span className="text-ink-muted">The dictionary form is </span>
                    <span dir="rtl" className="arabic text-ink"> {q.correctDictForm}</span>
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
