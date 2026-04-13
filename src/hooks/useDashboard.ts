import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { useMudanca } from '../context/MudancaContext'

export type DashboardData = {
  budget: {
    total_service_cost: number
    selected_service_cost: number
    total_estimated_materials: number
    total_actual_materials: number
    total_budget: number
    total_spent: number
    remaining: number
  }
  progress: {
    total_services: number
    completed: number
    in_progress: number
    pending: number
    completion_percentage: number
    total_hours: number
  }
  shopping: {
    total_items: number
    purchased: number
    pending: number
  }
  providers_summary: Array<{
    provider_id: number
    name: string
    total_combined: number
    total_paid: number
    total_pending: number
  }>
}

export function useDashboard() {
  const { activeMudanca } = useMudanca()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    if (!activeMudanca) return
    try {
      setLoading(true)
      const result = await api.get<DashboardData>(`/dashboard?mudanca_id=${activeMudanca.id}`)
      setData(result)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [activeMudanca?.id])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  return { data, loading, error, refresh: fetchDashboard }
}
