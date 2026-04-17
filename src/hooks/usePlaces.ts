import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { PIMAI_PLACES, isSupabaseConfigured } from '../data/pimai-mock'
import type { Place, Category } from '../types/place'

export function usePlaces(nodeId: string, category?: Category | 'all') {
  const [places, setPlaces]   = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!nodeId) return

    // ── Fallback: use mock data when Supabase is not configured ──
    if (!isSupabaseConfigured()) {
      const mock = PIMAI_PLACES.filter(p =>
        p.node_id === nodeId &&
        p.is_active &&
        (!category || category === 'all' || p.category === category)
      ).sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
      setPlaces(mock)
      setLoading(false)
      return
    }

    let cancelled = false

    async function fetchPlaces() {
      setLoading(true)
      setError(null)

      let q = supabase
        .from('places')
        .select('*')
        .eq('node_id', nodeId)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false })

      if (category && category !== 'all') {
        q = q.eq('category', category)
      }

      const { data, error: err } = await q

      if (!cancelled) {
        if (err) setError(err.message)
        else setPlaces(data ?? [])
        setLoading(false)
      }
    }

    fetchPlaces()

    const channel = supabase
      .channel(`places:${nodeId}:${category ?? 'all'}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'places', filter: `node_id=eq.${nodeId}` },
        () => { fetchPlaces() }
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [nodeId, category])

  return { places, loading, error }
}
