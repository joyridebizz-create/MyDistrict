import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { IsoPin } from './IsoPin'
import type { Place, Node, Lang, CustomCategory, Category } from '../types/place'
import { CATEGORIES, getCatConfig } from '../types/place'

/* ── Tile layers (CARTO — works on file:// and production) ── */
const TILE_URLS = {
  Retro:     'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  Dark:      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  Satellite: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
} as const

type TileStyle = keyof typeof TILE_URLS

interface PinPos {
  id: string
  x: number
  y: number
  scale: number
  visible: boolean
}

interface DistrictMapProps {
  node: Node
  places: Place[]
  lang?: Lang
  customCategories?: CustomCategory[]
  onPinClick?: (place: Place) => void
  selectedId?: string | null
}

export function DistrictMap({ node, places, lang = 'th', customCategories = [], onPinClick, selectedId }: DistrictMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef          = useRef<L.Map | null>(null)
  const tileRef         = useRef<L.TileLayer | null>(null)
  const [tileStyle, setTileStyle] = useState<TileStyle>('Retro')
  const [pinPositions, setPinPositions] = useState<PinPos[]>([])
  const [zoom, setZoom] = useState(node.default_zoom)

  /* ── Always-fresh ref so map event listeners never use stale closure ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recalcPinsRef = useRef<() => void>(null as any)

  const recalcPins = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const z = map.getZoom()
    const scale = Math.pow(2, z - 15) * 0.85
    setZoom(z)
    setPinPositions(
      places.map(p => {
        const pt = map.latLngToContainerPoint([p.lat, p.lng])
        return {
          id: p.id,
          x: pt.x,
          y: pt.y,
          scale: Math.max(0.3, Math.min(scale, 1.8)),
          visible: z >= 12,
        }
      })
    )
  }, [places])

  // Keep ref pointing at the latest recalcPins on every render
  recalcPinsRef.current = recalcPins

  /* ── Init Leaflet ── */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [node.center_lat, node.center_lng],
      zoom:   node.default_zoom,
      zoomControl: false,
    })

    tileRef.current = L.tileLayer(TILE_URLS[tileStyle], {
      subdomains: 'abcd',
      maxZoom: 19,
      attribution: '© <a href="https://carto.com" target="_blank">CARTO</a>',
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)
    mapRef.current = map

    // Always call through ref → never stale, always has latest places
    const update = () => recalcPinsRef.current()
    map.on('move',    update)
    map.on('zoom',    update)
    map.on('moveend', update)
    map.on('zoomend', update)

    return () => {
      map.off()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Recalc whenever places change (e.g. after Supabase load) ── */
  useEffect(() => {
    recalcPins()
  }, [recalcPins])

  /* ── Swap tile layer ── */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !tileRef.current) return
    tileRef.current.remove()
    tileRef.current = L.tileLayer(TILE_URLS[tileStyle], {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)
  }, [tileStyle])

  /* ── Build lookup: id → Place ── */
  const placeMap = Object.fromEntries(places.map(p => [p.id, p]))

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Leaflet base map */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* ISO pin overlay — rendered via React, positioned via state */}
      <div className="absolute inset-0 z-10 overflow-hidden" style={{ pointerEvents: 'none' }}>
        {pinPositions.map(pos => {
          if (!pos.visible) return null
          const place = placeMap[pos.id]
          if (!place) return null
          const cat   = getCatConfig(place.category, customCategories)
          const isSelected = selectedId === place.id
          const pinW  = 64 * pos.scale
          const pinH  = 80 * pos.scale

          return (
            <div
              key={pos.id}
              style={{
                position: 'absolute',
                left: pos.x - pinW / 2,
                top:  pos.y - pinH,
                width: pinW,
                pointerEvents: 'auto',
                cursor: 'pointer',
                zIndex: place.is_featured ? 20 : 10,
              }}
              onClick={() => onPinClick?.(place)}
            >
              {/* Building icon */}
              <IsoPin
                category={place.category}
                catConfig={cat}
                isoOverrideUrl={
                  CATEGORIES.includes(place.category as Category)
                    ? node.iso_pin_icons?.[place.category as Category]?.trim() || undefined
                    : undefined
                }
                featured={place.is_featured}
                scale={pos.scale}
                selected={isSelected}
              />

              {/* Label below pin — localized */}
              {pos.scale > 0.55 && (
                <div
                  style={{
                    marginTop: 2,
                    textAlign: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      background: isSelected ? cat.color : 'rgba(15,15,25,0.82)',
                      color: '#fff',
                      fontSize: Math.max(9, 11 * pos.scale),
                      fontWeight: 600,
                      padding: '1px 5px',
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                      maxWidth: 120,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      backdropFilter: 'blur(4px)',
                      border: isSelected ? `1px solid ${cat.color}` : '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    {(lang === 'en' ? place.name_en : lang === 'zh' ? place.name_zh : null) ?? place.name}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Tile style switcher */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
        {(Object.keys(TILE_URLS) as TileStyle[]).map(style => (
          <button
            key={style}
            onClick={() => setTileStyle(style)}
            className={`px-3 py-1 text-xs rounded-lg shadow font-semibold transition-colors ${
              tileStyle === style
                ? 'bg-blue-500 text-white'
                : 'bg-gray-900/80 text-gray-300 hover:bg-gray-700/90 backdrop-blur'
            }`}
          >
            {style === 'Satellite' ? '☀️' : style === 'Dark' ? '🌙' : '🗺️'} {style}
          </button>
        ))}
      </div>

      {/* Zoom badge */}
      <div className="absolute bottom-20 left-3 z-20 bg-gray-900/70 backdrop-blur text-xs px-2 py-1 rounded text-gray-300 select-none">
        z{zoom}
      </div>
    </div>
  )
}
