import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { MOCK_NODES, isSupabaseConfigured } from '../data/pimai-mock'
import type { Node } from '../types/place'

export function useNodes() {
  const [nodes, setNodes]     = useState<Node[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setNodes(MOCK_NODES)
      setLoading(false)
      return
    }

    let cancelled = false

    supabase
      .from('nodes')
      .select('*')
      .eq('is_active', true)
      .order('name')
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        else setNodes(data ?? [])
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  return { nodes, loading, error }
}
