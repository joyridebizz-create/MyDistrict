import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import Supercluster from 'supercluster'
import { IsoPin } from './IsoPin'
import type { Place, Node, Lang, CustomCategory, Category } from '../types/place'
import { CATEGORIES, getCatConfig } from '../types/place'

/** แสดงหมุดเดี่ยวเมื่อ zoom ≥ นี้; ต่ำกว่านี้ยังเห็นเฉพาะฟองคลัสเตอร์ (และ spiderfy) */
const MIN_PIN_ZOOM = 12

const LEAF_LIMIT = 500

/* ── Tile layers (CARTO — works on file:// and production) ── */
const TILE_URLS = {
  Retro:     'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  Dark:      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  Satellite: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
} as const

type TileStyle = keyof typeof TILE_URLS

type OverlayPin = {
  id: string
  x: number
  y: number
  scale: number
  visible: boolean
  /** จัดวางจาก spiderfy — วาดทับและให้ z-index สูง */
  spider?: boolean
}

type ClusterBubble = {
  clusterId: number
  count: number
  x: number
  y: number
  scale: number
  lat: number
  lng: number
}

type SpiderfyState = {
  clusterId: number
  center: { lat: number; lng: number }
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
  const [clusterBubbles, setClusterBubbles] = useState<ClusterBubble[]>([])
  const [pinPositions, setPinPositions] = useState<OverlayPin[]>([])
  const [zoom, setZoom] = useState(node.default_zoom)
  const [spiderfy, setSpiderfy] = useState<SpiderfyState | null>(null)

  const clusterIndex = useMemo(() => {
    const index = new Supercluster({
      radius: 72,
      maxZoom: 16,
      minZoom: 0,
      minPoints: 2,
    })
    index.load(
      places.map(p => ({
        type: 'Feature' as const,
        properties: { id: p.id },
        geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
      }))
    )
    return index
  }, [places])

  /* ── Always-fresh ref so map event listeners never use stale closure ── */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recalcPinsRef = useRef<() => void>(null as any)

  const recalcPins = useCallback(() => {
    const map = mapRef.current
    if (!map) return
    const z = map.getZoom()
    const scaleRaw = Math.pow(2, z - 15) * 0.85
    const scale = Math.max(0.3, Math.min(scaleRaw, 1.8))
    setZoom(z)

    const b = map.getBounds()
    const bbox: [number, number, number, number] = [
      b.getWest(),
      b.getSouth(),
      b.getEast(),
      b.getNorth(),
    ]
    const zoomIndex = Math.max(0, Math.floor(z))

    let spiderLeafIds = new Set<string>()
    let spiderLeaves: ReturnType<Supercluster['getLeaves']> = []
    if (spiderfy) {
      try {
        spiderLeaves = clusterIndex.getLeaves(spiderfy.clusterId, LEAF_LIMIT, 0)
      } catch {
        spiderLeaves = []
      }
      spiderLeafIds = new Set(
        spiderLeaves
          .map(f => (f.properties as { id?: string }).id)
          .filter((id): id is string => Boolean(id))
      )
    }

    const clustersOut: ClusterBubble[] = []
    const pinsOut: OverlayPin[] = []

    const feats = clusterIndex.getClusters(bbox, zoomIndex)
    for (const f of feats) {
      const props = f.properties as {
        cluster?: boolean
        cluster_id?: number
        point_count?: number
        id?: string
      }
      const geom = f.geometry as { type: string; coordinates: [number, number] }
      const [lng, lat] = geom.coordinates
      const pt = map.latLngToContainerPoint(L.latLng(lat, lng))

      if (props.cluster && props.cluster_id != null) {
        if (spiderfy && props.cluster_id === spiderfy.clusterId) continue
        clustersOut.push({
          clusterId: props.cluster_id,
          count: props.point_count ?? 0,
          x: pt.x,
          y: pt.y,
          scale,
          lat,
          lng,
        })
        continue
      }

      const id = props.id
      if (!id) continue
      if (spiderLeafIds.has(id)) continue

      pinsOut.push({
        id,
        x: pt.x,
        y: pt.y,
        scale,
        visible: z >= MIN_PIN_ZOOM,
      })
    }

    if (spiderfy && spiderLeaves.length > 0) {
      const center = map.latLngToContainerPoint([spiderfy.center.lat, spiderfy.center.lng])
      const n = spiderLeaves.length
      const R = Math.min(26 + n * 5, 100)
      spiderLeaves.forEach((leaf, i) => {
        const id = (leaf.properties as { id?: string }).id
        if (!id) return
        const angle = (2 * Math.PI * i) / n - Math.PI / 2
        pinsOut.push({
          id,
          x: center.x + Math.cos(angle) * R,
          y: center.y + Math.sin(angle) * R,
          scale,
          visible: true,
          spider: true,
        })
      })
    }

    setClusterBubbles(clustersOut)
    setPinPositions(pinsOut)
  }, [places, clusterIndex, spiderfy])

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

    const clearSpider = () => setSpiderfy(null)
    map.on('click', clearSpider)
    map.on('zoomstart', clearSpider)

    return () => {
      map.off('click', clearSpider)
      map.off('zoomstart', clearSpider)
      map.off()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Recalc whenever places / spiderfy change (e.g. after Supabase load) ── */
  useEffect(() => {
    recalcPins()
  }, [recalcPins])

  useEffect(() => {
    setSpiderfy(null)
  }, [places])

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
        {clusterBubbles.map(c => {
          const size = 36 * c.scale
          return (
            <div
              key={`c-${c.clusterId}`}
              style={{
                position: 'absolute',
                left: c.x - size / 2,
                top: c.y - size / 2,
                width: size,
                height: size,
                pointerEvents: 'auto',
                cursor: 'pointer',
                zIndex: 15,
              }}
              onClick={e => {
                e.stopPropagation()
                setSpiderfy({ clusterId: c.clusterId, center: { lat: c.lat, lng: c.lng } })
              }}
            >
              <div
                className="flex items-center justify-center rounded-full bg-blue-600 text-white font-bold shadow-lg border-2 border-white/90"
                style={{
                  width: size,
                  height: size,
                  fontSize: Math.max(11, 12 * c.scale),
                  boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
                }}
              >
                {c.count > 99 ? '99+' : c.count}
              </div>
            </div>
          )
        })}

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
              key={`${pos.id}${pos.spider ? '-s' : ''}`}
              style={{
                position: 'absolute',
                left: pos.x - pinW / 2,
                top:  pos.y - pinH,
                width: pinW,
                pointerEvents: 'auto',
                cursor: 'pointer',
                zIndex: pos.spider ? 35 : place.is_featured ? 20 : 10,
              }}
              onClick={e => {
                e.stopPropagation()
                onPinClick?.(place)
              }}
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
