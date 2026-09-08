/**
 * Teacher-side data access: roster management + reading a student's progress.
 * All of this is gated by the "Teachers view student …" RLS policies, so a
 * non-teacher (or a teacher asking about an unlinked student) simply gets
 * nothing back.
 */
import { supabase } from './supabase';
import { hydrateFromSupabase } from './progressSync';
import { summarizeProgress, type ProgressSummary } from './progressSummary';

export interface Student {
  id: string;
  displayName: string | null;
  linkedAt: string;
}

export async function listStudents(): Promise<Student[]> {
  const { data: links, error } = await supabase
    .from('teacher_students')
    .select('student_id, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  if (!links?.length) return [];

  const ids = links.map((l) => l.student_id as string);
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', ids);
  if (pErr) throw pErr;

  const nameById = new Map((profiles ?? []).map((p) => [p.id as string, p.display_name as string | null]));
  return links.map((l) => ({
    id: l.student_id as string,
    displayName: nameById.get(l.student_id as string) ?? null,
    linkedAt: l.created_at as string,
  }));
}

export async function addStudentByEmail(
  email: string,
): Promise<{ student: Student | null; error: string | null }> {
  const { data, error } = await supabase.rpc('add_student_by_email', {
    p_email: email,
  });
  if (error) return { student: null, error: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return { student: null, error: 'No account found for that email' };
  return {
    student: {
      id: row.student_id as string,
      displayName: (row.display_name as string | null) ?? null,
      linkedAt: new Date().toISOString(),
    },
    error: null,
  };
}

export async function removeStudent(studentId: string): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('teacher_students')
    .delete()
    .eq('student_id', studentId);
  return { error: error?.message ?? null };
}

export interface StudentDetail {
  id: string;
  displayName: string | null;
  summary: ProgressSummary;
}

/** Read a linked student's progress and roll it up. Returns null if not visible. */
export async function getStudentDetail(studentId: string): Promise<StudentDetail | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', studentId)
    .maybeSingle();
  if (!profile) return null;

  const state = await hydrateFromSupabase(studentId);
  return {
    id: profile.id as string,
    displayName: (profile.display_name as string | null) ?? null,
    summary: summarizeProgress(state),
  };
}
