-- อนุญาตให้อัพโหลดวิดีโอสั้นใน bucket place-images (โฆษณา sidebar)
-- รันหลัง create-storage-bucket.sql

update storage.buckets
set
  allowed_mime_types = array[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm'
  ],
  file_size_limit = 20971520
where id = 'place-images';

select id, allowed_mime_types, file_size_limit from storage.buckets where id = 'place-images';
