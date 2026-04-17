import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { CustomCategory } from '../types/place'

export function useCategories(nodeId: string) {
  const [categories, setCategories] = useState<CustomCategory[]>([])
  const [loading, setLoading]       = useState(true)

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('node_id', nodeId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    setCategories(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (!nodeId) return
    fetchCategories()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId])

  async function addCategory(cat: Omit<CustomCategory, 'created_at'>) {
    const { error } = await supabase.from('categories').insert(cat)
    if (!error) fetchCategories()
    return error
  }

  async function updateCategory(id: string, patch: Partial<CustomCategory>) {
    const { error } = await supabase
      .from('categories')
      .update(patch)
      .eq('id', id)
      .eq('node_id', nodeId)
    if (!error) fetchCategories()
    return error
  }

  async function deleteCategory(id: string) {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('node_id', nodeId)
    if (!error) fetchCategories()
    return error
  }

  return { categories, loading, addCategory, updateCategory, deleteCategory, refetch: fetchCategories }
}
