import { useRef, useState } from 'react'
import imageCompression from 'browser-image-compression'
import { supabase } from '../../lib/supabase'

interface ImageUploaderProps {
  value:       string        // current URL
  onChange:    (url: string) => void
  nodeId:      string        // used as folder prefix in bucket
  label?:      string
  placeholder?: string
  /** compress to small thumbnail (stricter limits) */
  thumbnail?:  boolean
}

/** แปลง bytes → readable */
function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

export function ImageUploader({
  value, onChange, nodeId, label = 'รูปภาพ', placeholder = 'https://...', thumbnail = false,
}: ImageUploaderProps) {
  const inputRef   = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<'idle' | 'compressing' | 'uploading' | 'done' | 'error'>('idle')
  const [progress, setProgress] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setState('compressing')
    setErrorMsg('')

    try {
      /* ─── 1. Compress ─── */
      const options = thumbnail
        ? { maxSizeMB: 0.15, maxWidthOrHeight: 600,  useWebWorker: true, fileType: 'image/webp' }
        : { maxSizeMB: 0.35, maxWidthOrHeight: 1200, useWebWorker: true, fileType: 'image/webp' }

      setProgress(`บีบอัด ${fmtBytes(file.size)}…`)
      const compressed = await imageCompression(file, options)
      setProgress(`${fmtBytes(file.size)} → ${fmtBytes(compressed.size)}`)

      /* ─── 2. Upload to Supabase Storage ─── */
      setState('uploading')
      const ext  = 'webp'
      const path = `${nodeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const { error: upErr } = await supabase.storage
        .from('place-images')
        .upload(path, compressed, { contentType: 'image/webp', upsert: false })

      if (upErr) throw new Error(upErr.message)

      /* ─── 3. Get public URL ─── */
      const { data } = supabase.storage.from('place-images').getPublicUrl(path)
      onChange(data.publicUrl)
      setState('done')

    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'อัพโหลดไม่สำเร็จ')
      setState('error')
    }
  }

  const busy = state === 'compressing' || state === 'uploading'

  return (
    <div className="space-y-1.5">
      <div className="block text-xs font-semibold text-gray-400">{label}</div>

      {/* Preview (if URL exists) */}
      {value && (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-white/5 border border-white/10 group">
          <img src={value} alt="preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => { onChange(''); setState('idle'); setProgress('') }}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-sm
              flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity
              hover:bg-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upload area */}
      <div
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => {
          e.preventDefault()
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}
        className={`relative flex flex-col items-center justify-center gap-2 py-3 px-4 rounded-xl
          border-2 border-dashed transition-all text-center
          ${busy
            ? 'border-blue-500/40 bg-blue-500/5 cursor-wait'
            : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5 cursor-pointer'
          }`}
      >
        {busy ? (
          <>
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-blue-300 font-medium">
              {state === 'compressing' ? '⚡ บีบอัดภาพ…' : '☁️ กำลังอัพโหลด…'}
            </span>
            {progress && <span className="text-xs text-gray-500">{progress}</span>}
          </>
        ) : state === 'done' ? (
          <>
            <span className="text-green-400 text-xl">✓</span>
            <span className="text-xs text-green-400 font-medium">อัพโหลดสำเร็จ</span>
            {progress && <span className="text-xs text-gray-500">{progress}</span>}
            <span className="text-xs text-gray-600 mt-0.5">คลิกเพื่อเปลี่ยนภาพ</span>
          </>
        ) : (
          <>
            <span className="text-2xl text-gray-500">🖼️</span>
            <div>
              <span className="text-xs font-semibold text-gray-400">คลิกหรือลากภาพมาวาง</span>
              <p className="text-xs text-gray-600 mt-0.5">JPG · PNG · WebP · GIF — ระบบจะบีบอัดอัตโนมัติ</p>
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {state === 'error' && errorMsg && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          ❌ {errorMsg}
        </div>
      )}

      {/* URL text input (fallback / paste URL) */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-white/8" />
        <span className="text-xs text-gray-600">หรือวาง URL</span>
        <div className="h-px flex-1 bg-white/8" />
      </div>
      <input
        type="url"
        value={value}
        onChange={e => { onChange(e.target.value); setState('idle') }}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-white
          placeholder-gray-600 focus:outline-none focus:border-blue-400 transition-colors"
      />

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
