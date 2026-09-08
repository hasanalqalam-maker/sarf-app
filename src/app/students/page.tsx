'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  listStudents,
  addStudentByEmail,
  removeStudent,
  type Student,
} from '@/lib/teacherData';

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [loadError, setLoadError] = useState('');

  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const [removingId, setRemovingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setStudents(await listStudents());
      setLoadError('');
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load your roster.');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError('');
    const { error } = await addStudentByEmail(email.trim());
    setAdding(false);
    if (error) {
      setAddError(error);
    } else {
      setEmail('');
      refresh();
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    const { error } = await removeStudent(id);
    setRemovingId(null);
    if (!error) setStudents((prev) => prev?.filter((s) => s.id !== id) ?? null);
  }

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-parchment-darker bg-white text-ink font-sans text-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-colors';

  return (
    <div className="px-4 py-8 max-w-2xl">
      <h1 className="font-heading text-2xl text-ink mb-1">Students</h1>
      <p className="text-ink-muted font-sans text-sm mb-6">
        Add students by the email they signed up with, then open a student to see their progress.
      </p>

      {/* Add student */}
      <form onSubmit={handleAdd} className="card-parchment p-4 mb-6 flex flex-col gap-3">
        <label className="text-xs font-sans text-ink-muted">Student email</label>
        <div className="flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@example.com"
            className={inputClass}
          />
          <button
            type="submit"
            disabled={adding}
            className="shrink-0 px-4 py-2 rounded-lg bg-gold text-white font-sans text-sm font-medium hover:bg-gold-light transition-colors disabled:opacity-60"
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </div>
        {addError && (
          <p className="text-xs font-sans text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {addError}
          </p>
        )}
      </form>

      {/* Roster */}
      {loadError && (
        <p className="text-xs font-sans text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          {loadError}
        </p>
      )}

      {students === null ? (
        <p className="text-sm font-sans text-ink-muted">Loading roster…</p>
      ) : students.length === 0 ? (
        <p className="text-sm font-sans text-ink-muted">No students yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {students.map((s) => (
            <li
              key={s.id}
              className="card-parchment p-4 flex items-center justify-between gap-3"
            >
              <Link href={`/students/${s.id}`} className="min-w-0 group">
                <p className="font-heading text-base text-ink group-hover:text-gold transition-colors truncate">
                  {s.displayName ?? 'Unnamed student'}
                </p>
                <p className="text-xs font-sans text-ink-muted">
                  Added {new Date(s.linkedAt).toLocaleDateString()}
                </p>
              </Link>
              <button
                onClick={() => handleRemove(s.id)}
                disabled={removingId === s.id}
                className="shrink-0 text-xs font-sans text-ink-muted hover:text-crimson transition-colors disabled:opacity-60"
              >
                {removingId === s.id ? 'Removing…' : 'Remove'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
