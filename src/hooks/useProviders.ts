import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
import { useMudanca } from '../context/MudancaContext'
import type { Provider } from '@server/types'

export function useProviders() {
  const { activeMudanca } = useMudanca()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProviders = useCallback(async () => {
    if (!activeMudanca) return
    setLoading(true)
    try {
      const data = await api.get<Provider[]>(`/providers?mudanca_id=${activeMudanca.id}`)
      setProviders(data)
    } finally {
      setLoading(false)
    }
  }, [activeMudanca?.id])

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  const createProvider = async (payload: { name: string; phone?: string; notes?: string }) => {
    if (!activeMudanca) throw new Error('Nenhuma mudança ativa')
    const created = await api.post<Provider>('/providers', { ...payload, mudanca_id: activeMudanca.id })
    setProviders(prev => {
      const exists = prev.some(p => p.id === created.id)
      const next = exists ? prev.map(p => (p.id === created.id ? created : p)) : [...prev, created]
      return next.sort((a, b) => a.name.localeCompare(b.name))
    })
    return created
  }

  const updateProvider = async (id: number, payload: Partial<Pick<Provider, 'name' | 'phone' | 'notes'>>) => {
    const updated = await api.put<Provider>(`/providers/${id}`, payload)
    setProviders(prev => prev.map(p => (p.id === id ? updated : p)).sort((a, b) => a.name.localeCompare(b.name)))
    return updated
  }

  const deleteProvider = async (id: number) => {
    await api.delete(`/providers/${id}`)
    setProviders(prev => prev.filter(p => p.id !== id))
  }

  return { providers, loading, fetchProviders, createProvider, updateProvider, deleteProvider }
}

