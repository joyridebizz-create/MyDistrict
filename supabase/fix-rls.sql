-- Fix RLS: allow anon to read active places
-- (node_id isolation is already enforced at query level by the frontend)

drop policy if exists "places_by_node" on places;

create policy "places_public_read" on places
  for select using (is_active = true);
