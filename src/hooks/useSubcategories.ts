import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import type { SubCategory } from '../types/place'

export function useSubcategories(nodeId: string) {
  const [subcategories, setSubcategories] = useState<SubCategory[]>([])
  const [loading, setLoading]             = useState(true)

  async function fetchSubcategories() {
    const { data } = await supabase
      .from('subcategories')
      .select('*')
      .eq('node_id', nodeId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    setSubcategories(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!nodeId) return
    fetchSubcategories()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId])

  /** จัดกลุ่มตาม parent_category */
  const byCategory = useMemo(() => {
    const map: Record<string, SubCategory[]> = {}
    for (const sub of subcategories) {
      if (!map[sub.parent_category]) map[sub.parent_category] = []
      map[sub.parent_category].push(sub)
    }
    return map
  }, [subcategories])

  async function addSubcategory(sub: Omit<SubCategory, 'created_at'>) {
    const { error } = await supabase.from('subcategories').insert(sub)
    if (!error) fetchSubcategories()
    return error
  }

  async function deleteSubcategory(id: string) {
    const { error } = await supabase
      .from('subcategories')
      .delete()
      .eq('id', id)
      .eq('node_id', nodeId)
    if (!error) fetchSubcategories()
    return error
  }

  return {
    subcategories,
    byCategory,
    loading,
    addSubcategory,
    deleteSubcategory,
    refetch: fetchSubcategories,
  }
}
