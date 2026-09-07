'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { user, isLoading, updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-parchment-darker bg-white text-ink font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await updatePassword(password);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 1200);
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-parchment-dark">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl text-ink">Set a new password</h1>
        <p className="text-ink-muted font-sans text-sm mt-1">Al-Qalam Institute</p>
      </div>

      <div className="card-parchment w-full max-w-sm p-6">
        {done ? (
          <p className="text-sm font-sans text-ink text-center py-4">
            Password updated. Taking you in…
          </p>
        ) : !isLoading && !user ? (
          <div className="text-center py-4">
            <p className="text-sm font-sans text-ink mb-2 font-medium">Link expired</p>
            <p className="text-xs font-sans text-ink-muted">
              This reset link is no longer valid. Request a new one from the sign-in page.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-block text-xs font-sans text-gold hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans text-ink-muted">New password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                autoFocus
              />
              <p className="text-xs text-ink-muted/70 font-sans">Minimum 6 characters</p>
            </div>

            {error && (
              <p className="text-xs font-sans text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full py-2.5 rounded-lg bg-gold text-white font-sans text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-60"
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
