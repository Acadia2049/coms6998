-- Let signed-in users undo their own votes and delete their own captions.

begin;

drop policy if exists "Owners can delete own captions" on public.captions;

create policy "Owners can delete own captions"
on public.captions
for delete
to authenticated
using (user_id = (select auth.uid()));

grant delete on table public.captions to authenticated;

drop policy if exists "Users can remove own votes" on public.votes;

create policy "Users can remove own votes"
on public.votes
for delete
to authenticated
using (user_id = (select auth.uid()));

grant delete on table public.votes to authenticated;

-- Keep the cached public score correct when a vote is removed. This also runs
-- harmlessly for votes removed by the captions ON DELETE CASCADE constraint.
create or replace function public.decrement_caption_vote_score()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    update public.captions
    set vote_score = greatest(vote_score - old.vote, 0)
    where id = old.caption_id;

    return old;
end;
$$;

revoke all on function public.decrement_caption_vote_score() from public;

drop trigger if exists votes_decrement_caption_score on public.votes;

create trigger votes_decrement_caption_score
after delete on public.votes
for each row
execute function public.decrement_caption_vote_score();

commit;
