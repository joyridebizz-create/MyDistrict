-- ============================================================
-- สร้าง Admin User สำหรับ District Guide
-- ============================================================
-- วิธีที่แนะนำ: ผ่าน Supabase Dashboard
--   Authentication → Users → "Add user" → ใส่ email + password
-- ============================================================

-- ============================================================
-- หลังสร้าง admin user แล้ว ให้ลบ anon write policies ออก
-- (ปัจจุบันเปิดไว้สำหรับ dev เท่านั้น)
-- ============================================================

-- drop policy "places_anon_write" on places;
-- drop policy "nodes_anon_write"  on nodes;

-- ============================================================
-- ตรวจสอบ policies ที่ active อยู่
-- ============================================================

-- select schemaname, tablename, policyname, roles, cmd
-- from pg_policies
-- where tablename in ('places', 'nodes')
-- order by tablename, policyname;
