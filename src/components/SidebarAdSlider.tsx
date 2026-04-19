import { useCallback, useEffect, useRef, useState } from 'react'
import type { SidebarAd } from '../types/sidebarAd'

interface SidebarAdSliderProps {
  ads: SidebarAd[]
}

/** Carousel โฆษณา Sidebar — auto-play, swipe/drag, dark rounded UI */
export function SidebarAdSlider({ ads }: SidebarAdSliderProps) {
  const [index, setIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef<{ x: number; active: boolean }>({ x: 0, active: false })
  const containerRef = useRef<HTMLDivElement>(null)
  const pauseUntil = useRef(0)

  const n = ads.length
  const safeIndex = n ? ((index % n) + n) % n : 0

  useEffect(() => {
    if (n <= 1) return
    const now = Date.now()
    if (now < pauseUntil.current) return
    const ms = Math.max(2, ads[safeIndex]?.duration_seconds ?? 5) * 1000
    const t = window.setTimeout(() => {
      setIndex(i => (i + 1) % n)
      setDragOffset(0)
    }, ms)
    return () => clearTimeout(t)
  }, [safeIndex, n, ads])

  const go = useCallback(
    (dir: -1 | 1) => {
      if (n <= 0) return
      pauseUntil.current = Date.now() + 8000
      setIndex(i => {
        const next = (i + dir + n) % n
        return next
      })
      setDragOffset(0)
    },
    [n]
  )

  function onPointerDown(e: React.PointerEvent) {
    if (n <= 1) return
    dragStart.current = { x: e.clientX, active: true }
    setIsDragging(true)
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch { /* ignore */ }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragStart.current.active || n <= 1) return
    const dx = e.clientX - dragStart.current.x
    setDragOffset(dx)
  }

  function onPointerUp() {
    if (!dragStart.current.active || n <= 1) {
      dragStart.current.active = false
      setIsDragging(false)
      return
    }
    const dx = dragOffset
    dragStart.current.active = false
    setIsDragging(false)
    if (dx < -48) go(1)
    else if (dx > 48) go(-1)
    setDragOffset(0)
  }

  if (n === 0) return null

  return (
    <div className="px-2 pb-1">
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0c0e14] shadow-inner select-none"
        style={{ touchAction: 'pan-y pinch-zoom' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* track: ความกว้างรวม = n × ความกว้าง viewport */}
        <div
          className={`flex items-start ${isDragging ? '' : 'transition-transform duration-300 ease-out'}`}
          style={{
            width: `${n * 100}%`,
            transform: `translateX(calc(-${(safeIndex * 100) / n}% + ${dragOffset}px))`,
          }}
        >
          {ads.map(ad => (
            <div key={ad.id} className="flex-shrink-0 self-start" style={{ width: `${100 / n}%` }}>
              <AdSlide ad={ad} />
            </div>
          ))}
        </div>

        {n > 1 && (
          <>
            <button
              type="button"
              aria-label="ก่อนหน้า"
              onClick={e => {
                e.stopPropagation()
                go(-1)
              }}
              className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 text-white text-xs
                flex items-center justify-center hover:bg-black/70 opacity-70 hover:opacity-100 z-10"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="ถัดไป"
              onClick={e => {
                e.stopPropagation()
                go(1)
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/50 text-white text-xs
                flex items-center justify-center hover:bg-black/70 opacity-70 hover:opacity-100 z-10"
            >
              ›
            </button>
          </>
        )}

        {n > 1 && (
          <div className="flex justify-center gap-1 py-1.5 bg-black/20">
            {ads.map((ad, i) => (
              <button
                key={ad.id}
                type="button"
                aria-label={`สไลด์ ${i + 1}`}
                onClick={e => {
                  e.stopPropagation()
                  pauseUntil.current = Date.now() + 8000
                  setIndex(i)
                  setDragOffset(0)
                }}
                className={`h-1 rounded-full transition-all ${
                  i === safeIndex ? 'w-4 bg-white/80' : 'w-1 bg-white/25'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AdSlide({ ad }: { ad: SidebarAd }) {
  if (ad.kind === 'text') {
    return (
      <div className="px-3 py-3 min-h-[88px] flex flex-col justify-center">
        {ad.title && (
          <div className="text-xs font-bold text-white text-center leading-snug line-clamp-2">{ad.title}</div>
        )}
        {ad.body && (
          <p className="text-[11px] text-gray-400 text-center mt-1 leading-relaxed line-clamp-4">{ad.body}</p>
        )}
        {!ad.title && !ad.body && (
          <span className="text-[10px] text-gray-600 text-center">โฆษณา</span>
        )}
      </div>
    )
  }

  if (ad.kind === 'image' && ad.media_url) {
    return (
      <div className="relative w-full aspect-[4/3] bg-[#0a0a0c]">
        <img
          src={ad.media_url}
          alt={ad.title ?? ''}
          className="absolute inset-0 w-full h-full object-contain object-center"
          draggable={false}
        />
        {ad.title && (
          <div className="absolute bottom-0 inset-x-0 px-2 py-1 bg-gradient-to-t from-black/80 to-transparent">
            <span className="text-[10px] font-semibold text-white line-clamp-1">{ad.title}</span>
          </div>
        )}
      </div>
    )
  }

  if (ad.kind === 'video' && ad.media_url) {
    return (
      <div className="relative w-full aspect-[4/3] bg-black overflow-hidden">
        <video
          src={ad.media_url}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          loop
          autoPlay
          controls={false}
        />
        {ad.title && (
          <div className="absolute bottom-0 inset-x-0 px-2 py-1 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
            <span className="text-[10px] font-semibold text-white line-clamp-1">{ad.title}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="aspect-[4/3] min-h-[72px] flex items-center justify-center text-[10px] text-gray-600 px-2 text-center bg-black/20">
      ไม่มีสื่อ — แก้ไขใน Admin
    </div>
  )
}
