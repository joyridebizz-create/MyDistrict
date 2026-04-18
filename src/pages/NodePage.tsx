import { useState, useEffect } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { DistrictMap }    from '../components/DistrictMap'
import { InfoCard }       from '../components/InfoCard'
import { PlaceCard }      from '../components/PlaceCard'
import { LangToggle }     from '../components/LangToggle'
import { usePlaces }      from '../hooks/usePlaces'
import { useNode }        from '../hooks/useNode'
import { useCategories }    from '../hooks/useCategories'
import { useSubcategories }  from '../hooks/useSubcategories'
import { useSidebarAds }     from '../hooks/useSidebarAds'
import { SidebarAdSlider }   from '../components/SidebarAdSlider'
import { PIMAI_NODE }     from '../data/pimai-mock'
import type { Lang, Place } from '../types/place'
import { CAT_CONFIG, CATEGORIES, getCatConfig, I18N } from '../types/place'

export function NodePage() {
  const { nodeId = 'phimai' } = useParams<{ nodeId: string }>()

  const [lang, setLang]         = useState<Lang>('th')
  const [category, setCategory] = useState<string>('all')
  const [view, setView]         = useState<'map' | 'list'>('map')
  const [selected, setSelected] = useState<Place | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const { node, loading: nodeLoading }           = useNode(nodeId)
  const { places: allPlaces, loading: placesLoading } = usePlaces(nodeId)
  const { categories: customCategories }         = useCategories(nodeId)
  const { subcategories }                        = useSubcategories(nodeId)
  const { ads: sidebarAds }                      = useSidebarAds(nodeId)

  const activeNode = node ?? PIMAI_NODE  // PIMAI_NODE only used while loading
  const t = I18N[lang]

  // Client-side category filter
  const places = category === 'all'
    ? allPlaces
    : allPlaces.filter(p => p.category === category)

  useEffect(() => {
    document.title = node ? `${node.name} — District Guide` : 'District Guide'
  }, [node])

  if (!nodeLoading && !node) {
    return <Navigate to="/" replace />
  }

  /* Count per category */
  const counts: Record<string, number> = { all: allPlaces.length }
  CATEGORIES.forEach(c => { counts[c] = allPlaces.filter(p => p.category === c).length })

  return (
    <div className="h-screen flex overflow-hidden bg-[#0f1117] font-sans">

      {/* ═══════════════════════════════════════
          LEFT SIDEBAR
      ═══════════════════════════════════════ */}
      <aside
        className={`flex-shrink-0 flex flex-col bg-[#13151e] border-r border-white/5
          transition-all duration-300 ${sidebarOpen ? 'w-52' : 'w-0 overflow-hidden'}`}
      >
        {/* Logo / Node header */}
        <div className="px-4 pt-4 pb-3 border-b border-white/5">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">
            District Guide
          </div>
          <h1 className="text-white font-bold text-lg leading-tight">{activeNode.name}</h1>
          {activeNode.province && (
            <p className="text-gray-400 text-xs mt-0.5">{activeNode.province}</p>
          )}
        </div>

        {/* Category filters */}
        <nav className="flex-1 min-h-0 overflow-y-auto py-2 px-2">
          {/* All */}
          <button
            onClick={() => setCategory('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 text-sm transition-colors ${
              category === 'all'
                ? 'bg-white/10 text-white font-semibold'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>🗺️</span>
              <span>{t.all}</span>
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              category === 'all' ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-500'
            }`}>{counts['all'] ?? 0}</span>
          </button>

          {/* built-in categories */}
          {CATEGORIES.map(cat => {
            const cfg = CAT_CONFIG[cat]
            const isActive = category === cat
            return (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 text-sm transition-colors ${
                  isActive ? 'text-white font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
                style={isActive ? { background: `${cfg.color}22`, border: `1px solid ${cfg.color}55` } : {}}
              >
                <span className="flex items-center gap-2">
                  <span>{cfg.icon}</span>
                  <span>{cfg.label[lang]}</span>
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/5 text-gray-500">
                  {counts[cat] ?? 0}
                </span>
              </button>
            )
          })}
          {/* custom categories */}
          {customCategories.map(cat => {
            const cfg = getCatConfig(cat.id, customCategories)
            const isActive = category === cat.id
            const cnt = allPlaces.filter(p => p.category === cat.id).length
            if (cnt === 0) return null
            return (
              <button key={cat.id} onClick={() => setCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg mb-1 text-sm transition-colors ${
                  isActive ? 'text-white font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
                style={isActive ? { background: `${cfg.color}22`, border: `1px solid ${cfg.color}55` } : {}}
              >
                <span className="flex items-center gap-2">
                  <span>{cfg.icon}</span>
                  <span>{cfg.label[lang]}</span>
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/5 text-gray-500">{cnt}</span>
              </button>
            )
          })}
        </nav>

        {/* Sidebar ads carousel */}
        {sidebarAds.length > 0 && (
          <div className="flex-shrink-0 border-t border-white/5 pt-2">
            <SidebarAdSlider ads={sidebarAds} />
          </div>
        )}

        {/* Bottom: view toggle */}
        <div className="flex-shrink-0 px-3 pb-4 pt-2 border-t border-white/5">
          <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs">
            <button
              onClick={() => setView('map')}
              className={`flex-1 py-2 font-semibold transition-colors ${
                view === 'map' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-white'
              }`}
            >
              🗺️ {t.map_view}
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex-1 py-2 font-semibold transition-colors ${
                view === 'list' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-white'
              }`}
            >
              ☰ {t.list_view}
            </button>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════
          MAIN AREA
      ═══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Top bar */}
        <header className="flex-shrink-0 flex items-center gap-2 px-3 py-2
          bg-[#0f1117]/90 backdrop-blur border-b border-white/5 z-30">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            ☰
          </button>

          {/* Node breadcrumb */}
          <span className="text-gray-400 text-sm hidden sm:block">
            <span className="text-white font-semibold">{activeNode.name}</span>
            {activeNode.province && <span className="ml-1 text-gray-500">· {activeNode.province}</span>}
          </span>

          <div className="flex-1" />

          {/* Loading dot */}
          {placesLoading && (
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          )}

          <LangToggle lang={lang} onChange={setLang} />

          {/* Admin link */}
          <Link
            to={`/admin/${nodeId}`}
            className="text-gray-500 hover:text-orange-400 transition-colors text-xs font-semibold px-2 py-1 rounded border border-white/10 hover:border-orange-400/40"
            title="Admin panel"
          >
            ⚙️
          </Link>
        </header>

        {/* ── MAP VIEW ── */}
        {view === 'map' && (
          <div className="flex-1 relative overflow-hidden">
            <DistrictMap
              node={activeNode}
              places={places}
              lang={lang}
              customCategories={customCategories}
              onPinClick={setSelected}
              selectedId={selected?.id}
            />
            {selected && (
              <InfoCard
                place={selected}
                lang={lang}
                customCategories={customCategories}
                subcategories={subcategories}
                onClose={() => setSelected(null)}
              />
            )}
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <div className="flex-1 overflow-y-auto bg-[#0f1117]">
            {placesLoading ? (
              <div className="flex items-center justify-center h-40 text-gray-500">{t.loading}</div>
            ) : places.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-500">{t.no_places}</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
                {places.map(place => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    lang={lang}
                    customCategories={customCategories}
                    subcategories={subcategories}
                    onClick={() => { setView('map'); setSelected(place) }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Stats bar (map view only) */}
        {view === 'map' && !placesLoading && (
          <div className="flex-shrink-0 flex items-center gap-4 px-4 py-2
            bg-[#0f1117]/90 backdrop-blur border-t border-white/5 z-30">
            <span className="text-gray-400 text-xs">
              <span className="text-white font-bold text-sm">{places.length}</span>
              <span className="ml-1">สถานที่</span>
            </span>
            {CATEGORIES.map(cat => counts[cat] > 0 && (
              <span key={cat} className="text-gray-500 text-xs flex items-center gap-1">
                <span>{CAT_CONFIG[cat].icon}</span>
                <span>{counts[cat]}</span>
              </span>
            ))}
            {customCategories.map(cat => {
              const cnt = allPlaces.filter(p => p.category === cat.id).length
              return cnt > 0 ? (
                <span key={cat.id} className="text-gray-500 text-xs flex items-center gap-1">
                  <span>{cat.icon}</span>
                  <span>{cnt}</span>
                </span>
              ) : null
            })}
          </div>
        )}
      </div>
    </div>
  )
}
