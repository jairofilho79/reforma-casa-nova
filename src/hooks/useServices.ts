import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { useMudanca } from '../context/MudancaContext'
import type { Service } from '@server/types'

export function useServices() {
  const { activeMudanca } = useMudanca()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchServices = useCallback(async () => {
    if (!activeMudanca) return
    try {
      setLoading(true)
      const data = await api.get<Service[]>(`/services?mudanca_id=${activeMudanca.id}`)
      setServices(data)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [activeMudanca?.id])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const createService = async (data: { name: string; materials_description?: string; service_cost?: number; provider_id?: number | null; provider?: string }) => {
    if (!activeMudanca) throw new Error('Nenhuma mudança ativa')
    const service = await api.post<Service>('/services', { ...data, mudanca_id: activeMudanca.id })
    setServices(prev => [...prev, service])
    return service
  }

  const updateService = async (id: number, data: Partial<Service>) => {
    const updated = await api.put<Service>(`/services/${id}`, data)
    setServices(prev => prev.map(s => s.id === id ? updated : s))
    return updated
  }

  const deleteService = async (id: number) => {
    await api.delete(`/services/${id}`)
    setServices(prev => prev.filter(s => s.id !== id))
  }

  const toggleSelected = async (id: number) => {
    const updated = await api.patch<Service>(`/services/${id}/toggle`)
    setServices(prev => prev.map(s => s.id === id ? updated : s))
  }

  const updateStatus = async (id: number, status: string, start_date?: string, end_date?: string) => {
    const payload: { status: string; start_date?: string; end_date?: string } = { status }
    if (start_date !== undefined) payload.start_date = start_date
    if (end_date !== undefined) payload.end_date = end_date

    const updated = await api.patch<Service>(`/services/${id}/status`, payload)
    setServices(prev => prev.map(s => s.id === id ? updated : s))
  }

  return {
    services,
    loading,
    error,
    fetchServices,
    createService,
    updateService,
    deleteService,
    toggleSelected,
    updateStatus,
  }
}
