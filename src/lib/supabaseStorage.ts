import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * แยก bucket + object path จาก Supabase Storage public URL
 * รูปแบบ: .../storage/v1/object/public/{bucket}/{path...}
 */
export function parsePublicStorageUrl(url: string): { bucket: string; path: string } | null {
  if (!url?.trim()) return null
  try {
    const u = new URL(url.trim())
    const m = u.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/)
    if (!m) return null
    return { bucket: m[1], path: decodeURIComponent(m[2]) }
  } catch {
    return null
  }
}

/** ลบไฟล์ใน bucket จาก public URL (ถ้าเป็น URL ของ Supabase Storage เท่านั้น) */
export async function removeStorageFileByPublicUrl(
  client: SupabaseClient,
  publicUrl: string,
  allowedBuckets: string[] = ['place-images']
): Promise<{ ok: true } | { ok: false; reason: 'skip_external' | 'error'; message?: string }> {
  const parsed = parsePublicStorageUrl(publicUrl)
  if (!parsed || !allowedBuckets.includes(parsed.bucket)) {
    return { ok: false, reason: 'skip_external' }
  }
  const { error } = await client.storage.from(parsed.bucket).remove([parsed.path])
  if (error) return { ok: false, reason: 'error', message: error.message }
  return { ok: true }
}
