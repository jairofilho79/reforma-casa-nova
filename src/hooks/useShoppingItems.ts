import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { ShoppingItem } from '@server/types'

export function useShoppingItems(serviceId?: number) {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const query = serviceId ? `?service_id=${serviceId}` : ''
      const data = await api.get<ShoppingItem[]>(`/shopping${query}`)
      setItems(data)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [serviceId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const createItem = async (data: { service_id?: number; name: string; estimated_price?: number }) => {
    const item = await api.post<ShoppingItem>('/shopping', data)
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
