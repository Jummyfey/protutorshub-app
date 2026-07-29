-- Run timetable reminder checks every minute so parent alerts can fire before lessons.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('send-parent-timetable-reminders')
where exists (
  select 1
  from cron.job
  where jobname = 'send-parent-timetable-reminders'
);

select cron.schedule(
  'send-parent-timetable-reminders',
  '* * * * *',
  $$
  select
    net.http_post(
      url := 'https://phgmevpiijmcgalrkvwy.supabase.co/functions/v1/send-timetable-reminders',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  $$
);
