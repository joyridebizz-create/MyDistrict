-- ============================================================
-- เพิ่ม icon_url column ใน categories (สำหรับ custom building icon)
-- ============================================================

alter table categories add column if not exists icon_url text;

-- ตรวจสอบ
select column_name, data_type
from information_schema.columns
where table_name = 'categories' and column_name = 'icon_url';
