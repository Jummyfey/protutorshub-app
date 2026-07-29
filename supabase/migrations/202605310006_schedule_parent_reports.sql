-- Check parent daily and weekly report rules every hour.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('send-parent-study-reports')
where exists (
  select 1
  from cron.job
  where jobname = 'send-parent-study-reports'
);

select cron.schedule(
  'send-parent-study-reports',
  '0 * * * *',
  $$
  select
    net.http_post(
      url := 'https://phgmevpiijmcgalrkvwy.supabase.co/functions/v1/send-parent-reports',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  $$
);
