'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type View = 'signin' | 'signup' | 'reset';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, resetPassword } = useAuth();

  const [view, setView] = useState<View>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmSent, setConfirmSent] = useState(false); // signup: confirmation email sent
  const [resetSent, setResetSent] = useState(false); // reset: reset email sent

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  // Surface an error passed back from /auth/callback (e.g. expired link).
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('error');
    if (param) setError(param);
  }, []);

  function switchView(next: View) {
    setView(next);
    setError('');
    setConfirmSent(false);
    setResetSent(false);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error, needsConfirmation } = await signUp(email, password, displayName, role);
    if (error) {
      setError(error);
      setLoading(false);
    } else if (needsConfirmation) {
      setLoading(false);
      setConfirmSent(true);
    } else {
      router.push('/');
      router.refresh();
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) setError(error);
    else setResetSent(true);
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-parchment-darker bg-white text-ink font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors';

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-parchment-dark">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl text-ink">Sarf App</h1>
        <p className="text-ink-muted font-sans text-sm mt-1">Al-Qalam Institute</p>
      </div>

      <div className="card-parchment w-full max-w-sm p-6">
        {/* Tab toggle — hidden on the reset view */}
        {view !== 'reset' && (
          <div className="flex rounded-lg bg-parchment-dark p-1 mb-6">
            {(['signin', 'signup'] as const).map((v) => (
              <button
                key={v}
                onClick={() => switchView(v)}
                className={`flex-1 py-1.5 rounded-md text-sm font-sans transition-colors ${
                  view === v
                    ? 'bg-white text-gold shadow-sm font-medium'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {v === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>
        )}

        {view === 'reset' && (
          <p className="font-heading text-base text-ink mb-6">Reset your password</p>
        )}

        {/* Signup: confirmation email sent */}
        {confirmSent ? (
          <div className="text-center py-4">
            <p className="text-sm font-sans text-ink mb-2 font-medium">Check your inbox</p>
            <p className="text-xs font-sans text-ink-muted">
              We sent a confirmation link to <span className="text-ink">{email}</span>.
              Click it to activate your account, then sign in.
            </p>
            <button
              onClick={() => switchView('signin')}
              className="mt-5 text-xs font-sans text-gold hover:underline"
            >
              Back to sign in
            </button>
          </div>
        ) : /* Reset: reset email sent */ resetSent ? (
          <div className="text-center py-4">
            <p className="text-sm font-sans text-ink mb-2 font-medium">Check your inbox</p>
            <p className="text-xs font-sans text-ink-muted">
              We sent a password-reset link to <span className="text-ink">{email}</span>.
              Open it to choose a new password.
            </p>
            <button
              onClick={() => switchView('signin')}
              className="mt-5 text-xs font-sans text-gold hover:underline"
            >
              Back to sign in
            </button>
          </div>
        ) : view === 'reset' ? (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans text-ink-muted">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
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
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <button
              type="button"
              onClick={() => switchView('signin')}
              className="text-xs font-sans text-ink-muted hover:text-ink"
            >
              Back to sign in
            </button>
          </form>
        ) : (
          <form
            onSubmit={view === 'signin' ? handleSignIn : handleSignUp}
            className="flex flex-col gap-4"
          >
            {view === 'signup' && (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans text-ink-muted">Display name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className={inputClass}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-sans text-ink-muted">I am a</label>
                  <div className="flex gap-2">
                    {(['student', 'teacher'] as const).map((r) => (
                      <label
                        key={r}
                        className={`flex-1 flex items-center justify-center py-2 rounded-lg border cursor-pointer transition-colors text-sm font-sans ${
                          role === r
                            ? 'border-gold bg-gold/5 text-gold font-medium'
                            : 'border-parchment-darker text-ink-muted hover:border-gold/40'
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={r}
                          checked={role === r}
                          onChange={() => setRole(r)}
                          className="sr-only"
                        />
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans text-ink-muted">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-sans text-ink-muted">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
              {view === 'signup' && (
                <p className="text-xs text-ink-muted/70 font-sans">Minimum 6 characters</p>
              )}
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
              {loading
                ? view === 'signin'
                  ? 'Signing in…'
                  : 'Creating account…'
                : view === 'signin'
                ? 'Sign in'
                : 'Create account'}
            </button>

            {view === 'signin' && (
              <button
                type="button"
                onClick={() => switchView('reset')}
                className="text-xs font-sans text-ink-muted hover:text-ink"
              >
                Forgot password?
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
