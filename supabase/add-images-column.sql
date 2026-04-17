-- ============================================================
-- เพิ่ม column images (array of URLs) ใน places
-- ============================================================

alter table places
  add column if not exists images jsonb default '[]'::jsonb;

-- ตรวจสอบ
select id, name, image_url, images from places limit 5;
