# Pro Tutors Hub Backend Setup

This app is now prepared for Supabase while still working with localStorage.

## What Syncs

- User package: `free`, `standard`, `elite`
- Study plan preferences
- Elite parent schedule
- Practice/mock attempts
- Child activity events placeholder
- Parent report placeholder table

## Environment Variables

Create a local `.env` file from `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

When these values are missing, the app automatically falls back to localStorage.

## Database

Run this SQL migration in Supabase SQL Editor:

```text
supabase/migrations/202605250001_pro_tutors_backend.sql
```

## Important Security Note

The migration includes temporary review policies so the current frontend-only app can sync before login/auth is built.

Before storing real student data, replace those policies with Supabase Auth policies using `auth.uid()` and proper parent/student account relationships.

## Next Backend Steps

1. Add Supabase Auth for parent/student accounts.
2. Replace local browser `app_user_id` with authenticated user IDs.
3. Add parent-child relationships.
4. Move AI tutor calls and sensitive operations to Supabase Edge Functions.
5. Lock RLS policies before production data collection.