-- Follow-up for databases where the main Week 4 migration was already run.
-- Public visitors only need feed fields; generation prompts and auth user IDs
-- remain unavailable to the anonymous role.

begin;

revoke select on table public.captions from anon;

grant select (
    id,
    created_at,
    text,
    challenge_date,
    challenge_text,
    published_at,
    vote_score
) on public.captions to anon;

commit;
