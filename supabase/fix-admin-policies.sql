-- ============================================================
-- แก้ admin policies ให้ระบุ TO authenticated ชัดเจน
-- roles จะแสดงเป็น {authenticated} แทน {public}
-- ============================================================

-- ลบ policies เดิมที่ใช้ auth.role() condition
drop policy if exists "places_admin_all" on places;
drop policy if exists "nodes_admin_all"  on nodes;

-- สร้างใหม่โดยระบุ TO authenticated โดยตรง
create policy "places_admin_all" on places
  for all
  to authenticated
  using (true)
  with check (true);

create policy "nodes_admin_all" on nodes
  for all
  to authenticated
  using (true)
  with check (true);

-- ตรวจสอบผลลัพธ์ (ควรเห็น {authenticated} ใน roles)
select tablename, policyname, roles, cmd
from pg_policies
where tablename in ('places', 'nodes')
order by tablename, policyname;
