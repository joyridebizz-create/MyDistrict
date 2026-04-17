-- ⚠️  Development only — allow anon to write places & nodes
-- Replace with proper Supabase Auth before going to production

create policy "places_anon_write" on places
  for all to anon using (true) with check (true);

create policy "nodes_anon_write" on nodes
  for all to anon using (true) with check (true);
