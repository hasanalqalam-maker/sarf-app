import Link from 'next/link';
import type { Exercise, ExerciseType } from '@/lib/exerciseData';
import type { ExerciseSessionEntry } from '@/lib/exerciseData';
import { TYPE_LABELS } from '@/lib/exerciseData';

interface Props {
  exercise: Exercise;
  session?: ExerciseSessionEntry;
  locked: boolean;
  basePath?: string;
}

const IDENTIFY_TYPES: ExerciseType[] = [
  'identify-sigha',
  'identify-bab',
  'identify-tense-voice',
  'identify-sigha-and-irab',
];

const PRODUCE_TYPES: ExerciseType[] = [
  'translate-arabic-to-english',
  'translate-english-to-arabic',
  'negate-and-translate',
  'negate-with-particle',
  'change-gender',
  'change-tense',
  'fill-table',
  'fill-tasrif-saghir',
  'active-passive-table',
];

export default function ExerciseCard({
  exercise,
  session,
  locked,
  basePath = '/exercises/unit-1/exercises',
}: Props) {
  const isVerbal = exercise.exerciseType === 'verbal-practice';
  const completed = session?.completed ?? false;
  const bestPct = session?.bestPct ?? 0;

  // Left border colour by state
  const borderAccent = completed
    ? 'border-l-[3px] border-l-teal'
    : !locked && !isVerbal
    ? 'border-l-[3px] border-l-gold'
    : '';

  // Type pill: colour by state/type
  let pillCls: string;
  let pillLabel: string;
  if (locked) {
    pillCls = 'bg-parchment-darker text-ink-muted';
    pillLabel = 'Locked';
  } else if (completed) {
    pillCls = 'bg-[var(--color-secondary-light)] text-teal font-semibold';
    pillLabel = `${bestPct}%`;
  } else if (isVerbal) {
    pillCls = 'bg-parchment-darker text-ink-muted';
    pillLabel = 'Reference';
  } else if (IDENTIFY_TYPES.includes(exercise.exerciseType)) {
    pillCls = 'bg-[var(--color-primary-light)] text-gold';
    pillLabel = TYPE_LABELS[exercise.exerciseType] ?? exercise.exerciseType;
  } else if (PRODUCE_TYPES.includes(exercise.exerciseType)) {
    pillCls = 'bg-[var(--color-accent-light)] text-crimson';
    pillLabel = TYPE_LABELS[exercise.exerciseType] ?? exercise.exerciseType;
  } else {
    pillCls = 'bg-parchment-darker text-ink-muted';
    pillLabel = TYPE_LABELS[exercise.exerciseType] ?? exercise.exerciseType;
  }

  const typeLabel = TYPE_LABELS[exercise.exerciseType] ?? exercise.exerciseType;
  const scoreable = exercise.items.filter(i => !i.unclear).length;
  const total = exercise.items.length;

  const inner = (
    <div className={`
      bg-white border border-parchment-darker rounded-xl p-4 flex flex-col gap-2.5 transition-all
      ${locked ? 'opacity-45' : isVerbal ? 'hover:shadow-sm' : 'hover:shadow-sm'}
      ${borderAccent}
    `}>
      {/* Header row: state dot + meta + pill */}
      <div className="flex items-start gap-3">

        {/* State dot */}
        {completed ? (
          <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-teal/15 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : locked ? (
          <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-parchment-darker flex items-center justify-center">
            <svg className="w-3 h-3 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
        ) : (
          <div className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-gold/15 flex items-center justify-center">
            <span className="text-[10px] font-sans font-bold text-gold leading-none">
              {exercise.exerciseNumber}
            </span>
          </div>
        )}

        {/* Text block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-[11px] font-sans text-ink-muted leading-none">
              Ex {exercise.exerciseNumber} · p.{exercise.page}
            </p>
            <span className={`shrink-0 text-[10px] font-sans px-2 py-0.5 rounded-full ${pillCls}`}>
              {pillLabel}
            </span>
          </div>
          <p className="font-sans text-xs text-ink leading-snug line-clamp-2">
            {exercise.instructionText}
          </p>
        </div>
      </div>

      {/* Footer: type label + item count */}
      <div className="flex items-center justify-between pl-9">
        <span className={`text-[10px] font-sans uppercase tracking-wide ${
          locked ? 'text-ink-muted/50' : 'text-ink-muted'
        }`}>
          {typeLabel}
        </span>
        {total > 0 && (
          <span className="text-[10px] font-sans text-ink-muted">
            {scoreable < total ? `${scoreable}/${total}` : total} items
          </span>
        )}
      </div>

      {/* Score bar */}
      {completed && bestPct > 0 && (
        <div className="h-1 bg-parchment-darker rounded-full overflow-hidden ml-9">
          <div className="h-full bg-teal rounded-full" style={{ width: `${bestPct}%` }} />
        </div>
      )}
    </div>
  );

  if (locked) return inner;
  return (
    <Link href={`${basePath}/${encodeURIComponent(exercise.id)}`} className="block">
      {inner}
    </Link>
  );
}
