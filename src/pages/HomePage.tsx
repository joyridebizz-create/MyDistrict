import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNodes } from '../hooks/useNodes'
import { usePlaces } from '../hooks/usePlaces'
import type { Node } from '../types/place'
import { CAT_CONFIG, CATEGORIES, getCatConfig } from '../types/place'

/* ── Node card — loads its own place counts ── */
function NodeCard({ node }: { node: Node }) {
  const { places } = usePlaces(node.id)

  const counts: Record<string, number> = { all: places.length }
  CATEGORIES.forEach(c => { counts[c] = places.filter(p => p.category === c).length })

  return (
    <Link
      to={`/${node.id}`}
      className="group flex flex-col bg-[#13151e] border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/40 hover:bg-[#1a1d2b] transition-all duration-200"
    >
      {/* Map thumbnail placeholder */}
      <div className="h-36 relative overflow-hidden bg-[#1e2130]">
        {/* Decorative mini-map dots */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 200 120">
          <rect width="200" height="120" fill="#1e2130" />
          {/* Road lines */}
          <line x1="0" y1="60" x2="200" y2="60" stroke="#4a5568" strokeWidth="2" />
          <line x1="100" y1="0" x2="100" y2="120" stroke="#4a5568" strokeWidth="2" />
          <line x1="50" y1="0" x2="50" y2="120" stroke="#2d3748" strokeWidth="1" />
          <line x1="150" y1="0" x2="150" y2="120" stroke="#2d3748" strokeWidth="1" />
          <line x1="0" y1="30" x2="200" y2="30" stroke="#2d3748" strokeWidth="1" />
          <line x1="0" y1="90" x2="200" y2="90" stroke="#2d3748" strokeWidth="1" />
          {/* Park */}
          <rect x="70" y="40" width="60" height="40" rx="3" fill="#2d4a30" />
          {/* Blocks */}
          {[[5,5,40,22],[110,5,40,22],[5,37,40,20],[155,37,40,20],[155,5,40,22]].map(([bx,by,bw,bh],i) =>
            <rect key={i} x={bx} y={by} width={bw} height={bh} rx="2" fill="#252836" />
          )}
          {[[5,67,40,22],[110,67,40,22],[155,67,40,22],[5,93,80,22],[120,93,75,22]].map(([bx,by,bw,bh],i) =>
            <rect key={`b${i}`} x={bx} y={by} width={bw} height={bh} rx="2" fill="#252836" />
          )}
          {/* Pin dots */}
          {places.slice(0, 8).map((p, i) => {
            const angle = (i / 8) * Math.PI * 2
            const cx = 100 + Math.cos(angle) * 35
            const cy = 60 + Math.sin(angle) * 25
            const cat = getCatConfig(p.category, [])
            return <circle key={p.id} cx={cx} cy={cy} r="4" fill={cat.color} opacity="0.85" />
          })}
        </svg>

        {/* Province badge */}
        <div className="absolute top-3 left-3 z-10 bg-gray-900/80 backdrop-blur text-gray-300 text-xs px-2.5 py-1 rounded-full font-medium">
          {node.province ?? 'ไทย'}
        </div>

        {/* Admin shortcut */}
        <Link
          to={`/admin/${node.id}`}
          onClick={e => e.stopPropagation()}
          className="absolute top-3 right-3 z-10 bg-gray-900/70 hover:bg-orange-500/80 text-gray-400 hover:text-white text-xs px-2 py-1 rounded-lg transition-colors"
          title="Admin"
        >
          ⚙️
        </Link>

        {/* Place count overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-[#13151e] to-transparent h-12" />
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
          <span className="text-white font-bold text-base">{node.name}</span>
          <span className="text-gray-400 text-xs">{places.length} สถานที่</span>
        </div>
      </div>

      {/* Category stats */}
      <div className="px-4 py-3 flex items-center gap-3">
        {CATEGORIES.map(c => {
          const n = counts[c]
          if (n === 0) return null
          const cfg = CAT_CONFIG[c]
          return (
            <div key={c} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: cfg.color }} />
              <span className="text-xs text-gray-400">{n}</span>
            </div>
          )
        })}
        {places.length === 0 && (
          <span className="text-gray-600 text-xs italic">ยังไม่มีสถานที่</span>
        )}
      </div>

      {/* Open button */}
      <div className="px-4 pb-4 pt-1">
        <div
          className="w-full py-2 rounded-xl text-sm font-semibold text-center transition-colors
            bg-white/5 text-gray-400 group-hover:bg-blue-600 group-hover:text-white"
        >
          เปิดแผนที่ →
        </div>
      </div>
    </Link>
  )
}

/* ── Main HomePage ── */
export function HomePage() {
  const { nodes, loading } = useNodes()
  const [search, setSearch] = useState('')

  const filtered = nodes.filter(n =>
    n.name.includes(search) || (n.province ?? '').includes(search) || n.id.includes(search.toLowerCase())
  )

  // Group by province
  const provinces = [...new Set(filtered.map(n => n.province ?? 'อื่นๆ'))]

  return (
    <div className="min-h-screen bg-[#0f1117] font-sans">
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 bg-[#0f1117]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">District Guide</h1>
            <p className="text-gray-500 text-xs">แผนที่ท้องถิ่น · Multi-node</p>
          </div>
          <div className="flex-1" />

          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ค้นหาอำเภอ / จังหวัด..."
              className="pl-8 pr-4 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 w-56"
            />
          </div>

          {/* Super admin link */}
          <Link
            to="/admin"
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/20 transition-colors"
          >
            + เพิ่มพื้นที่
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-3">
            <span className="text-4xl">🗺️</span>
            <span>ไม่พบพื้นที่ที่ค้นหา</span>
          </div>
        ) : (
          provinces.map(province => (
            <section key={province} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-white font-bold text-base">{province}</h2>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-gray-600 text-xs">
                  {filtered.filter(n => (n.province ?? 'อื่นๆ') === province).length} พื้นที่
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered
                  .filter(n => (n.province ?? 'อื่นๆ') === province)
                  .map(node => <NodeCard key={node.id} node={node} />)
                }
              </div>
            </section>
          ))
        )}

        {/* Architecture note */}
        <div className="mt-8 p-4 rounded-2xl bg-white/3 border border-white/5">
          <p className="text-gray-500 text-xs text-center">
            Multi-node architecture · 1 node = 1 อำเภอ/เมือง · แยก data ด้วย{' '}
            <code className="bg-white/10 px-1 rounded text-gray-400">node_id</code>
            {' '}ทุก query
          </p>
        </div>
      </main>
    </div>
  )
}
