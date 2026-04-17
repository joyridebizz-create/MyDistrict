import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase }   from '../../lib/supabase'
import { useNodes }   from '../../hooks/useNodes'
import { useAuth }    from '../../hooks/useAuth'
import { isSupabaseConfigured } from '../../data/pimai-mock'
import type { Node }  from '../../types/place'

interface NodeFormData {
  id:           string
  name:         string
  province:     string
  center_lat:   number | null
  center_lng:   number | null
  default_zoom: number
  is_active:    boolean
}

const EMPTY: NodeFormData = {
  id: '', name: '', province: '',
  center_lat: null, center_lng: null,
  default_zoom: 15, is_active: true,
}

const INPUT = 'w-full px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 transition-colors'
const LABEL = 'block text-xs font-semibold text-gray-400 mb-1'

/* ── Mini map picker for node center ── */
function CenterPicker({ lat, lng, onChange }: {
  lat: number | null; lng: number | null
  onChange: (lat: number, lng: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<L.Map | null>(null)
  const markerRef    = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, {
      center: [13.7563, 100.5018],
      zoom: 6,
      zoomControl: true,
    })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19,
      attribution: '© CARTO',
    }).addTo(map)
    mapRef.current = map

    map.on('click', (e: L.LeafletMouseEvent) => {
      onChange(e.latlng.lat, e.latlng.lng)
    })
    return () => { map.off(); map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || lat == null || lng == null) return
    if (markerRef.current) markerRef.current.remove()
    markerRef.current = L.marker([lat, lng], {
      icon: L.divIcon({
        className: '',
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:3px solid white;"></div>`,
        iconAnchor: [7, 7],
      }),
    }).addTo(map)
    map.setView([lat, lng], Math.max(map.getZoom(), 13))
  }, [lat, lng])

  return (
    <div>
      <label className={LABEL}>จุดศูนย์กลางแผนที่ *</label>
      <div ref={containerRef} style={{ height: 240, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }} />
      {lat != null && lng != null ? (
        <p className="text-blue-400 text-xs mt-1 font-mono">{lat.toFixed(6)}, {lng.toFixed(6)}</p>
      ) : (
        <p className="text-gray-600 text-xs mt-1">คลิกบนแผนที่เพื่อเลือกจุดศูนย์กลาง</p>
      )}
    </div>
  )
}

/* ── Node row in list ── */
function NodeRow({ node, onEdit, onToggle }: {
  node: Node
  onEdit: (n: Node) => void
  onToggle: (n: Node) => void
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 hover:bg-white/3 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-sm">{node.name}</span>
          {!node.is_active && (
            <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">ซ่อน</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <code className="text-blue-400 text-xs bg-blue-500/10 px-1.5 py-0.5 rounded">/{node.id}</code>
          {node.province && <span className="text-gray-500 text-xs">{node.province}</span>}
          <span className="text-gray-600 text-xs font-mono">{node.center_lat.toFixed(4)}, {node.center_lng.toFixed(4)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          to={`/${node.id}`}
          className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors"
        >
          ดูแผนที่
        </Link>
        <Link
          to={`/admin/${node.id}`}
          className="text-xs text-orange-400 hover:text-orange-300 px-2 py-1 rounded hover:bg-orange-500/10 transition-colors"
        >
          จัดการ
        </Link>
        <button
          onClick={() => onEdit(node)}
          className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors"
        >
          แก้ไข
        </button>
        <button
          onClick={() => onToggle(node)}
          className={`text-xs px-2 py-1 rounded transition-colors ${
            node.is_active
              ? 'text-yellow-400 hover:bg-yellow-500/10'
              : 'text-green-400 hover:bg-green-500/10'
          }`}
        >
          {node.is_active ? 'ซ่อน' : 'เปิด'}
        </button>
      </div>
    </div>
  )
}

/* ── Main page ── */
export function NodesAdminPage() {
  const { nodes, loading } = useNodes()
  const { user } = useAuth()

  const [form, setForm]           = useState<NodeFormData>(EMPTY)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null)
  const [errors, setErrors]       = useState<Partial<Record<keyof NodeFormData, string>>>({})

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  function setField<K extends keyof NodeFormData>(key: K, val: NodeFormData[K]) {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function startEdit(node: Node) {
    setForm({
      id: node.id, name: node.name, province: node.province ?? '',
      center_lat: node.center_lat, center_lng: node.center_lng,
      default_zoom: node.default_zoom, is_active: node.is_active,
    })
    setEditingId(node.id)
  }

  function cancelEdit() {
    setForm(EMPTY)
    setEditingId(null)
    setErrors({})
  }

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!form.id.trim())          errs.id         = 'จำเป็น'
    if (!/^[a-z0-9-]+$/.test(form.id)) errs.id    = 'ใช้ a-z 0-9 - เท่านั้น'
    if (!form.name.trim())        errs.name        = 'จำเป็น'
    if (form.center_lat == null)  errs.center_lat  = 'เลือกจุดบนแผนที่'
    if (form.center_lng == null)  errs.center_lng  = 'เลือกจุดบนแผนที่'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    if (!isSupabaseConfigured()) {
      showToast('Supabase ยังไม่ได้ config — บันทึกได้เฉพาะ production', false)
      return
    }

    setSaving(true)
    const payload = {
      id:           form.id.trim().toLowerCase(),
      name:         form.name.trim(),
      province:     form.province.trim() || null,
      center_lat:   form.center_lat!,
      center_lng:   form.center_lng!,
      default_zoom: form.default_zoom,
      is_active:    form.is_active,
    }

    if (editingId) {
      const { error } = await supabase.from('nodes').update(payload).eq('id', editingId)
      if (error) showToast('แก้ไขไม่สำเร็จ: ' + error.message, false)
      else { showToast('แก้ไขแล้ว ✓'); cancelEdit() }
    } else {
      const { error } = await supabase.from('nodes').insert(payload)
      if (error) showToast('เพิ่มไม่สำเร็จ: ' + error.message, false)
      else { showToast('เพิ่ม node แล้ว ✓'); cancelEdit() }
    }
    setSaving(false)
  }

  async function toggleActive(node: Node) {
    if (!isSupabaseConfigured()) { showToast('Supabase ยังไม่ได้ config', false); return }
    await supabase.from('nodes').update({ is_active: !node.is_active }).eq('id', node.id)
    showToast(node.is_active ? `ซ่อน ${node.name} แล้ว` : `เปิด ${node.name} แล้ว`)
  }

  return (
    <div className="min-h-screen bg-[#0f1117] font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#13151e] border-b border-white/5 px-6 py-4 flex items-center gap-4">
        <Link to="/" className="text-gray-500 hover:text-white text-sm transition-colors">← กลับ</Link>
        <div className="w-px h-4 bg-white/10" />
        <h1 className="text-white font-bold text-sm">จัดการ Nodes</h1>
        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-semibold">SUPER ADMIN</span>
        <div className="flex-1" />
        <span className="text-gray-500 text-xs">{nodes.length} nodes</span>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-xs hidden md:block truncate max-w-[140px]" title={user?.email}>
            {user?.email}
          </span>
          <button
            onClick={() => supabase.auth.signOut()}
            title="ออกจากระบบ"
            className="text-gray-500 hover:text-red-400 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-5 gap-8">

        {/* ── Node list ── */}
        <div className="lg:col-span-3">
          <h2 className="text-white font-bold text-sm mb-3">Nodes ทั้งหมด</h2>

          <div className="bg-[#13151e] rounded-2xl border border-white/5 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-24 text-gray-500 text-sm">กำลังโหลด...</div>
            ) : nodes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 text-gray-600 text-sm gap-2">
                <span>ยังไม่มี node</span>
              </div>
            ) : (
              nodes.map(node => (
                <NodeRow key={node.id} node={node} onEdit={startEdit} onToggle={toggleActive} />
              ))
            )}
          </div>

          {/* Architecture explanation */}
          <div className="mt-6 p-4 rounded-2xl bg-[#13151e] border border-white/5 space-y-3">
            <h3 className="text-white font-semibold text-sm">Multi-tenant Architecture</h3>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-mono mt-0.5">node_id</span>
                <span>ทุก table มี <code className="bg-white/8 px-1 rounded">node_id</code> — data แต่ละ node แยกกันสมบูรณ์</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-mono mt-0.5">URL</span>
                <span>
                  <code className="bg-white/8 px-1 rounded">/:nodeId</code> →{' '}
                  <code className="bg-white/8 px-1 rounded">/pimai</code>{' '}
                  <code className="bg-white/8 px-1 rounded">/korat</code>{' '}
                  <code className="bg-white/8 px-1 rounded">/ayutthaya</code>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-mono mt-0.5">RLS</span>
                <span>Row Level Security — anon อ่านได้เฉพาะ active places</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-mono mt-0.5">Scale</span>
                <span>เพิ่ม node ใหม่ = insert 1 row ใน nodes table, ไม่ต้องแก้ code</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Add / Edit form ── */}
        <div className="lg:col-span-2">
          <h2 className="text-white font-bold text-sm mb-3">
            {editingId ? `แก้ไข: ${editingId}` : 'เพิ่ม Node ใหม่'}
          </h2>

          <form onSubmit={handleSave} className="bg-[#13151e] rounded-2xl border border-white/5 p-4 space-y-4">
            {/* ID */}
            <div>
              <label className={LABEL}>
                Node ID * {errors.id && <span className="text-red-400 ml-1">{errors.id}</span>}
              </label>
              <input
                className={`${INPUT} ${errors.id ? 'border-red-500' : ''} ${editingId ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={form.id}
                onChange={e => setField('id', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="เช่น korat, ayutthaya"
                disabled={!!editingId}
              />
              {!editingId && (
                <p className="text-gray-600 text-xs mt-1">
                  จะกลายเป็น URL: <code className="text-blue-400">/{form.id || 'korat'}</code>
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className={LABEL}>ชื่อ * {errors.name && <span className="text-red-400 ml-1">{errors.name}</span>}</label>
              <input className={`${INPUT} ${errors.name ? 'border-red-500' : ''}`} value={form.name} onChange={e => setField('name', e.target.value)} placeholder="เช่น เมืองโคราช" />
            </div>

            {/* Province */}
            <div>
              <label className={LABEL}>จังหวัด</label>
              <input className={INPUT} value={form.province} onChange={e => setField('province', e.target.value)} placeholder="เช่น นครราชสีมา" />
            </div>

            {/* Default zoom */}
            <div>
              <label className={LABEL}>Zoom เริ่มต้น ({form.default_zoom})</label>
              <input
                type="range" min={10} max={18} value={form.default_zoom}
                onChange={e => setField('default_zoom', Number(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>10 (ภาพรวม)</span><span>15 (เมือง)</span><span>18 (ละเอียด)</span>
              </div>
            </div>

            {/* Map center picker */}
            <CenterPicker
              lat={form.center_lat} lng={form.center_lng}
              onChange={(lat, lng) => { setField('center_lat', lat); setField('center_lng', lng) }}
            />
            {errors.center_lat && <p className="text-red-400 text-xs">{errors.center_lat}</p>}

            {/* Active toggle */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-white/5 cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-white">Active</div>
                <div className="text-xs text-gray-500">แสดงใน landing page</div>
              </div>
              <div
                onClick={() => setField('is_active', !form.is_active)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${form.is_active ? 'bg-blue-500' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
            </label>

            {/* Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                {saving ? 'กำลังบันทึก...' : editingId ? '💾 บันทึก' : '+ เพิ่ม Node'}
              </button>
              {editingId && (
                <button type="button" onClick={cancelEdit}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-400 bg-white/5 hover:bg-white/10 transition-colors">
                  ยกเลิก
                </button>
              )}
            </div>
          </form>

          {/* SQL alternative */}
          <div className="mt-4 p-4 rounded-2xl bg-[#13151e] border border-white/5">
            <p className="text-gray-500 text-xs mb-2 font-semibold">หรือ insert ตรงใน Supabase SQL:</p>
            <pre className="text-xs text-blue-300 bg-black/30 p-3 rounded-xl overflow-x-auto leading-relaxed">{
`INSERT INTO nodes (id, name, province, center_lat, center_lng)
VALUES (
  'korat',
  'เมืองโคราช',
  'นครราชสีมา',
  14.9799,
  102.0978
);`
            }</pre>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold ${
          toast.ok ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
