import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

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
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const result = await api.get<DashboardData>('/dashboard')
      setData(result)
      setError(null)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  return { data, loading, error, refresh: fetchDashboard }
}
