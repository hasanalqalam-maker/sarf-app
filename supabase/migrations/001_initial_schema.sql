-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  display_name text,
  role        text not null default 'student' check (role in ('student', 'teacher')),
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data->>'display_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- exercise_completions
-- ============================================================
create table public.exercise_completions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles on delete cascade,
  exercise_id  text not null,
  unit         integer not null,
  score        integer not null,
  total        integer not null,
  completed_at timestamptz not null default now()
);

-- ============================================================
-- game_completions
-- ============================================================
create table public.game_completions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles on delete cascade,
  game_id      text not null,
  unit         integer not null,
  score        integer not null,
  total        integer not null,
  completed_at timestamptz not null default now()
);

-- ============================================================
-- sigha_mastery
-- ============================================================
create table public.sigha_mastery (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles on delete cascade,
  sigha_id        text not null,
  bab_id          text not null,
  tense           text not null,
  correct_streak  integer not null default 0,
  total_attempts  integer not null default 0,
  total_correct   integer not null default 0,
  mastered        boolean not null default false,
  last_seen_at    timestamptz,
  unique (user_id, sigha_id, bab_id, tense)
);

-- ============================================================
-- teacher_students
-- ============================================================
create table public.teacher_students (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles on delete cascade,
  student_id uuid not null references public.profiles on delete cascade,
  created_at timestamptz not null default now(),
  unique (teacher_id, student_id)
);

-- ============================================================
-- streaks
-- ============================================================
create table public.streaks (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles on delete cascade,
  date                date not null,
  exercises_completed integer not null default 0,
  games_completed     integer not null default 0,
  unique (user_id, date)
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles          enable row level security;
alter table public.exercise_completions enable row level security;
alter table public.game_completions  enable row level security;
alter table public.sigha_mastery     enable row level security;
alter table public.teacher_students  enable row level security;
alter table public.streaks           enable row level security;

-- profiles: users read/update their own row; teachers can read student rows
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Teachers can view profiles of their students
create policy "Teachers can view student profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.teacher_students
      where teacher_id = auth.uid() and student_id = profiles.id
    )
  );

-- exercise_completions: own rows only (teachers can read their students')
create policy "Users manage own exercise completions"
  on public.exercise_completions for all
  using (auth.uid() = user_id);

create policy "Teachers view student exercise completions"
  on public.exercise_completions for select
  using (
    exists (
      select 1 from public.teacher_students
      where teacher_id = auth.uid() and student_id = exercise_completions.user_id
    )
  );

-- game_completions
create policy "Users manage own game completions"
  on public.game_completions for all
  using (auth.uid() = user_id);

create policy "Teachers view student game completions"
  on public.game_completions for select
  using (
    exists (
      select 1 from public.teacher_students
      where teacher_id = auth.uid() and student_id = game_completions.user_id
    )
  );

-- sigha_mastery
create policy "Users manage own sigha mastery"
  on public.sigha_mastery for all
  using (auth.uid() = user_id);

create policy "Teachers view student sigha mastery"
  on public.sigha_mastery for select
  using (
    exists (
      select 1 from public.teacher_students
      where teacher_id = auth.uid() and student_id = sigha_mastery.user_id
    )
  );

-- teacher_students: teachers manage their own links; students can see who their teacher is
create policy "Teachers manage their student links"
  on public.teacher_students for all
  using (auth.uid() = teacher_id);

create policy "Students view their teacher links"
  on public.teacher_students for select
  using (auth.uid() = student_id);

-- streaks
create policy "Users manage own streaks"
  on public.streaks for all
  using (auth.uid() = user_id);

create policy "Teachers view student streaks"
  on public.streaks for select
  using (
    exists (
      select 1 from public.teacher_students
      where teacher_id = auth.uid() and student_id = streaks.user_id
    )
  );
