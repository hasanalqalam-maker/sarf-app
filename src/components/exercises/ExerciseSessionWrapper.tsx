'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Props {
  exerciseId: string;
  title: string;
  page: number;
  score: number;
  total: number;
  completed: boolean;
  pendingReview: number;
  onRetry: () => void;
  backHref?: string;
  children: React.ReactNode;
}

export default function ExerciseSessionWrapper({
  title,
  page,
  score,
  total,
  completed,
  pendingReview,
  onRetry,
  backHref = '/exercises/unit-1',
  children,
}: Props) {
  const router = useRouter();
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = pct >= 70;

  if (completed) {
    return (
      <div className="fixed inset-0 bg-parchment-dark flex flex-col items-center justify-center px-6 z-50">
        <div className="w-full max-w-sm text-center bg-white rounded-2xl p-8 border border-parchment-darker shadow-sm">
          <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl ${passed ? 'bg-gold/10' : 'bg-crimson/10'}`}>
            {passed ? '✓' : '○'}
          </div>
          <h2 className="font-heading text-2xl text-ink mb-1">{passed ? 'Well done!' : 'Keep practising'}</h2>
          <p className="text-ink-muted font-sans text-sm mb-3">{title}</p>
          <p className={`font-heading text-5xl mb-2 ${passed ? 'text-gold' : 'text-crimson'}`}>{pct}%</p>
          <p className="text-ink-muted font-sans text-xs mb-1">
            {score} / {total} correct{passed ? ' — exercise completed' : ' — score 70% or above to complete'}
          </p>
          {pendingReview > 0 && (
            <p className="text-ink-muted font-sans text-xs mb-6 italic">
              {pendingReview} item{pendingReview > 1 ? 's' : ''} pending review (skipped)
            </p>
          )}
          {!pendingReview && <div className="mb-6" />}
          <div className="flex gap-3">
            {!passed && (
              <button
                onClick={onRetry}
                className="flex-1 py-3 rounded-xl border border-parchment-darker bg-white text-sm font-sans font-medium text-gold hover:bg-parchment-dark transition-colors"
              >
                Try again
              </button>
            )}
            <Link
              href={backHref}
              className="flex-1 py-3 rounded-xl bg-gold text-white text-sm font-sans font-medium text-center hover:opacity-90 transition-opacity"
            >
              Back to hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-parchment-dark flex flex-col z-50">
      {/* Top bar */}
      <div className="bg-white border-b border-parchment-darker shrink-0">
        <div className="relative flex items-center h-12 px-4">
          {/* Back arrow — plain icon, no button chrome */}
          <button
            onClick={() => router.back()}
            className="shrink-0 text-ink-muted hover:text-ink transition-colors z-10"
            aria-label="Back"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Title + page pill — absolutely centred */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 pointer-events-none px-14">
            <p className="font-sans font-medium text-sm text-ink truncate">{title}</p>
            <span className="shrink-0 text-[10px] font-sans font-medium text-gold bg-[var(--color-primary-light)] px-2 py-0.5 rounded-full">
              p.{page}
            </span>
          </div>

          {/* Score */}
          {total > 0 && (
            <span className="ml-auto shrink-0 text-xs font-sans font-semibold text-ink-muted z-10">
              {score}/{total}
            </span>
          )}
        </div>

        {/* Progress bar — 3px, flush under top bar */}
        {total > 0 && (
          <div className="h-[3px] bg-parchment-darker">
            <div
              className="h-full bg-gold transition-all duration-300"
              style={{ width: `${(score / total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
