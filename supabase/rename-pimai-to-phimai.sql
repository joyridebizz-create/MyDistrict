-- ============================================================
-- Migration: เปลี่ยน node id จาก 'pimai' → 'phimai'
-- Run ใน Supabase SQL Editor
-- ============================================================

-- 1. เพิ่ม ON UPDATE CASCADE ชั่วคราว (ถ้า FK ยังไม่มี)
alter table places
  drop constraint if exists places_node_id_fkey,
  add constraint places_node_id_fkey
    foreign key (node_id)
    references nodes(id)
    on delete cascade
    on update cascade;

-- 2. เปลี่ยน id ใน nodes (FK จะ cascade ไป places อัตโนมัติ)
update nodes set id = 'phimai' where id = 'pimai';

-- 3. ตรวจสอบผลลัพธ์
select id, name, province from nodes where id = 'phimai';
select count(*) as place_count, node_id from places where node_id = 'phimai' group by node_id;
