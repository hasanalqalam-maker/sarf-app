-- ============================================================
-- Teacher roster: add a student by email
-- ============================================================
-- A teacher can't look up an arbitrary profile (RLS only exposes their
-- already-linked students), and email lives in auth.users, not profiles.
-- This security-definer RPC resolves the email, checks the caller is a
-- teacher, and creates the teacher_students link.

create or replace function public.add_student_by_email(p_email text)
returns table (student_id uuid, display_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher uuid := auth.uid();
  v_student uuid;
begin
  if not exists (
    select 1 from public.profiles where id = v_teacher and role = 'teacher'
  ) then
    raise exception 'Only teachers can add students';
  end if;

  select u.id into v_student
  from auth.users u
  where lower(u.email) = lower(trim(p_email));

  if v_student is null then
    raise exception 'No account found for that email';
  end if;
  if v_student = v_teacher then
    raise exception 'You cannot add yourself';
  end if;

  insert into public.teacher_students (teacher_id, student_id)
  values (v_teacher, v_student)
  on conflict (teacher_id, student_id) do nothing;

  return query
    select p.id, p.display_name
    from public.profiles p
    where p.id = v_student;
end;
$$;

revoke all on function public.add_student_by_email(text) from public;
grant execute on function public.add_student_by_email(text) to authenticated;
