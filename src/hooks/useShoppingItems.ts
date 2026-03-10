import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { useMudanca } from '../context/MudancaContext'
import type { ShoppingItem } from '@server/types'

export function useShoppingItems(serviceId?: number) {
  const { activeMudanca } = useMudanca()
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    if (!activeMudanca) return
    try {
      setLoading(true)
      const params = new URLSearchParams({ mudanca_id: String(activeMudanca.id) })
      if (serviceId) params.set('service_id', String(serviceId))
      const data = await api.get<ShoppingItem[]>(`/shopping?${params.toString()}`)
      setItems(data)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [activeMudanca?.id, serviceId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const createItem = async (data: { service_id?: number; name: string; quantity?: number; estimated_price?: number; supplier?: string }) => {
    if (!activeMudanca) throw new Error('Nenhuma mudança ativa')
    const item = await api.post<ShoppingItem>('/shopping', { ...data, mudanca_id: activeMudanca.id })
    setItems(prev => [...prev, item])
    return item
  }

  const updateItem = async (id: number, data: Partial<ShoppingItem>) => {
    const updated = await api.put<ShoppingItem>(`/shopping/${id}`, data)
    setItems(prev => prev.map(i => i.id === id ? updated : i))
    return updated
  }

  const deleteItem = async (id: number) => {
    await api.delete(`/shopping/${id}`)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const togglePurchased = async (id: number, actualPrice?: number) => {
    const updated = await api.patch<ShoppingItem>(`/shopping/${id}/purchased`, actualPrice !== undefined ? { actual_price: actualPrice } : undefined)
    setItems(prev => prev.map(i => i.id === id ? updated : i))
  }

  return {
    items,
    loading,
    error,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    togglePurchased,
  }
}
