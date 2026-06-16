import Link from 'next/link';
import type { Exercise } from '@/lib/exerciseData';
import type { ExerciseSessionEntry } from '@/lib/exerciseData';
import { TYPE_LABELS, parsePart } from '@/lib/exerciseData';

interface Props {
  exercise: Exercise;
  session?: ExerciseSessionEntry;
  locked: boolean;
  basePath?: string;
}

export default function ExerciseCard({
  exercise,
  session,
  locked,
  basePath = '/exercises/unit-1/exercises',
}: Props) {
  const isVerbal = exercise.exerciseType === 'verbal-practice';
  const completed = session?.completed ?? false;
  const bestPct = session?.bestPct ?? 0;
  const inProgress = !completed && (session?.attempts ?? 0) > 0;

  let pill: { label: string; cls: string };
  if (isVerbal) {
    pill = { label: 'Reference', cls: 'bg-ink/8 text-ink-muted' };
  } else if (completed) {
    pill = { label: `${bestPct}%`, cls: 'bg-teal/15 text-teal' };
  } else if (locked) {
    pill = { label: 'Locked', cls: 'bg-ink-muted/10 text-ink-muted' };
  } else if (inProgress) {
    pill = { label: 'In progress', cls: 'bg-gold/15 text-gold' };
  } else {
    pill = { label: 'Start', cls: 'bg-parchment-darker text-ink-muted' };
  }

  const typeLabel = TYPE_LABELS[exercise.exerciseType] ?? exercise.exerciseType;
  const scoreable = exercise.items.filter(i => !i.unclear).length;
  const total = exercise.items.length;

  const inner = (
    <div className={`card-parchment p-4 flex flex-col gap-2 transition-all
      ${locked ? 'opacity-45' : isVerbal ? 'border-dashed hover:border-teal/30' : 'hover:border-gold/40 hover:shadow-sm'}
    `}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-sans text-ink-muted mb-0.5">
            Exercise {exercise.exerciseNumber} · p.{exercise.page}
          </p>
          <p className="font-sans text-xs text-ink leading-snug line-clamp-2">
            {exercise.instructionText}
          </p>
        </div>
        <span className={`shrink-0 text-[10px] font-sans font-semibold px-2 py-0.5 rounded-full ${pill.cls}`}>
          {pill.label}
        </span>
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] font-sans text-gold/70 uppercase tracking-wide">
          {typeLabel}
        </span>
        <div className="flex items-center gap-1.5">
          {total > 0 && (
            <span className="text-[10px] font-sans text-ink-muted">
              {scoreable < total ? `${scoreable}/${total} items` : `${total} items`}
            </span>
          )}
          {locked && (
            <svg className="w-3 h-3 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          )}
        </div>
      </div>

      {/* Completion progress bar */}
      {completed && bestPct > 0 && (
        <div className="h-1 bg-parchment-darker rounded-full overflow-hidden mt-1">
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
