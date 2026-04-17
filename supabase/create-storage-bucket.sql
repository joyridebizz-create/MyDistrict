-- ============================================================
-- สร้าง Storage Bucket สำหรับเก็บภาพสถานที่
-- ============================================================

-- สร้าง bucket ชื่อ place-images (public)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'place-images',
  'place-images',
  true,
  5242880,   -- 5MB per file limit (จริงๆ หลังบีบอัดจะเล็กกว่ามาก)
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Policy: ทุกคนอ่านได้ (public CDN)
create policy "place-images public read"
  on storage.objects for select
  using (bucket_id = 'place-images');

-- Policy: admin อัพโหลด/ลบได้
create policy "place-images admin upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'place-images');

create policy "place-images admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'place-images');

create policy "place-images admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'place-images');

-- ตรวจสอบ
select id, name, public from storage.buckets where id = 'place-images';
