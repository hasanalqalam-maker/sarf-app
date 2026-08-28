-- ============================================================
-- Fix: persist `role` from signup metadata + self-insert fallback
-- ============================================================
-- The original handle_new_user() only copied display_name, so every
-- signup landed as 'student' regardless of the role chosen at signup.
-- This migration:
--   1. Rewrites the trigger to also read raw_user_meta_data->>'role'
--      (validated against the allowed values, defaulting to 'student').
--   2. Adds an INSERT RLS policy so an authenticated user can create
--      their own profile row if the trigger ever fails or doesn't fire.

-- 1. Trigger function ----------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'display_name',
    coalesce(
      case
        when new.raw_user_meta_data->>'role' in ('student', 'teacher')
          then new.raw_user_meta_data->>'role'
      end,
      'student'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2. Self-insert fallback policy ---------------------------------------------
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);
