import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { MoneyInput } from '../components/ui/MoneyInput'
import { Select } from '../components/ui/Select'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { AutocompleteInput } from '../components/ui/AutocompleteInput'
import { formatCurrency } from '../lib/formatters'
import type { Service, ShoppingItem } from '@server/types'

type ServiceWithItems = Service & { shopping_items: ShoppingItem[] }

export function ServiceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [service, setService] = useState<ServiceWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [materials, setMaterials] = useState('')
  const [cost, setCost] = useState('')
  const [status, setStatus] = useState('pending')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [provider, setProvider] = useState('')
  const [providers, setProviders] = useState<string[]>([])

  useEffect(() => {
    api.get<string[]>('/services/providers').then(setProviders).catch(() => { })
  }, [])

  useEffect(() => {
    api.get<ServiceWithItems>(`/services/${id}`)
      .then(data => {
        setService(data)
        setName(data.name)
        setMaterials(data.materials_description)
        setCost(String(data.service_cost))
        setStatus(data.status)
        setStartDate(data.start_date || '')
        setEndDate(data.end_date || '')
        setProvider(data.provider || '')
      })
      .catch(() => navigate('/services', { replace: true }))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const updated = await api.put<ServiceWithItems>(`/services/${id}`, {
        name: name.trim(),
        materials_description: materials.trim(),
        service_cost: parseFloat(cost) || 0,
        status,
        start_date: startDate ? startDate : undefined,
        end_date: endDate ? endDate : undefined,
        provider: provider.trim(),
      })
      setService(prev => prev ? { ...prev, ...updated } : null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    await api.delete(`/services/${id}`)
    navigate('/services', { replace: true })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!service) return null

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={() => navigate('/services')}
        className="flex items-center gap-1 text-primary font-semibold text-base hover:underline"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Voltar
      </button>

      {/* Edit Form */}
      <Card>
        <form onSubmit={handleSave} className="space-y-4">
          <h2 className="text-xl font-bold text-text-primary">Editar Serviço</h2>

          <Input label="Nome" value={name} onChange={e => setName((e.target as HTMLInputElement).value)} required />

          <Input
            label="Materiais Necessários"
            value={materials}
            onChange={e => setMaterials((e.target as HTMLTextAreaElement).value)}
            multiline
            placeholder="Descreva os materiais"
          />

          <div className="grid grid-cols-2 gap-3">
            <MoneyInput
              label="Valor"
              value={cost}
              onChange={setCost}
            />
            <Input
              label="Data Inicial"
              type="date"
              value={startDate}
              onChange={e => setStartDate((e.target as HTMLInputElement).value)}
            />
            <Input
              label="Data Final"
              type="date"
              value={endDate}
              onChange={e => setEndDate((e.target as HTMLInputElement).value)}
            />
          </div>

          <Select
            label="Status"
            value={status}
            onChange={e => {
              const newStatus = e.target.value
              setStatus(newStatus)
              const now = new Date()
              const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

              if (newStatus === 'in_progress' && !startDate) {
                setStartDate(today)
              }
              if (newStatus === 'completed' && !endDate) {
                setEndDate(today)
              }
            }}
            options={[
              { value: 'pending', label: 'Pendente' },
              { value: 'in_progress', label: 'Em Andamento' },
              { value: 'completed', label: 'Concluído' },
            ]}
          />

          <AutocompleteInput
            label="Prestador"
            value={provider}
            suggestions={providers}
            onChange={setProvider}
            placeholder="Ex: João Pedreiro"
          />

          <div className="flex gap-3">
            <Button type="submit" loading={saving} className="flex-1">Salvar</Button>
            <Button type="button" variant="danger" onClick={() => setShowDeleteConfirm(true)}>Excluir</Button>
          </div>
        </form>
      </Card>

      {/* Linked Shopping Items */}
      {service.shopping_items && service.shopping_items.length > 0 && (
        <Card>
          <h3 className="text-lg font-bold text-text-primary mb-3">Materiais Vinculados</h3>
          <div className="space-y-2">
            {service.shopping_items.map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded flex items-center justify-center text-sm ${item.purchased ? 'bg-success text-white' : 'border border-border'}`}>
                    {item.purchased ? '✓' : ''}
                  </span>
                  <span className={`text-base ${item.purchased ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                    {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}
                  </span>
                </div>
                <div className="text-right">
                  {item.actual_price !== null ? (
                    <span className="text-base font-semibold text-success">{formatCurrency(item.actual_price * item.quantity)}</span>
                  ) : (
                    <span className="text-sm text-text-secondary">{formatCurrency(item.estimated_price * item.quantity)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Excluir Serviço"
        message={`Tem certeza que deseja excluir "${service.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
