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
      <div className="fixed inset-0 bg-parchment flex flex-col items-center justify-center px-6 z-50">
        <div className="w-full max-w-sm text-center">
          <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl ${passed ? 'bg-teal/15' : 'bg-gold/15'}`}>
            {passed ? '✓' : '○'}
          </div>
          <h2 className="font-heading text-2xl text-ink mb-1">{passed ? 'Well done!' : 'Keep practising'}</h2>
          <p className="text-ink-muted font-sans text-sm mb-2">{title}</p>
          <p className={`font-heading text-4xl mb-2 ${passed ? 'text-teal' : 'text-gold'}`}>{pct}%</p>
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
                className="flex-1 py-3 rounded-xl border border-gold/30 text-sm font-sans font-medium text-ink hover:bg-gold/5 transition-colors"
              >
                Try again
              </button>
            )}
            <Link
              href={backHref}
              className="flex-1 py-3 rounded-xl bg-teal text-parchment text-sm font-sans font-medium text-center hover:bg-teal-dark transition-colors"
            >
              Back to hub
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-parchment flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gold/10 bg-parchment shrink-0">
        <button
          onClick={() => router.back()}
          className="p-1.5 rounded-lg hover:bg-gold/10 transition-colors text-ink-muted"
          aria-label="Back"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="font-sans font-medium text-sm text-ink truncate flex-1">{title}</p>
            <span className="shrink-0 text-[10px] font-sans text-ink-muted bg-parchment-darker px-2 py-0.5 rounded-full">p.{page}</span>
          </div>
          {total > 0 && (
            <div className="mt-1 h-1.5 bg-parchment-darker rounded-full overflow-hidden">
              <div
                className="h-full bg-teal rounded-full transition-all duration-300"
                style={{ width: `${(score / total) * 100}%` }}
              />
            </div>
          )}
        </div>
        {total > 0 && (
          <span className="shrink-0 text-xs font-sans font-semibold text-teal bg-teal/10 px-2 py-0.5 rounded-full">
            {score}/{total}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
