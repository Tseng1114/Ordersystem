# Token-based RLS deployment

The active database migration is:

`supabase/migrations/202607170001_secure_event_access.sql`

It enables RLS for `events` and `orders`, removes their public policies, revokes direct anonymous table access, and exposes token-scoped RPC functions.

After applying the migration, deploy the matching frontend and redeploy the `LineBot` Edge Function. Existing event-ID links from before the migration are intentionally unsupported.
