'use client';

import { useParams } from 'next/navigation';
import { useCallback } from 'react';
import { getExercise } from '@/lib/exerciseData';
import { useProgress } from '@/lib/progressContext';
import MultiChoiceSession from '@/components/exercises/MultiChoiceSession';
import ExFillTableSession from '@/components/exercises/ExFillTableSession';
import TenseVoiceSession from '@/components/exercises/TenseVoiceSession';
import TranslateArabicSession from '@/components/exercises/TranslateArabicSession';
import TileBuildSession from '@/components/exercises/TileBuildSession';
import ActivePassiveTableSession from '@/components/exercises/ActivePassiveTableSession';
import NegateTranslateSession from '@/components/exercises/NegateTranslateSession';
import VerbalPracticeSession from '@/components/exercises/VerbalPracticeSession';

// MCQ: exercises where student identifies/names something
const MULTI_CHOICE_TYPES = new Set([
  'identify-sigha',
  'identify-bab',
  'identify-sigha-and-irab',
  'negate-with-particle',
]);

// Tile assembly: exercises where student produces an Arabic form
const TILE_BUILD_TYPES = new Set([
  'translate-english-to-arabic',
  'change-gender',
  'change-tense',
]);

const FILL_TYPES = new Set([
  'fill-table',
  'fill-tasrif-saghir',
]);

export default function ExerciseSessionPage() {
  const params = useParams();
  const exerciseId = decodeURIComponent(params['exercise-id'] as string);
  const exercise = getExercise(exerciseId);
  const { recordExerciseSession } = useProgress();

  const handleComplete = useCallback((score: number, total: number) => {
    recordExerciseSession(exerciseId, score, total);
  }, [exerciseId, recordExerciseSession]);

  if (!exercise) {
    return (
      <div className="flex items-center justify-center min-h-dvh px-6">
        <p className="text-ink-muted font-sans text-sm text-center">
          Exercise not found: {exerciseId}
        </p>
      </div>
    );
  }

  const type = exercise.exerciseType;

  if (type === 'verbal-practice') {
    return <VerbalPracticeSession exercise={exercise} onComplete={handleComplete} />;
  }

  if (type === 'identify-tense-voice') {
    return <TenseVoiceSession exercise={exercise} onComplete={handleComplete} />;
  }

  if (FILL_TYPES.has(type)) {
    return <ExFillTableSession exercise={exercise} onComplete={handleComplete} />;
  }

  if (type === 'translate-arabic-to-english') {
    return <TranslateArabicSession exercise={exercise} onComplete={handleComplete} />;
  }

  if (TILE_BUILD_TYPES.has(type)) {
    return <TileBuildSession exercise={exercise} onComplete={handleComplete} />;
  }

  if (type === 'active-passive-table') {
    return <ActivePassiveTableSession exercise={exercise} onComplete={handleComplete} />;
  }

  if (type === 'negate-and-translate') {
    return <NegateTranslateSession exercise={exercise} onComplete={handleComplete} />;
  }

  if (MULTI_CHOICE_TYPES.has(type)) {
    return <MultiChoiceSession exercise={exercise} onComplete={handleComplete} />;
  }

  return (
    <div className="flex items-center justify-center min-h-dvh px-6">
      <p className="text-ink-muted font-sans text-sm text-center">
        Unknown exercise type: {type}
      </p>
    </div>
  );
}
