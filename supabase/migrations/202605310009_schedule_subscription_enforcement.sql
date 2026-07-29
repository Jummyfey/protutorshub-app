-- Check subscriptions daily for renewal reminders and expiry downgrades.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('enforce-pro-tutors-subscriptions')
where exists (
  select 1
  from cron.job
  where jobname = 'enforce-pro-tutors-subscriptions'
);

select cron.schedule(
  'enforce-pro-tutors-subscriptions',
  '0 8 * * *',
  $$
  select net.http_post(
      url := 'https://phgmevpiijmcgalrkvwy.supabase.co/functions/v1/enforce-subscriptions',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := '{}'::jsonb
    );
  $$
);
