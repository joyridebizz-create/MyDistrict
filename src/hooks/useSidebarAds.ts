import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { removeStorageFileByPublicUrl } from '../lib/supabaseStorage'
import type { SidebarAd, SidebarAdKind } from '../types/sidebarAd'

export type SidebarAdInsert = {
  kind: SidebarAdKind
  title?: string | null
  body?: string | null
  media_url?: string | null
  duration_seconds: number
  is_active: boolean
}

export function useSidebarAds(nodeId: string, opts?: { admin?: boolean }) {
  const admin = opts?.admin ?? false
  const [ads, setAds] = useState<SidebarAd[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAds = useCallback(async () => {
    if (!nodeId) return
    let q = supabase
      .from('sidebar_ads')
      .select('*')
      .eq('node_id', nodeId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (!admin) q = q.eq('is_active', true)

    const { data, error } = await q
    if (!error) setAds((data as SidebarAd[]) ?? [])
    setLoading(false)
  }, [nodeId, admin])

  useEffect(() => {
    setLoading(true)
    fetchAds()
  }, [fetchAds])

  async function addAd(row: SidebarAdInsert) {
    const maxSort = ads.reduce((m, a) => Math.max(m, a.sort_order), -1)
    const { error } = await supabase.from('sidebar_ads').insert({
      kind:             row.kind,
      title:            row.title?.trim() || null,
      body:             row.body?.trim() || null,
      media_url:        row.media_url?.trim() || null,
      duration_seconds: row.duration_seconds,
      is_active:        row.is_active,
      node_id:          nodeId,
      sort_order:       maxSort + 1,
    })
    if (!error) await fetchAds()
    return error
  }

  async function updateAd(id: string, patch: Partial<SidebarAd>) {
    if (Object.prototype.hasOwnProperty.call(patch, 'media_url')) {
      const { data: prev } = await supabase
        .from('sidebar_ads')
        .select('media_url')
        .eq('id', id)
        .eq('node_id', nodeId)
        .maybeSingle()
      const oldUrl = prev?.media_url?.trim()
      const newUrl = patch.media_url?.trim() ?? null
      if (oldUrl && oldUrl !== newUrl) {
        const r = await removeStorageFileByPublicUrl(supabase, oldUrl)
        if (!r.ok && r.reason === 'error' && r.message) {
          console.warn('[sidebar_ads] ลบไฟล์เก่าใน Storage ไม่สำเร็จ:', r.message)
        }
      }
    }

    const { error } = await supabase
      .from('sidebar_ads')
      .update(patch)
      .eq('id', id)
      .eq('node_id', nodeId)
    if (!error) await fetchAds()
    return error
  }

  async function deleteAd(id: string) {
    const { data: row } = await supabase
      .from('sidebar_ads')
      .select('media_url')
      .eq('id', id)
      .eq('node_id', nodeId)
      .maybeSingle()

    if (row?.media_url?.trim()) {
      const r = await removeStorageFileByPublicUrl(supabase, row.media_url.trim())
      if (!r.ok && r.reason === 'error' && r.message) {
        console.warn('[sidebar_ads] ลบไฟล์ใน Storage ไม่สำเร็จ:', r.message)
      }
    }

    const { error } = await supabase
      .from('sidebar_ads')
      .delete()
      .eq('id', id)
      .eq('node_id', nodeId)
    if (!error) await fetchAds()
    return error
  }

  return { ads, loading, refetch: fetchAds, addAd, updateAd, deleteAd }
}
