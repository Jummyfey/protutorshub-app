-- Reduce parent message noise: keep the in-app dashboard live, and send only
-- one reminder plus one daily report on scheduled lesson days.

alter table public.parent_timetables
  alter column reminder_minutes set default 15;

update public.parent_timetables
set reminder_minutes = 15
where reminder_minutes is null or reminder_minutes = 10;

alter table public.parent_notification_preferences
  alter column enable_parent_dashboard set default true,
  alter column receive_daily_report set default true,
  alter column receive_weekly_report set default false;

update public.parent_notification_preferences
set
  enable_parent_dashboard = true,
  receive_daily_report = true,
  receive_weekly_report = false,
  enable_whatsapp_alerts = false,
  updated_at = now();
