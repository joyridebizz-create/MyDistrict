import { useState, FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export function LoginPage() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = (location.state as { from?: string })?.from ?? '/admin'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message === 'Invalid login credentials'
        ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
        : authError.message
      )
      setLoading(false)
      return
    }

    navigate(from, { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#0f111a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📍</div>
          <h1 className="text-white text-2xl font-bold tracking-wide">District Guide</h1>
          <p className="text-gray-500 text-sm mt-1">Admin Portal</p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#1a1d2b] rounded-2xl p-6 border border-white/5 space-y-4"
        >
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">
              อีเมล
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="w-full bg-[#0f111a] border border-white/10 rounded-lg px-3 py-2.5
                         text-white text-sm placeholder-gray-600
                         focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">
              รหัสผ่าน
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0f111a] border border-white/10 rounded-lg px-3 py-2.5
                         text-white text-sm placeholder-gray-600
                         focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40
                       text-white font-medium rounded-lg py-2.5 text-sm
                       transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin text-base">⏳</span>
                กำลังเข้าสู่ระบบ…
              </>
            ) : (
              'เข้าสู่ระบบ'
            )}
          </button>
        </form>

        {/* Back link */}
        <p className="text-center text-gray-600 text-xs mt-6">
          <a href="/" className="hover:text-gray-400 transition-colors">
            ← กลับหน้าหลัก
          </a>
        </p>
      </div>
    </div>
  )
}
