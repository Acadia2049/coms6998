-- Let an authenticated author replace the text of an unpublished draft.
-- The existing publish policy remains responsible for the one-way transition
-- from published_at = null to a non-null timestamp.

drop policy if exists "Owners can regenerate own drafts" on public.captions;

create policy "Owners can regenerate own drafts"
on public.captions
for update
to authenticated
using (
    user_id = (select auth.uid())
    and published_at is null
)
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
