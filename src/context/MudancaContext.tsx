import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { api } from '../lib/api'
import { getToken } from '../lib/auth'
import type { Mudanca } from '@server/types'

const STORAGE_KEY = 'reforma-mudanca-id'

type MudancaContextType = {
  mudancas: Mudanca[]
  activeMudanca: Mudanca | null
  isLoading: boolean
  switchMudanca: (id: number) => void
  createMudanca: (name: string) => Promise<Mudanca>
  deleteMudanca: (id: number) => Promise<void>
  refreshMudancas: () => Promise<void>
}

const MudancaContext = createContext<MudancaContextType | null>(null)

export function MudancaProvider({ children }: { children: ReactNode }) {
  const [mudancas, setMudancas] = useState<Mudanca[]>([])
  const [activeMudancaId, setActiveMudancaId] = useState<number | null>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? parseInt(stored) : null
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchMudancas = useCallback(async () => {
    setIsLoading(true)
    if (!getToken()) {
      setMudancas([])
      setActiveMudancaId(null)
      setIsLoading(false)
      return
    }
    try {
      const data = await api.get<Mudanca[]>('/mudancas')
      setMudancas(data)

      if (data.length > 0) {
        const storedId = localStorage.getItem(STORAGE_KEY)
        const storedNum = storedId ? parseInt(storedId) : null
        const exists = data.some(m => m.id === storedNum)
        if (!exists) {
          setActiveMudancaId(data[0].id)
          localStorage.setItem(STORAGE_KEY, String(data[0].id))
        }
      }
    } catch {
      // Not authenticated or network error
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMudancas()
  }, [fetchMudancas])

  useEffect(() => {
    const handler = () => fetchMudancas()
    window.addEventListener('auth-changed', handler)
    return () => window.removeEventListener('auth-changed', handler)
  }, [fetchMudancas])

  const switchMudanca = useCallback((id: number) => {
    setActiveMudancaId(id)
    localStorage.setItem(STORAGE_KEY, String(id))
  }, [])

  const createMudanca = useCallback(async (name: string) => {
    const mudanca = await api.post<Mudanca>('/mudancas', { name })
    setMudancas(prev => [...prev, mudanca])
    setActiveMudancaId(mudanca.id)
    localStorage.setItem(STORAGE_KEY, String(mudanca.id))
    return mudanca
  }, [])

  const deleteMudanca = useCallback(async (id: number) => {
    await api.delete(`/mudancas/${id}`)
    setMudancas(prev => {
      const remaining = prev.filter(m => m.id !== id)
      if (id === activeMudancaId && remaining.length > 0) {
        setActiveMudancaId(remaining[0].id)
        localStorage.setItem(STORAGE_KEY, String(remaining[0].id))
      }
      return remaining
    })
  }, [activeMudancaId])

  const activeMudanca = mudancas.find(m => m.id === activeMudancaId) || null

  return (
    <MudancaContext.Provider value={{
      mudancas,
      activeMudanca,
      isLoading,
      switchMudanca,
      createMudanca,
      deleteMudanca,
      refreshMudancas: fetchMudancas,
    }}>
      {children}
    </MudancaContext.Provider>
  )
}

export function useMudanca() {
  const ctx = useContext(MudancaContext)
  if (!ctx) throw new Error('useMudanca deve ser usado dentro de MudancaProvider')
  return ctx
}
