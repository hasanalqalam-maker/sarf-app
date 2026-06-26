'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Props {
  gameId: string;
  title: string;
  score: number;
  total: number;
  completed: boolean;
  onRetry: () => void;
  backHref?: string;
  children: React.ReactNode;
}

export default function GameSessionWrapper({ gameId, title, score, total, completed, onRetry, backHref = '/exercises/unit-1', children }: Props) {
  const router = useRouter();
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = pct >= 80;

  if (completed) {
    return (
      <div className="fixed inset-0 bg-parchment-dark flex flex-col items-center justify-center px-6 z-50">
        <div className="w-full max-w-sm text-center bg-white rounded-2xl p-8 border border-parchment-darker shadow-sm">
          <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl ${passed ? 'bg-[var(--color-secondary-light)]' : 'bg-parchment-dark'}`}>
            {passed ? '✓' : '○'}
          </div>
          <h2 className="font-heading text-2xl text-ink mb-1">{passed ? 'Well done!' : 'Keep practising'}</h2>
          <p className="text-ink-muted font-sans text-sm mb-2">{title}</p>
          <p className={`font-heading text-4xl mb-6 ${passed ? 'text-gold' : 'text-crimson'}`}>{pct}%</p>
          <p className="text-ink-muted font-sans text-xs mb-8">
            {score} / {total} correct{pct >= 80 ? ' — game marked as completed' : ' — score 80% or above to complete'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onRetry}
              className="flex-1 py-3 rounded-[10px] border border-parchment-darker text-sm font-sans font-medium text-ink-muted hover:bg-parchment-dark transition-colors"
            >
              Try again
            </button>
            <Link
              href={backHref}
              className="flex-1 py-3 rounded-[10px] bg-gold text-white text-sm font-sans font-medium text-center hover:opacity-90 transition-opacity"
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
      {/* Header */}
      <div className="bg-white border-b border-parchment-darker shrink-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded-lg hover:bg-parchment-dark transition-colors text-ink-muted"
            aria-label="Back"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-sans font-medium text-sm text-ink truncate">{title}</p>
          </div>
          {total > 0 && (
            <span className="shrink-0 text-xs font-sans font-semibold text-gold bg-[var(--color-primary-light)] px-2 py-0.5 rounded-full">
              {score}/{total}
            </span>
          )}
        </div>
        {total > 0 && (
          <div className="h-[3px] bg-parchment-darker">
            <div
              className="h-full bg-gold transition-all duration-300"
              style={{ width: `${(score / total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Game content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
