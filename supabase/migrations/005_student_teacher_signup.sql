-- ============================================================
-- Student self-registration to a teacher at signup
-- ============================================================
-- A student can now optionally pick a teacher during signup (or stay
-- independent). This adds:
--   1. list_teachers(): a minimal public directory (id + display_name
--      only) so the signup form can offer a picker before the account
--      (and therefore any session/RLS visibility) exists.
--   2. handle_new_user() extended to read `teacher_id` from the signup
--      metadata and create the teacher_students link atomically with
--      the profile row, if it's a real teacher's id. Invalid/garbage
--      teacher_id values are ignored (regex-validated before casting,
--      rather than try/cast) rather than failing the signup.
--
-- The existing "add student by email" RPC (004) is untouched and stays
-- available as a fallback for linking an already-registered independent
-- student to a teacher later.

-- 1. Public teacher directory -------------------------------------------------
create or replace function public.list_teachers()
returns table (id uuid, display_name text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.display_name
  from public.profiles p
  where p.role = 'teacher'
  order by p.display_name nulls last;
$$;

revoke all on function public.list_teachers() from public;
grant execute on function public.list_teachers() to anon, authenticated;

-- 2. Trigger: persist role (as before) + optionally link to a teacher --------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_teacher_id_raw text;
  v_teacher_id uuid;
begin
  v_role := coalesce(
    case
      when new.raw_user_meta_data->>'role' in ('student', 'teacher')
        then new.raw_user_meta_data->>'role'
    end,
    'student'
  );

  insert into public.profiles (id, display_name, role)
  values (new.id, new.raw_user_meta_data->>'display_name', v_role)
  on conflict (id) do nothing;

  v_teacher_id_raw := new.raw_user_meta_data->>'teacher_id';

  if v_role = 'student' and v_teacher_id_raw ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    v_teacher_id := v_teacher_id_raw::uuid;

    if exists (select 1 from public.profiles where id = v_teacher_id and role = 'teacher') then
      insert into public.teacher_students (teacher_id, student_id)
      values (v_teacher_id, new.id)
      on conflict (teacher_id, student_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;
