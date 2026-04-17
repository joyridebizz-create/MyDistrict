-- ============================================================
-- ลบ anon write policies (DEV ONLY)
-- เหลือเฉพาะ authenticated admin เท่านั้นที่ write ได้
-- ============================================================

drop policy if exists "places_anon_write" on places;
drop policy if exists "nodes_anon_write"  on nodes;

-- ============================================================
-- ตรวจสอบ policies ที่เหลืออยู่ (ควรเห็น 4 policies)
-- ============================================================
-- nodes_public_read   → SELECT is_active=true (ทุกคนอ่านได้)
-- places_public_read  → SELECT is_active=true (ทุกคนอ่านได้)
-- nodes_admin_all     → ALL for authenticated  (admin เท่านั้น)
-- places_admin_all    → ALL for authenticated  (admin เท่านั้น)
-- ============================================================

select tablename, policyname, roles, cmd
from pg_policies
where tablename in ('places', 'nodes')
order by tablename, policyname;
