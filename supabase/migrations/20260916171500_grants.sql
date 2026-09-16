-- Table privileges. This project has no blanket grants to the API roles, so
-- each table is opened explicitly; RLS (see the initial schema) then narrows
-- every row to its owner. anon only ever reads the heartbeat row.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.answer_log to authenticated;
grant select, insert, update, delete on table public.leitner_state to authenticated;
grant select, insert, update, delete on table public.daily_results to authenticated;

-- answer_log.id is an identity column; inserts need the sequence.
grant usage on all sequences in schema public to authenticated;

grant select on table public.heartbeat to anon, authenticated;
