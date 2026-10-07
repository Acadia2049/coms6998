-- NYC After Dark: Week 4 database mutations and RLS.
--
-- This migration is intentionally non-destructive:
-- - The three legacy captions remain in the table.
-- - They keep published_at = null, so the new policies hide them from the
--   public feed until they are deliberately migrated or removed later.
-- - The existing profiles and jokes tables are not changed.

begin;

-- ---------------------------------------------------------------------------
-- Captions become authenticated, AI-generated submissions.
-- A null published_at means "private draft"; a non-null value means "public".
-- ---------------------------------------------------------------------------

alter table public.captions
    add column if not exists prompt text,
    add column if not exists user_id uuid references auth.users(id) on delete cascade,
    add column if not exists challenge_date date,
    add column if not exists challenge_text text,
    add column if not exists published_at timestamptz,
    add column if not exists vote_score integer not null default 0;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'captions_vote_score_nonnegative'
          and conrelid = 'public.captions'::regclass
    ) then
        alter table public.captions
            add constraint captions_vote_score_nonnegative
            check (vote_score >= 0);
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conname = 'captions_published_payload_complete'
          and conrelid = 'public.captions'::regclass
    ) then
        alter table public.captions
            add constraint captions_published_payload_complete
            check (
                published_at is null
                or (
                    user_id is not null
                    and prompt is not null
                    and nullif(btrim(prompt), '') is not null
                    and challenge_date is not null
                    and challenge_text is not null
                    and nullif(btrim(challenge_text), '') is not null
                    and text is not null
                    and nullif(btrim(text), '') is not null
                )
            );
    end if;
end
$$;

create index if not exists captions_public_feed_idx
    on public.captions (challenge_date, vote_score desc, published_at desc)
    where published_at is not null;

create index if not exists captions_owner_drafts_idx
    on public.captions (user_id, created_at desc)
    where published_at is null;

alter table public.captions enable row level security;

-- Remove the Week 2 policy that exposes every caption, including future drafts.
drop policy if exists "Enable read access for all users" on public.captions;

-- Make the migration safe to re-run while it is being developed.
drop policy if exists "Anyone can view published captions" on public.captions;
drop policy if exists "Authenticated users can view published captions and own drafts" on public.captions;
drop policy if exists "Authenticated users can create own drafts" on public.captions;
drop policy if exists "Owners can publish own drafts" on public.captions;

create policy "Anyone can view published captions"
on public.captions
for select
to anon
using (published_at is not null);

create policy "Authenticated users can view published captions and own drafts"
on public.captions
for select
to authenticated
using (
    published_at is not null
    or user_id = (select auth.uid())
);

create policy "Authenticated users can create own drafts"
on public.captions
for insert
to authenticated
with check (
    user_id = (select auth.uid())
    and published_at is null
    and vote_score = 0
    and text is not null
    and nullif(btrim(text), '') is not null
    and prompt is not null
    and nullif(btrim(prompt), '') is not null
    and challenge_date is not null
    and challenge_text is not null
    and nullif(btrim(challenge_text), '') is not null
);

-- Publishing is a one-way update: only an owner can turn their draft into a
-- published caption. Published captions cannot be edited again in the MVP.
create policy "Owners can publish own drafts"
on public.captions
for update
to authenticated
using (
    user_id = (select auth.uid())
    and published_at is null
)
with check (
    user_id = (select auth.uid())
    and published_at is not null
    and text is not null
    and nullif(btrim(text), '') is not null
    and prompt is not null
    and nullif(btrim(prompt), '') is not null
    and challenge_date is not null
    and challenge_text is not null
    and nullif(btrim(challenge_text), '') is not null
);

-- RLS limits rows; grants additionally limit which operations and columns the
-- API roles may request. user_id, prompt, challenge data, and vote_score cannot
-- be changed after insertion by an authenticated client.
revoke all on table public.captions from anon, authenticated;
grant select (id, created_at, text, challenge_date, challenge_text, published_at, vote_score)
    on public.captions to anon;
grant select on table public.captions to authenticated;
grant insert (text, prompt, user_id, challenge_date, challenge_text)
    on public.captions to authenticated;
grant update (text, published_at)
    on public.captions to authenticated;

-- Identity/serial defaults use a sequence. Restrict it to signed-in inserts.
do $$
declare
    captions_id_sequence text;
begin
    captions_id_sequence := pg_get_serial_sequence('public.captions', 'id');

    if captions_id_sequence is not null then
        execute format(
            'revoke all on sequence %s from anon, authenticated',
            captions_id_sequence
        );
        execute format(
            'grant usage, select on sequence %s to authenticated',
            captions_id_sequence
        );
    end if;
end
$$;

-- ---------------------------------------------------------------------------
-- One positive "FIRE" vote per authenticated user and caption.
-- ---------------------------------------------------------------------------

create table if not exists public.votes (
    id bigint generated by default as identity primary key,
    created_at timestamptz not null default now(),
    caption_id bigint not null references public.captions(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    vote smallint not null default 1 check (vote = 1),
    constraint votes_one_per_user_per_caption unique (caption_id, user_id)
);

create index if not exists votes_user_id_idx
    on public.votes (user_id, created_at desc);

alter table public.votes enable row level security;

drop policy if exists "Users can view own votes" on public.votes;
drop policy if exists "Users can vote as themselves" on public.votes;

create policy "Users can view own votes"
on public.votes
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can vote as themselves"
on public.votes
for insert
to authenticated
with check (
    user_id = (select auth.uid())
    and vote = 1
    and exists (
        select 1
        from public.captions
        where captions.id = caption_id
          and captions.published_at is not null
    )
);

revoke all on table public.votes from anon, authenticated;
grant select on table public.votes to authenticated;
grant insert (caption_id, user_id) on public.votes to authenticated;
revoke all on sequence public.votes_id_seq from anon, authenticated;
grant usage, select on sequence public.votes_id_seq to authenticated;

-- Keep the public score on captions without exposing voter identities.
create or replace function public.increment_caption_vote_score()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    update public.captions
    set vote_score = vote_score + new.vote
    where id = new.caption_id
      and published_at is not null;

    if not found then
        raise exception 'Votes can only target published captions';
    end if;

    return new;
end;
$$;

revoke all on function public.increment_caption_vote_score() from public;

drop trigger if exists votes_increment_caption_score on public.votes;

create trigger votes_increment_caption_score
after insert on public.votes
for each row
execute function public.increment_caption_vote_score();

commit;
