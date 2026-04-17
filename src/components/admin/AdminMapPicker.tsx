import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { parseGMapsURL } from '../../lib/parseGMapsURL'
import { IsoPin } from '../IsoPin'
import type { Place, Node, CustomCategory } from '../../types/place'
import { getCatConfig } from '../../types/place'

const TILE_URLS = {
  Retro: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  Dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
} as const

interface DraftPin { lat: number; lng: number }

interface AdminMapPickerProps {
  node: Node
  places: Place[]
  draft: DraftPin | null
  selectedId: string | null
  customCategories?: CustomCategory[]
  onDraftChange: (pin: DraftPin) => void
  onSelectPlace: (place: Place) => void
}

export function AdminMapPicker({
  node, places, draft, selectedId, customCategories = [], onDraftChange, onSelectPlace,
}: AdminMapPickerProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<L.Map | null>(null)
  const tileRef       = useRef<L.TileLayer | null>(null)
  const draftMarkerRef = useRef<L.Marker | null>(null)
  const overlayRef    = useRef<HTMLDivElement>(null)
  const placesRef     = useRef(places)
  const draftRef      = useRef(draft)

  const [tile, setTile]       = useState<keyof typeof TILE_URLS>('Retro')
  const [gmapsUrl, setGmapsUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const [pinPositions, setPinPositions] = useState<
    { id: string; x: number; y: number; scale: number }[]
  >([])

  placesRef.current = places
  draftRef.current  = draft

  /* ── Map init ── */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [node.center_lat, node.center_lng],
      zoom:   node.default_zoom,
      zoomControl: false,
    })

    tileRef.current = L.tileLayer(TILE_URLS[tile], {
      subdomains: 'abcd', maxZoom: 19,
      attribution: '© <a href="https://carto.com">CARTO</a>',
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)
    mapRef.current = map

    // Click on map → set draft pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      onDraftChange({ lat: e.latlng.lat, lng: e.latlng.lng })
    })

    const recalc = () => {
      const z     = map.getZoom()
      const scale = Math.max(0.4, Math.min(Math.pow(2, z - 15) * 0.85, 1.6))
      setPinPositions(
        placesRef.current.map(p => {
          const pt = map.latLngToContainerPoint([p.lat, p.lng])
          return { id: p.id, x: pt.x, y: pt.y, scale }
        })
      )
    }

    map.on('move', recalc)
    map.on('zoom', recalc)
    map.on('moveend', recalc)
    map.on('zoomend', recalc)

    return () => { map.off(); map.remove(); mapRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Recalc pins when places list changes ── */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const z     = map.getZoom()
    const scale = Math.max(0.4, Math.min(Math.pow(2, z - 15) * 0.85, 1.6))
    setPinPositions(
      places.map(p => {
        const pt = map.latLngToContainerPoint([p.lat, p.lng])
        return { id: p.id, x: pt.x, y: pt.y, scale }
      })
    )
  }, [places])

  /* ── Swap tile layer ── */
  useEffect(() => {
    const map = mapRef.current
    if (!map || !tileRef.current) return
    tileRef.current.remove()
    tileRef.current = L.tileLayer(TILE_URLS[tile], {
      subdomains: 'abcd', maxZoom: 19,
    }).addTo(map)
  }, [tile])

  /* ── Draft marker (native Leaflet) ── */
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (draftMarkerRef.current) {
      draftMarkerRef.current.remove()
      draftMarkerRef.current = null
    }
    if (!draft) return

    const icon = L.divIcon({
      className: '',
      html: `<div style="
        width:18px;height:18px;border-radius:50%;
        background:#60a5fa;border:3px solid white;
        box-shadow:0 0 0 3px #60a5fa88;
        animation:rippleOut 1.4s ease-out infinite;
      "></div>`,
      iconAnchor: [9, 9],
    })
    draftMarkerRef.current = L.marker([draft.lat, draft.lng], { icon }).addTo(map)
  }, [draft])

  /* ── GPS ── */
  function useGPS() {
    navigator.geolocation.getCurrentPosition(
      pos => onDraftChange({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => alert('GPS error: ' + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  /* ── Parse Google Maps URL ── */
  function handleGMapsUrl() {
    const result = parseGMapsURL(gmapsUrl)
    if (!result) { setUrlError('ไม่พบ lat/lng ใน URL นี้'); return }
    setUrlError('')
    onDraftChange(result)
    mapRef.current?.flyTo([result.lat, result.lng], 17, { duration: 1 })
    setGmapsUrl('')
  }

  const placeMap = Object.fromEntries(places.map(p => [p.id, p]))

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Leaflet base */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* Existing place pins */}
      <div ref={overlayRef} className="absolute inset-0 z-10 overflow-hidden" style={{ pointerEvents: 'none' }}>
        {pinPositions.map(pos => {
          const place = placeMap[pos.id]
          if (!place) return null
          const cat   = getCatConfig(place.category, customCategories)
          const isSel = selectedId === place.id
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
                zIndex: isSel ? 30 : 10,
                filter: isSel
                  ? `drop-shadow(0 0 8px ${cat.color})`
                  : 'drop-shadow(0 3px 5px rgba(0,0,0,0.3))',
              }}
              onClick={() => onSelectPlace(place)}
            >
              <IsoPin category={place.category} catConfig={cat} featured={place.is_featured} scale={pos.scale} selected={isSel} />
              <div style={{ marginTop: 2, textAlign: 'center', pointerEvents: 'none' }}>
                <span style={{
                  display: 'inline-block',
                  background: isSel ? cat.color : 'rgba(10,12,20,0.8)',
                  color: '#fff', fontSize: Math.max(9, 10 * pos.scale),
                  fontWeight: 600, padding: '1px 5px', borderRadius: 4,
                  border: `1px solid ${isSel ? cat.color : 'rgba(255,255,255,0.12)'}`,
                  whiteSpace: 'nowrap', maxWidth: 110,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {place.name}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Top overlay controls ── */}
      <div className="absolute top-2 left-2 right-2 z-20 flex items-start gap-2">
        {/* Google Maps URL input */}
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex gap-1">
            <input
              type="text"
              value={gmapsUrl}
              onChange={e => { setGmapsUrl(e.target.value); setUrlError('') }}
              onKeyDown={e => e.key === 'Enter' && handleGMapsUrl()}
              placeholder="วาง Google Maps URL..."
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-gray-900/90 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
            />
            <button
              onClick={handleGMapsUrl}
              className="px-3 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
            >
              ปักหมุด
            </button>
          </div>
          {urlError && <span className="text-red-400 text-xs px-1">{urlError}</span>}
        </div>

        {/* GPS button */}
        <button
          onClick={useGPS}
          className="px-3 py-1.5 text-xs rounded-lg bg-green-700/90 hover:bg-green-600 text-white font-semibold transition-colors flex items-center gap-1 backdrop-blur"
        >
          📍 GPS
        </button>

        {/* Tile toggle */}
        <div className="flex rounded-lg overflow-hidden border border-white/10">
          {(Object.keys(TILE_URLS) as (keyof typeof TILE_URLS)[]).map(s => (
            <button key={s} onClick={() => setTile(s)}
              className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${tile === s ? 'bg-blue-600 text-white' : 'bg-gray-900/80 text-gray-400 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Draft coords display */}
      {draft && (
        <div className="absolute bottom-12 left-2 z-20 bg-blue-600/90 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur font-mono">
          {draft.lat.toFixed(6)}, {draft.lng.toFixed(6)}
        </div>
      )}

      {/* Hint */}
      {!draft && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 bg-gray-900/80 text-gray-300 text-xs px-3 py-1.5 rounded-full backdrop-blur pointer-events-none">
          คลิกบนแผนที่เพื่อปักหมุด
        </div>
      )}
    </div>
  )
}
