/**
 * Supabase mirror for the progress store.
 *
 * localStorage stays the working copy for a snappy UI; these functions push
 * each change up to the signed-in user's account and pull it back on login.
 * Every completion is stored as a single upserted row (latest attempt wins),
 * matching the localStorage model.
 */
import { supabase } from './supabase';
import type {
  StoredState,
  SighaProgressEntry,
  GameSessionEntry,
} from './progressContext';
import type { ExerciseSessionEntry } from './exerciseData';

// ── Constants ─────────────────────────────────────────────────────────────────

const EXERCISE_THRESHOLD = 70; // percent — matches recordExerciseSession
const GAME_THRESHOLD = 80; // percent — matches recordGameSession

const gameUnit = (id: string): number => (id.startsWith('u2-') ? 2 : 1);
const exerciseUnit = (id: string): number => {
  const m = id.match(/^u(\d+)-/);
  return m ? Number(m[1]) : 1;
};

const iso = (ms: number): string | null => (ms ? new Date(ms).toISOString() : null);

/** Throw on a PostgREST error so callers' .catch() sees it. */
function check<T extends { error: unknown }>(res: T): T {
  if (res.error) throw res.error;
  return res;
}

// ── Push (single row) ────────────────────────────────────────────────────────

export async function pushExerciseCompletion(
  userId: string,
  exerciseId: string,
  e: ExerciseSessionEntry,
): Promise<void> {
  check(
    await supabase.from('exercise_completions').upsert(
      {
        user_id: userId,
        exercise_id: exerciseId,
        unit: exerciseUnit(exerciseId),
        score: e.score,
        total: e.total,
        attempts: e.attempts,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,exercise_id' },
    ),
  );
}

export async function pushGameCompletion(
  userId: string,
  gameId: string,
  g: GameSessionEntry,
): Promise<void> {
  check(
    await supabase.from('game_completions').upsert(
      {
        user_id: userId,
        game_id: gameId,
        unit: gameUnit(gameId),
        score: g.score, // stored as a 0–100 percentage
        total: 100,
        attempts: g.attempts,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,game_id' },
    ),
  );
}

/** key is `${babId}|${sighaId}|${paradigm}` — the localStorage sighaProgress key. */
export async function pushSighaMastery(
  userId: string,
  key: string,
  s: SighaProgressEntry,
): Promise<void> {
  const [babId, sighaId, tense] = key.split('|');
  check(
    await supabase.from('sigha_mastery').upsert(
      {
        user_id: userId,
        sigha_id: sighaId,
        bab_id: babId,
        tense,
        correct_streak: s.correctStreak,
        total_attempts: s.seen,
        mastered: s.mastered,
        last_seen_at: iso(s.lastSeen),
      },
      { onConflict: 'user_id,sigha_id,bab_id,tense' },
    ),
  );
}

export async function pushUserStats(userId: string, s: StoredState): Promise<void> {
  check(
    await supabase.from('user_stats').upsert(
      {
        user_id: userId,
        current_streak: s.currentStreak,
        longest_streak: s.longestStreak,
        last_activity_date: s.lastActivityDate || null,
        last_played_game_id: s.lastPlayedGameId,
        total_answered: s.totalAnswered,
        total_correct: s.totalCorrect,
        recent_activity: s.recentActivity,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    ),
  );
}

// ── Push (whole state — used once on login reconciliation) ───────────────────

export async function pushAll(userId: string, s: StoredState): Promise<void> {
  const jobs: PromiseLike<unknown>[] = [pushUserStats(userId, s)];

  const exRows = Object.entries(s.exerciseSessions).map(([exercise_id, e]) => ({
    user_id: userId,
    exercise_id,
    unit: exerciseUnit(exercise_id),
    score: e.score,
    total: e.total,
    attempts: e.attempts,
  }));
  if (exRows.length) {
    jobs.push(
      supabase
        .from('exercise_completions')
        .upsert(exRows, { onConflict: 'user_id,exercise_id' })
        .then(check),
    );
  }

  const gameRows = Object.entries(s.gameSessions).map(([game_id, g]) => ({
    user_id: userId,
    game_id,
    unit: gameUnit(game_id),
    score: g.score,
    total: 100,
    attempts: g.attempts,
  }));
  if (gameRows.length) {
    jobs.push(
      supabase
        .from('game_completions')
        .upsert(gameRows, { onConflict: 'user_id,game_id' })
        .then(check),
    );
  }

  const sighaRows = Object.entries(s.sighaProgress).map(([key, v]) => {
    const [bab_id, sigha_id, tense] = key.split('|');
    return {
      user_id: userId,
      sigha_id,
      bab_id,
      tense,
      correct_streak: v.correctStreak,
      total_attempts: v.seen,
      mastered: v.mastered,
      last_seen_at: iso(v.lastSeen),
    };
  });
  if (sighaRows.length) {
    jobs.push(
      supabase
        .from('sigha_mastery')
        .upsert(sighaRows, { onConflict: 'user_id,sigha_id,bab_id,tense' })
        .then(check),
    );
  }

  await Promise.all(jobs);
}

export async function wipeRemote(userId: string): Promise<void> {
  await Promise.all([
    supabase.from('exercise_completions').delete().eq('user_id', userId).then(check),
    supabase.from('game_completions').delete().eq('user_id', userId).then(check),
    supabase.from('sigha_mastery').delete().eq('user_id', userId).then(check),
    supabase.from('user_stats').delete().eq('user_id', userId).then(check),
  ]);
}

// ── Pull ─────────────────────────────────────────────────────────────────────

export async function hydrateFromSupabase(userId: string): Promise<Partial<StoredState>> {
  const [exRes, gameRes, sighaRes, statsRes] = await Promise.all([
    supabase
      .from('exercise_completions')
      .select('exercise_id, score, total, attempts')
      .eq('user_id', userId),
    supabase.from('game_completions').select('game_id, score, attempts').eq('user_id', userId),
    supabase
      .from('sigha_mastery')
      .select('sigha_id, bab_id, tense, correct_streak, total_attempts, mastered, last_seen_at')
      .eq('user_id', userId),
    supabase.from('user_stats').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  const out: Partial<StoredState> = {};

  if (exRes.data) {
    const exerciseSessions: Record<string, ExerciseSessionEntry> = {};
    for (const r of exRes.data as ExerciseRow[]) {
      const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
      exerciseSessions[r.exercise_id] = {
        score: r.score,
        total: r.total,
        completed: pct >= EXERCISE_THRESHOLD,
        attempts: r.attempts ?? 1,
        bestPct: pct,
      };
    }
    out.exerciseSessions = exerciseSessions;
  }

  if (gameRes.data) {
    const gameSessions: Record<string, GameSessionEntry> = {};
    for (const r of gameRes.data as GameRow[]) {
      gameSessions[r.game_id] = {
        score: r.score,
        completed: r.score >= GAME_THRESHOLD,
        attempts: r.attempts ?? 1,
      };
    }
    out.gameSessions = gameSessions;
  }

  if (sighaRes.data) {
    const sighaProgress: Record<string, SighaProgressEntry> = {};
    for (const r of sighaRes.data as SighaRow[]) {
      sighaProgress[`${r.bab_id}|${r.sigha_id}|${r.tense}`] = {
        seen: r.total_attempts,
        correctStreak: r.correct_streak,
        mastered: r.mastered,
        lastSeen: r.last_seen_at ? new Date(r.last_seen_at).getTime() : 0,
      };
    }
    out.sighaProgress = sighaProgress;
  }

  const st = statsRes.data as StatsRow | null;
  if (st) {
    out.currentStreak = st.current_streak;
    out.longestStreak = st.longest_streak;
    out.lastActivityDate = st.last_activity_date ?? '';
    out.lastPlayedGameId = st.last_played_game_id ?? null;
    out.totalAnswered = st.total_answered;
    out.totalCorrect = st.total_correct;
    out.recentActivity = Array.isArray(st.recent_activity) ? st.recent_activity : [];
  }

  return out;
}

// ── Merge ────────────────────────────────────────────────────────────────────

/**
 * Fold a hydrated remote state into the local one. Union every record map;
 * on a key collision keep the stronger entry (more attempts / higher score /
 * either-completed). Scalars take the max. Used once per login before the
 * reconciled result is pushed back up.
 */
export function mergeStates(local: StoredState, remote: Partial<StoredState>): StoredState {
  const merged: StoredState = { ...local };

  merged.sighaProgress = { ...local.sighaProgress };
  for (const [k, r] of Object.entries(remote.sighaProgress ?? {})) {
    const l = merged.sighaProgress[k];
    merged.sighaProgress[k] = !l || r.seen >= l.seen ? r : l;
  }

  merged.gameSessions = { ...local.gameSessions };
  for (const [k, r] of Object.entries(remote.gameSessions ?? {})) {
    const l = merged.gameSessions[k];
    merged.gameSessions[k] = l
      ? {
          score: Math.max(l.score, r.score),
          completed: l.completed || r.completed,
          attempts: Math.max(l.attempts, r.attempts),
        }
      : r;
  }

  merged.exerciseSessions = { ...local.exerciseSessions };
  for (const [k, r] of Object.entries(remote.exerciseSessions ?? {})) {
    const l = merged.exerciseSessions[k];
    if (!l) {
      merged.exerciseSessions[k] = r;
      continue;
    }
    const best = r.bestPct >= l.bestPct ? r : l;
    merged.exerciseSessions[k] = {
      ...best,
      completed: l.completed || r.completed,
      attempts: Math.max(l.attempts, r.attempts),
    };
  }

  merged.currentStreak = Math.max(local.currentStreak, remote.currentStreak ?? 0);
  merged.longestStreak = Math.max(local.longestStreak, remote.longestStreak ?? 0);
  merged.lastActivityDate =
    [local.lastActivityDate, remote.lastActivityDate ?? ''].sort().pop() ?? '';
  merged.lastPlayedGameId = remote.lastPlayedGameId ?? local.lastPlayedGameId;
  merged.totalAnswered = Math.max(local.totalAnswered, remote.totalAnswered ?? 0);
  merged.totalCorrect = Math.max(local.totalCorrect, remote.totalCorrect ?? 0);

  const seen = new Set<number>();
  merged.recentActivity = [...local.recentActivity, ...(remote.recentActivity ?? [])]
    .sort((a, b) => b.timestamp - a.timestamp)
    .filter((a) => (seen.has(a.timestamp) ? false : (seen.add(a.timestamp), true)))
    .slice(0, 20);

  return merged;
}

// ── Row shapes ───────────────────────────────────────────────────────────────

interface ExerciseRow {
  exercise_id: string;
  score: number;
  total: number;
  attempts: number | null;
}
interface GameRow {
  game_id: string;
  score: number;
  attempts: number | null;
}
interface SighaRow {
  sigha_id: string;
  bab_id: string;
  tense: string;
  correct_streak: number;
  total_attempts: number;
  mastered: boolean;
  last_seen_at: string | null;
}
interface StatsRow {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  last_played_game_id: string | null;
  total_answered: number;
  total_correct: number;
  recent_activity: unknown;
}
