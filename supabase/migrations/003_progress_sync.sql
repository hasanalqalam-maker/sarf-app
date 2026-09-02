-- ============================================================
-- Progress sync: upsert targets + per-user scalar stats
-- ============================================================
-- Step 3 mirrors the client's localStorage progress into these tables.
-- One completion row per (user, exercise) and per (user, game); the
-- latest attempt wins. `user_stats` holds the scalar progress fields that
-- don't belong in the normalised tables (streak counters, running totals,
-- last-played pointer, recent-activity feed).

-- Track attempt counts on the completion rows -------------------------------
alter table public.exercise_completions
  add column if not exists attempts integer not null default 1;
alter table public.game_completions
  add column if not exists attempts integer not null default 1;

-- Unique keys so PostgREST upserts have a conflict target ------------------
alter table public.exercise_completions
  drop constraint if exists exercise_completions_user_exercise_key;
alter table public.exercise_completions
  add constraint exercise_completions_user_exercise_key unique (user_id, exercise_id);

alter table public.game_completions
  drop constraint if exists game_completions_user_game_key;
alter table public.game_completions
  add constraint game_completions_user_game_key unique (user_id, game_id);

-- Scalar per-user progress -------------------------------------------------
create table if not exists public.user_stats (
  user_id             uuid primary key references public.profiles on delete cascade,
  current_streak      integer not null default 0,
  longest_streak      integer not null default 0,
  last_activity_date  date,
  last_played_game_id text,
  total_answered      integer not null default 0,
  total_correct       integer not null default 0,
  recent_activity     jsonb not null default '[]'::jsonb,
  updated_at          timestamptz not null default now()
);

alter table public.user_stats enable row level security;

drop policy if exists "Users manage own stats" on public.user_stats;
create policy "Users manage own stats"
  on public.user_stats for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Teachers view student stats" on public.user_stats;
create policy "Teachers view student stats"
  on public.user_stats for select
  using (
    exists (
      select 1 from public.teacher_students
      where teacher_id = auth.uid() and student_id = user_stats.user_id
    )
  );
