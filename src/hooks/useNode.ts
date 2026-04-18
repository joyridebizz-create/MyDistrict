import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { MOCK_NODES, isSupabaseConfigured } from '../data/pimai-mock'
import type { Node } from '../types/place'

export function useNode(nodeId: string) {
  const [node, setNode]       = useState<Node | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (!nodeId) return
    if (!isSupabaseConfigured()) {
      const mock = MOCK_NODES.find(n => n.id === nodeId) ?? null
      setNode(mock)
      return
    }
    setLoading(true)
    const { data, error: err } = await supabase
      .from('nodes')
      .select('*')
      .eq('id', nodeId)
      .eq('is_active', true)
      .single()
    if (err) setError(err.message)
    else setNode(data as Node)
    setLoading(false)
  }, [nodeId])

  useEffect(() => {
    if (!nodeId) return

    if (!isSupabaseConfigured()) {
      const mock = MOCK_NODES.find(n => n.id === nodeId) ?? null
      setNode(mock)
      setLoading(false)
      return
    }

    let cancelled = false

    supabase
      .from('nodes')
      .select('*')
      .eq('id', nodeId)
      .eq('is_active', true)
      .single()
      .then(({ data, error: err }) => {
        if (cancelled) return
        if (err) setError(err.message)
        else setNode(data as Node)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [nodeId])

  return { node, loading, error, refetch }
}
