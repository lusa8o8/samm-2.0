alter table public.academic_calendar
  drop constraint if exists academic_calendar_event_type_check;

-- Replace legacy academic-calendar event_type storage values with the
-- universal event types already used by the UI and coordinator contracts.
update public.academic_calendar
set event_type = case event_type
  when 'registration' then 'launch'
  when 'registration_window' then 'launch'
  when 'graduation' then 'promotion'
  when 'graduation_event' then 'promotion'
  when 'holiday' then 'seasonal'
  when 'holiday_break' then 'seasonal'
  when 'holiday_window' then 'seasonal'
  when 'orientation' then 'community'
  when 'orientation_week' then 'community'
  when 'exam' then 'deadline'
  when 'exam_window' then 'deadline'
  else case
    when event_type in ('launch', 'promotion', 'seasonal', 'community', 'deadline', 'other') then event_type
    else 'other'
  end
end
where event_type not in ('launch', 'promotion', 'seasonal', 'community', 'deadline', 'other');

alter table public.academic_calendar
  add constraint academic_calendar_event_type_check
  check (event_type in ('launch', 'promotion', 'seasonal', 'community', 'deadline', 'other'));
