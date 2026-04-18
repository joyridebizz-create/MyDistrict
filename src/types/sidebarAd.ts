/** โฆษณาใน Sidebar (carousel) — รองรับ text / image / video */
export type SidebarAdKind = 'text' | 'image' | 'video'

export interface SidebarAd {
  id: string
  node_id: string
  kind: SidebarAdKind
  title: string | null
  body: string | null
  media_url: string | null
  duration_seconds: number
  sort_order: number
  is_active: boolean
  created_at: string
}
