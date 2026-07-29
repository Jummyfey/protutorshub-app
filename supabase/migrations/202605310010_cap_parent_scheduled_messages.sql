-- Make parent scheduled emails idempotent and cap them to the requested daily volume.
-- A scheduled day may send at most one reminder email and one report email.

delete from public.parent_alert_notifications a
using public.parent_alert_notifications b
where a.event_id is not null
  and b.event_id is not null
  and a.channel = b.channel
  and coalesce(a.recipient, '') = coalesce(b.recipient, '')
  and a.event_id = b.event_id
  and a.id > b.id;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'parent_alert_notifications_event_channel_recipient_key'
  ) then
    alter table public.parent_alert_notifications
      add constraint parent_alert_notifications_event_channel_recipient_key
      unique (event_id, channel, recipient);
  end if;
end $$;
