'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import CircularProgress from '@/components/CircularProgress';
import { getStudentDetail, type StudentDetail } from '@/lib/teacherData';

const paradigmLabel = (p: string) => {
  const map: Record<string, string> = {
    madi_malum: 'Māḍī',
    mudari_malum: 'Muḍāriʿ',
    madi_majhul: 'Māḍī Majhūl',
    mudari_majhul: 'Muḍāriʿ Majhūl',
    amr: 'Amr',
    nahy: 'Nahy',
  };
  return map[p] ?? p;
};

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = decodeURIComponent(params.id as string);

  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'notfound' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const d = await getStudentDetail(studentId);
        if (cancelled) return;
        setDetail(d);
        setStatus(d ? 'ready' : 'notfound');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (status === 'loading') {
    return <div className="px-4 py-8 text-sm font-sans text-ink-muted">Loading…</div>;
  }
  if (status === 'notfound') {
    return (
      <div className="px-4 py-8 max-w-2xl">
        <BackLink />
        <p className="text-sm font-sans text-ink-muted mt-4">
          This student isn’t on your roster.
        </p>
      </div>
    );
  }
  if (status === 'error' || !detail) {
    return (
      <div className="px-4 py-8 max-w-2xl">
        <BackLink />
        <p className="text-sm font-sans text-red-600 mt-4">Could not load this student.</p>
      </div>
    );
  }

  const s = detail.summary;
  const recent = s.recentActivity.slice(0, 6);

  return (
    <div className="px-4 py-8 max-w-3xl">
      <BackLink />

      <h1 className="font-heading text-2xl text-ink mt-3 mb-1">
        {detail.displayName ?? 'Unnamed student'}
      </h1>
      <p className="text-ink-muted font-sans text-sm mb-6">
        {s.lastActivityDate
          ? `Last active ${new Date(s.lastActivityDate).toLocaleDateString()}`
          : 'No activity yet'}
      </p>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card-parchment p-4 flex flex-col items-center gap-1">
          <CircularProgress pct={s.unit1Combined} size={72} />
          <p className="text-xs font-sans text-ink-muted text-center mt-1">Unit 1 overall</p>
        </div>
        <div className="card-parchment p-4 flex flex-col items-center justify-center gap-1">
          <p className="font-heading text-3xl text-teal">{s.totalMastered}</p>
          <p className="text-xs font-sans text-ink-muted text-center">Forms mastered</p>
        </div>
        <div className="card-parchment p-4 flex flex-col items-center justify-center gap-1">
          <p className="font-heading text-3xl text-gold">{s.accuracy}%</p>
          <p className="text-xs font-sans text-ink-muted text-center">Accuracy</p>
        </div>
        <div className="card-parchment p-4 flex flex-col items-center justify-center gap-1">
          <p className="font-heading text-3xl text-gold">{s.currentStreak}</p>
          <p className="text-xs font-sans text-ink-muted text-center">Day streak</p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="card-parchment p-4 mb-6">
        <p className="font-sans text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">
          Unit 1 breakdown
        </p>
        <div className="space-y-2">
          <Bar label="Games" pct={s.unit1Games} tone="teal" />
          <Bar label="Exercises" pct={s.unit1Exercises} tone="gold" />
        </div>
        <p className="text-xs font-sans text-ink-muted mt-3">
          {s.totalAnswered} questions answered · longest streak {s.longestStreak} days
        </p>
      </div>

      {/* Recent activity */}
      {recent.length > 0 && (
        <div>
          <p className="font-sans text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
            Recent activity
          </p>
          <div className="space-y-2">
            {recent.map((a, i) => (
              <div
                key={i}
                className="bg-white border border-parchment-darker rounded-xl px-4 py-3 flex items-center gap-3"
              >
                <span
                  className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
                    a.correct ? 'bg-teal/15 text-teal' : 'bg-crimson/10 text-crimson'
                  }`}
                >
                  {a.correct ? '✓' : '✗'}
                </span>
                <span dir="rtl" className="arabic text-base text-ink flex-1 min-w-0 truncate">
                  {a.form}
                </span>
                <span className="text-xs font-sans text-ink-muted shrink-0">
                  {paradigmLabel(a.paradigm)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/students" className="text-sm font-sans text-ink-muted hover:text-gold transition-colors">
      ← Students
    </Link>
  );
}

function Bar({ label, pct, tone }: { label: string; pct: number; tone: 'teal' | 'gold' }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs font-sans text-ink-muted">{label}</span>
        <span className={`text-xs font-sans ${tone === 'teal' ? 'text-teal' : 'text-gold'}`}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-parchment-darker rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${tone === 'teal' ? 'bg-teal' : 'bg-gold'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
