'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ExerciseSessionWrapper from './ExerciseSessionWrapper';
import type { Exercise, ExerciseItem } from '@/lib/exerciseData';
import { TYPE_LABELS, shuffle } from '@/lib/exerciseData';
import { useProgress } from '@/lib/progressContext';

interface Props {
  exercise: Exercise;
  onComplete: (score: number, total: number) => void;
}

// ── Arabic grapheme splitter ──────────────────────────────────────────────────

function arabicGraphemes(word: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < word.length) {
    const cp = word.codePointAt(i)!;
    const ch = String.fromCodePoint(cp);
    i += ch.length;
    if (cp < 0x0600 || cp > 0x06FF || cp === 0x0640) continue;
    if (cp >= 0x064B && cp <= 0x065F) continue;
    let g = ch;
    while (i < word.length) {
      const dc = word.codePointAt(i)!;
      if ((dc >= 0x064B && dc <= 0x065F) || dc === 0x0670) {
        g += String.fromCodePoint(dc);
        i += 1;
      } else {
        break;
      }
    }
    result.push(g);
  }
  return result;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function getCorrectArabic(item: ExerciseItem, type: string): string | null {
  const a = item.answer as Record<string, string> | Array<Record<string, string>> | undefined;
  if (!a) return null;
  switch (type) {
    case 'translate-english-to-arabic':
      return (a as Record<string, string>).arabic ?? null;
    case 'change-gender':
    case 'change-tense':
      if (Array.isArray(a)) return (a[0] as Record<string, string>).arabic ?? null;
      return (a as Record<string, string>).arabic ?? null;
    default:
      return null;
  }
}

function getAllValidArabic(item: ExerciseItem, type: string): string[] {
  const a = item.answer as Record<string, string> | Array<Record<string, string>> | undefined;
  if (!a) return [];
  if (type === 'change-gender' || type === 'change-tense') {
    if (Array.isArray(a)) return a.map(x => x.arabic).filter(Boolean) as string[];
  }
  const single = getCorrectArabic(item, type);
  return single ? [single] : [];
}

function getSigha(item: ExerciseItem): string {
  const a = item.answer as Record<string, string> | Array<Record<string, string>> | undefined;
  if (!a) return '';
  if (Array.isArray(a)) return (a[0] as Record<string, string>).sigha ?? '';
  return (a as Record<string, string>).sigha ?? '';
}

interface Tile {
  id: string;
  text: string;
  isDistractor: boolean;
}

function buildTiles(correctWord: string, allItems: ExerciseItem[], type: string): Tile[] {
  const correctGraphemes = arabicGraphemes(correctWord);
  const correctSet = new Set(correctGraphemes);

  const distractorPool: string[] = [];
  for (const item of allItems) {
    const w = getCorrectArabic(item, type);
    if (!w || w === correctWord) continue;
    for (const g of arabicGraphemes(w)) {
      if (!correctSet.has(g)) distractorPool.push(g);
    }
  }
  const uniqueDistractors = shuffle([...new Set(distractorPool)]).slice(0, 3);

  const tiles: Tile[] = [
    ...correctGraphemes.map((t, i) => ({ id: `c${i}`, text: t, isDistractor: false })),
    ...uniqueDistractors.map((t, i) => ({ id: `d${i}`, text: t, isDistractor: true })),
  ];
  return shuffle(tiles);
}

function buildSighaOptions(correct: string, allItems: ExerciseItem[]): { text: string; correct: boolean }[] {
  const pool = allItems
    .map(i => getSigha(i))
    .filter(s => s && s !== correct);
  const unique = [...new Set(pool)];
  const distractors = shuffle(unique).slice(0, 3);
  while (distractors.length < 3) distractors.push('—');
  return shuffle([{ text: correct, correct: true }, ...distractors.map(d => ({ text: d, correct: false }))]);
}

// ── component ─────────────────────────────────────────────────────────────────

type CheckState = 'idle' | 'correct' | 'wrong';
type Phase = 'tile' | 'sigha';

export default function TileBuildSession({ exercise, onComplete }: Props) {
  const { recordAnswer } = useProgress();

  const scoreable = useMemo(() => exercise.items.filter(i => !i.unclear), [exercise.items]);
  const pendingReview = exercise.items.length - scoreable.length;
  const type = exercise.exerciseType;

  // Check if any item has a sigha answer (instruction always says "write sigha" for these types)
  const hasSigha = useMemo(
    () => scoreable.some(i => !!getSigha(i)),
    [scoreable],
  );

  const total = scoreable.length * (hasSigha ? 2 : 1);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('tile');
  const [placedIds, setPlacedIds] = useState<string[]>([]);
  const [checkState, setCheckState] = useState<CheckState>('idle');
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  // Sigha MCQ state
  const [sighaChosen, setSighaChosen] = useState<string | null>(null);
  const [sighaAnswered, setSighaAnswered] = useState(false);

  const current = scoreable[index];

  const correctWord = useMemo(
    () => (current ? getCorrectArabic(current, type) ?? '' : ''),
    [current, type],
  );

  const validAnswers = useMemo(
    () => (current ? getAllValidArabic(current, type) : []),
    [current, type],
  );

  const correctSigha = useMemo(
    () => (current ? getSigha(current) : ''),
    [current],
  );

  const tiles = useMemo(
    () => (current ? buildTiles(correctWord, scoreable, type) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, current, correctWord],
  );

  const sighaOptions = useMemo(
    () => (current && hasSigha && correctSigha ? buildSighaOptions(correctSigha, scoreable) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, current, correctSigha, hasSigha],
  );

  const tileMap = useMemo(() => Object.fromEntries(tiles.map(t => [t.id, t])), [tiles]);
  const placedTiles = placedIds.map(id => tileMap[id]).filter(Boolean);
  const availableTiles = tiles.filter(t => !placedIds.includes(t.id));
  const assembled = placedTiles.map(t => t.text).join('');

  const targetLength = useMemo(() => arabicGraphemes(correctWord).length, [correctWord]);

  function placeTile(id: string) {
    if (checkState !== 'idle' || phase !== 'tile') return;
    setPlacedIds(p => [...p, id]);
  }

  function removeTile(id: string) {
    if (checkState !== 'idle' || phase !== 'tile') return;
    setPlacedIds(p => p.filter(x => x !== id));
  }

  function handleCheck() {
    if (!assembled || checkState !== 'idle') return;
    const isCorrect = validAnswers.some(v => arabicGraphemes(v).join('') === assembled);
    setCheckState(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) setScore(s => s + 1);
    recordAnswer('unit1-exercise', exercise.id, type, correctWord, isCorrect);
  }

  function handleSighaAnswer(text: string) {
    if (sighaAnswered) return;
    setSighaChosen(text);
    setSighaAnswered(true);
    const isCorrect = text === correctSigha;
    if (isCorrect) setScore(s => s + 1);
    recordAnswer('unit1-exercise', exercise.id, `${type}-sigha`, correctSigha, isCorrect);
  }

  function advance() {
    // Tile phase done → go to sigha phase (if applicable)
    if (hasSigha && phase === 'tile') {
      setPhase('sigha');
      setSighaChosen(null);
      setSighaAnswered(false);
      return;
    }

    // Move to next item
    const next = index + 1;
    if (next >= scoreable.length) {
      setDone(true);
      onComplete(score, total);
    } else {
      setIndex(next);
      setPhase('tile');
      setPlacedIds([]);
      setCheckState('idle');
      setSighaChosen(null);
      setSighaAnswered(false);
    }
  }

  const reset = useCallback(() => {
    setIndex(0);
    setPhase('tile');
    setPlacedIds([]);
    setCheckState('idle');
    setScore(0);
    setDone(false);
    setSighaChosen(null);
    setSighaAnswered(false);
  }, []);

  if (!current) return null;

  const title = `Ex ${exercise.exerciseNumber} · ${TYPE_LABELS[type] ?? type}`;

  const isEnToAr = type === 'translate-english-to-arabic';
  const promptText = isEnToAr ? current.english : current.arabic ?? current.pattern;
  const isArabicPrompt = !isEnToAr;

  const changeAnswer = !Array.isArray(current.answer) ? (current.answer as Record<string, string> | undefined) : undefined;
  const fromSigha = changeAnswer?.fromSigha ?? changeAnswer?.sigha ?? '';
  const toSigha = changeAnswer?.toSigha ?? '';

  const canCheck = placedIds.length > 0 && checkState === 'idle';

  // Auto-check when all tiles are placed
  useEffect(() => {
    if (phase === 'tile' && checkState === 'idle' && placedIds.length === targetLength && placedIds.length > 0) {
      handleCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placedIds.length, targetLength, phase]);

  // Step counter label
  const stepLabel = phase === 'tile' ? null : 'Write the sīgha';
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
          {stepLabel && <span className="ml-2 text-gold">· {stepLabel}</span>}
        </p>

        {/* Instruction */}
        <div className="bg-ink/5 rounded-xl px-4 py-3 mb-5">
          <p className="text-xs font-sans text-ink-muted leading-relaxed">{exercise.instructionText}</p>
        </div>

        {/* ── Tile phase ────────────────────────────────────────────────────── */}
        {phase === 'tile' && (
          <>
            {/* Prompt */}
            <div className="flex-1 flex flex-col items-center justify-center mb-5 gap-2">
              <p
                dir={isArabicPrompt ? 'rtl' : undefined}
                className={`text-center ${isArabicPrompt ? 'arabic text-5xl leading-[4.5rem]' : 'font-sans text-2xl font-medium'} text-ink`}
              >
                {promptText}
              </p>
              {!isEnToAr && fromSigha && toSigha && (
                <p className="text-xs font-sans text-ink-muted text-center">
                  <span dir="rtl" className="arabic">{fromSigha}</span>
                  <span className="mx-2">→</span>
                  <span dir="rtl" className="arabic">{toSigha}</span>
                </p>
              )}
              {!isEnToAr && fromSigha && !toSigha && (
                <p className="text-xs font-sans text-ink-muted text-center">
                  Change gender/tense
                </p>
              )}
            </div>

            {/* Assembly area */}
            <div className={`min-h-[52px] mb-4 px-4 py-3 rounded-xl border-2 flex items-center justify-center flex-wrap gap-1 transition-colors ${
              checkState === 'correct' ? 'border-teal bg-teal/8' :
              checkState === 'wrong' ? 'border-red-400 bg-red-50' :
              'border-gold/25 bg-parchment-dark'
            }`}>
              {placedTiles.length === 0 ? (
                <p className="text-[11px] font-sans text-ink-muted/50">Tap tiles below to build the form</p>
              ) : (
                placedTiles.map(tile => (
                  <button
                    key={tile.id}
                    onClick={() => removeTile(tile.id)}
                    className="px-2 py-1 rounded-lg bg-parchment border border-gold/30 hover:bg-red-50 hover:border-red-300 transition-colors"
                    title="Tap to remove"
                  >
                    <span dir="rtl" className="arabic text-xl text-ink">{tile.text}</span>
                  </button>
                ))
              )}
            </div>

            {/* Feedback */}
            {checkState !== 'idle' && (
              <div className={`rounded-xl px-4 py-3 mb-3 text-sm font-sans ${checkState === 'correct' ? 'bg-teal/10 text-teal-dark' : 'bg-red-50 text-red-700'}`}>
                <p className="font-semibold mb-1">{checkState === 'correct' ? 'Correct!' : 'Not quite.'}</p>
                {checkState === 'wrong' && (
                  <p className="text-xs">
                    Answer: <span dir="rtl" className="arabic text-base ml-1">{correctWord}</span>
                  </p>
                )}
              </div>
            )}

            {/* Available tiles */}
            {checkState === 'idle' && (
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {availableTiles.map(tile => (
                  <button
                    key={tile.id}
                    onClick={() => placeTile(tile.id)}
                    className="px-3 py-2 rounded-xl bg-parchment border border-gold/30 hover:bg-teal/10 hover:border-teal/40 transition-colors active:scale-95"
                  >
                    <span dir="rtl" className="arabic text-2xl text-ink">{tile.text}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-auto">
              {checkState === 'idle' && (
                <>
                  <button
                    onClick={() => setPlacedIds([])}
                    disabled={placedIds.length === 0}
                    className="px-4 py-3 rounded-xl border border-gold/20 text-xs font-sans text-ink-muted hover:bg-gold/5 transition-colors disabled:opacity-30"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleCheck}
                    disabled={!canCheck}
                    className="flex-1 py-3 rounded-xl bg-ink text-parchment font-sans font-medium text-sm hover:bg-ink-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Check
                  </button>
                </>
              )}
              {checkState !== 'idle' && (
                <button
                  onClick={advance}
                  className="flex-1 py-3 rounded-xl bg-ink text-parchment font-sans font-medium text-sm hover:bg-ink-light transition-colors"
                >
                  {hasSigha ? 'Write sīgha →' : (index + 1 >= scoreable.length ? 'See results' : 'Next →')}
                </button>
              )}
            </div>
          </>
        )}

        {/* ── Sigha phase ───────────────────────────────────────────────────── */}
        {phase === 'sigha' && (
          <>
            <div className="flex-1 flex flex-col items-center justify-center mb-6 gap-2">
              {/* Show the Arabic form (correct or assembled) as reference */}
              <p dir="rtl" className="arabic text-4xl leading-[4rem] text-ink text-center">
                {correctWord}
              </p>
              <p className="text-[11px] font-sans text-ink-muted uppercase tracking-wide">
                What is its صِيْغَة?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {sighaOptions.map((opt, i) => {
                const isChosen = sighaChosen === opt.text;
                const isCorrect = opt.correct;
                let cls = 'border-gold/20 bg-parchment-dark text-ink';
                if (sighaAnswered) {
                  if (isCorrect) cls = 'border-teal bg-teal/10 text-teal';
                  else if (isChosen) cls = 'border-red-400 bg-red-50 text-red-700';
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleSighaAnswer(opt.text)}
                    disabled={sighaAnswered}
                    className={`px-3 py-3 rounded-xl border font-sans text-sm transition-colors text-center ${cls}`}
                  >
                    <span dir="rtl" className="arabic text-base leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {sighaAnswered && (
              <>
                {sighaChosen !== correctSigha && (
                  <div className="rounded-xl px-4 py-3 mb-3 text-sm font-sans bg-red-50 text-red-700">
                    <p className="text-xs">
                      Correct: <span dir="rtl" className="arabic">{correctSigha}</span>
                    </p>
                  </div>
                )}
                <button
                  onClick={advance}
                  className="w-full py-3 rounded-xl bg-ink text-parchment font-sans font-medium text-sm hover:bg-ink-light transition-colors"
                >
                  {index + 1 >= scoreable.length ? 'See results' : 'Next →'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </ExerciseSessionWrapper>
  );
}
