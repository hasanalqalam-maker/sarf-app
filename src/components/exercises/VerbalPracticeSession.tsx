'use client';

import { useCallback, useState } from 'react';
import ExerciseSessionWrapper from './ExerciseSessionWrapper';
import type { Exercise } from '@/lib/exerciseData';

interface Props {
  exercise: Exercise;
  onComplete: (score: number, total: number) => void;
}

export default function VerbalPracticeSession({ exercise, onComplete }: Props) {
  const [confirmed, setConfirmed] = useState(false);

  const vocabVerbs = exercise.vocabVerbs ?? [];
  const referenceTable = exercise.referenceTable as Record<string, string> | undefined;

  function handlePractised() {
    setConfirmed(true);
    onComplete(1, 1);
  }

  const reset = useCallback(() => {
    setConfirmed(false);
  }, []);

  const title = `Ex ${exercise.exerciseNumber} · Verbal practice`;

  return (
    <ExerciseSessionWrapper
      exerciseId={exercise.id}
      title={title}
      page={exercise.page}
      score={confirmed ? 1 : 0}
      total={1}
      completed={confirmed}
      pendingReview={0}
      onRetry={reset}
    >
      <div className="px-4 py-6">
        {/* Instruction */}
        <div className="bg-ink/5 rounded-xl px-4 py-3 mb-6">
          <p dir="rtl" className="arabic text-base text-ink mb-1">تَمْرِيْنٌ شَفَوِيٌّ</p>
          <p className="text-xs font-sans text-ink-muted leading-relaxed">{exercise.instructionText}</p>
        </div>

        {/* Vocab verbs table */}
        {vocabVerbs.length > 0 && (
          <div className="mb-6">
            <p className="text-[11px] font-sans font-semibold text-ink-muted uppercase tracking-wide mb-3">
              Vocabulary for this section
            </p>
            <div className="rounded-xl overflow-hidden border border-gold/20">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-parchment-darker border-b border-gold/20">
                    <th className="py-2 px-3 text-right text-[10px] font-sans font-semibold text-ink-muted uppercase tracking-wide">
                      مَاضِي
                    </th>
                    <th className="py-2 px-3 text-right text-[10px] font-sans font-semibold text-ink-muted uppercase tracking-wide">
                      مُضَارِع
                    </th>
                    <th className="py-2 px-3 text-right text-[10px] font-sans font-semibold text-ink-muted uppercase tracking-wide">
                      مَصْدَر
                    </th>
                    <th className="py-2 px-3 text-left text-[10px] font-sans font-semibold text-ink-muted uppercase tracking-wide">
                      Meaning
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {vocabVerbs.map((v, i) => (
                    <tr key={i} className="border-b border-gold/10 last:border-0 hover:bg-gold/3 transition-colors">
                      <td className="py-2.5 px-3 text-right">
                        <span dir="rtl" className="arabic text-sm text-ink">{v.madi}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span dir="rtl" className="arabic text-sm text-ink">{v.mudari}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span dir="rtl" className="arabic text-sm text-ink-muted">{v.masdar}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-sans text-xs text-ink">{v.english}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reference table note (for p10 with no vocabVerbs) */}
        {vocabVerbs.length === 0 && referenceTable && (
          <div className="mb-6 p-4 rounded-xl bg-parchment-darker border border-gold/20">
            <p className="text-xs font-sans text-ink-muted leading-relaxed">{referenceTable.note}</p>
            {referenceTable.exampleVerb && (
              <p className="mt-2 text-xs font-sans text-ink-muted">
                Example: <span dir="rtl" className="arabic text-sm text-ink ml-1">{referenceTable.exampleVerb}</span>
              </p>
            )}
          </div>
        )}

        {/* No data at all */}
        {vocabVerbs.length === 0 && !referenceTable && (
          <div className="mb-6 p-4 rounded-xl bg-parchment-darker border border-gold/20">
            <p className="text-xs font-sans text-ink-muted">
              Conjugate verbs aloud with your teacher or study partner using the reference tables in the book.
            </p>
          </div>
        )}

        {/* How to practise */}
        <div className="mb-6 p-3 rounded-xl border border-teal/20 bg-teal/5">
          <p className="text-[11px] font-sans font-semibold text-teal uppercase tracking-wide mb-1">How to practise</p>
          <p className="text-xs font-sans text-ink-muted leading-relaxed">
            Conjugate each verb through all 14 صِيَغ aloud. Your teacher or study partner should listen and correct you.
            Once you have completed the verbal practice, tap <span className="font-medium text-ink">Practised it ✓</span> below.
          </p>
        </div>

        {/* Confirm button */}
        {!confirmed ? (
          <button
            onClick={handlePractised}
            className="w-full py-3.5 rounded-xl bg-teal text-parchment font-sans font-semibold text-sm hover:bg-teal-dark transition-colors"
          >
            Practised it ✓
          </button>
        ) : (
          <div className="w-full py-3.5 rounded-xl bg-teal/15 border border-teal/30 text-center">
            <p className="font-sans text-sm font-medium text-teal">Marked as practised ✓</p>
          </div>
        )}
      </div>
    </ExerciseSessionWrapper>
  );
}
