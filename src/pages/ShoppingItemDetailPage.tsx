import { useState, useEffect, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useMudanca } from '../context/MudancaContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { MoneyInput } from '../components/ui/MoneyInput'
import { Select } from '../components/ui/Select'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { AutocompleteInput } from '../components/ui/AutocompleteInput'
import type { ShoppingItem, Service } from '@server/types'

export function ShoppingItemDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { activeMudanca } = useMudanca()
  const [item, setItem] = useState<ShoppingItem | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [estimatedPrice, setEstimatedPrice] = useState('')
  const [actualPrice, setActualPrice] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [supplier, setSupplier] = useState('')
  const [suppliers, setSuppliers] = useState<string[]>([])
  const [purchased, setPurchased] = useState(false)
  const [purchaseDate, setPurchaseDate] = useState('')

  useEffect(() => {
    api.get<string[]>('/shopping/suppliers').then(setSuppliers).catch(() => { })
  }, [])

  useEffect(() => {
    if (!activeMudanca) return
    Promise.all([
      api.get<ShoppingItem>(`/shopping/${id}`),
      api.get<Service[]>(`/services?mudanca_id=${activeMudanca.id}`),
    ])
      .then(([data, svcs]) => {
        setItem(data)
        setName(data.name)
        setQuantity(String(data.quantity))
        setEstimatedPrice(String(data.estimated_price))
        setActualPrice(data.actual_price !== null ? String(data.actual_price) : (data.estimated_price ? String(data.estimated_price) : ''))
        setServiceId(data.service_id ? String(data.service_id) : '')
        setSupplier(data.supplier || '')
        setPurchased(!!data.purchased)
        setPurchaseDate(data.purchase_date || '')
        setServices(svcs)
      })
      .catch(() => navigate('/shopping', { replace: true }))
      .finally(() => setLoading(false))
  }, [id, navigate, activeMudanca?.id])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const updated = await api.put<ShoppingItem>(`/shopping/${id}`, {
        name: name.trim(),
        quantity: parseInt(quantity) || 1,
        estimated_price: parseFloat(estimatedPrice) || 0,
        actual_price: actualPrice.trim() !== '' ? parseFloat(actualPrice) || 0 : null,
        service_id: serviceId ? parseInt(serviceId) : null,
        supplier: supplier.trim(),
        purchased,
        purchase_date: purchased && purchaseDate ? purchaseDate : undefined,
      })
      setItem(prev => prev ? { ...prev, ...updated } : null)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    await api.delete(`/shopping/${id}`)
    navigate('/shopping', { replace: true })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!item) return null

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={() => navigate('/shopping')}
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
          <h2 className="text-xl font-bold text-text-primary">Editar Material</h2>

          <Input label="Nome" value={name} onChange={e => setName((e.target as HTMLInputElement).value)} required />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantidade"
              type="number"
              value={quantity}
              onChange={e => setQuantity((e.target as HTMLInputElement).value)}
              min="1"
              step="1"
            />
            <MoneyInput
              label="Preço Unit. Estimado"
              value={estimatedPrice}
              onChange={setEstimatedPrice}
            />
          </div>

          {services.length > 0 && (
            <Select
              label="Serviço"
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              options={[
                { value: '', label: 'Nenhum (avulso)' },
                ...services.map(s => ({ value: String(s.id), label: s.name })),
              ]}
            />
          )}

          <AutocompleteInput
            label="Fornecedor"
            value={supplier}
            suggestions={suppliers}
            onChange={setSupplier}
            placeholder="Ex: Leroy Merlin"
          />

          {/* Purchased toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => {
                const isNowPurchased = !purchased
                setPurchased(isNowPurchased)
                if (isNowPurchased && !purchaseDate) {
                  const now = new Date()
                  setPurchaseDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`)
                }
              }}
              className={`w-7 h-7 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors
                ${purchased ? 'bg-success border-success' : 'border-border hover:border-primary'}`}
            >
              {purchased ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-5 h-5">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
              ) : null}
            </button>
            <span className="text-base text-text-primary font-medium">Comprado</span>
          </label>

          {purchased && (
            <div className="p-4 bg-primary-light border border-primary/20 rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2">
              <h3 className="text-sm font-semibold text-primary">Detalhes da Compra</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Data da Compra"
                  type="date"
                  value={purchaseDate}
                  onChange={e => setPurchaseDate((e.target as HTMLInputElement).value)}
                  required={purchased}
                />
                <MoneyInput
                  label="Preço Unit. Real"
                  value={actualPrice}
                  onChange={setActualPrice}
                  required={purchased}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              loading={saving}
              className="flex-1"
              disabled={purchased && (!actualPrice.trim() || !purchaseDate.trim())}
            >
              Salvar
            </Button>
            <Button type="button" variant="danger" onClick={() => setShowDeleteConfirm(true)}>Excluir</Button>
          </div>
        </form>
      </Card>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Excluir Material"
        message={`Tem certeza que deseja excluir "${item.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  )
}
