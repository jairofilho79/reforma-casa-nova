import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useShoppingItems } from '../hooks/useShoppingItems'
import { useMudanca } from '../context/MudancaContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { formatCurrency } from '../lib/formatters'
import { api } from '../lib/api'
import type { Service } from '@server/types'

export function ShoppingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { activeMudanca } = useMudanca()
  const [filterServiceId, setFilterServiceId] = useState<number | undefined>()
  const { items, loading, togglePurchased, createItem } = useShoppingItems(filterServiceId)
  const [services, setServices] = useState<Service[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEstimated, setNewEstimated] = useState('')
  const [newQuantity, setNewQuantity] = useState('1')
  const [newServiceId, setNewServiceId] = useState('')
  const [onlyPending, setOnlyPending] = useState(() => {
    if (searchParams.get('pending') === 'true') return true
    return localStorage.getItem('shopping_only_pending') === 'true'
  })
  const addFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeMudanca) {
      api.get<Service[]>(`/services?mudanca_id=${activeMudanca.id}`).then(setServices).catch(() => {})
    }
  }, [activeMudanca?.id])

  const toggleOnlyPending = () => {
    setOnlyPending(prev => {
      const next = !prev
      localStorage.setItem('shopping_only_pending', String(next))
      return next
    })
  }

  const totalEstimated = items.reduce((sum, i) => sum + i.estimated_price * i.quantity, 0)
  const totalActual = items.reduce((sum, i) => sum + (i.actual_price || 0) * i.quantity, 0)
  const purchasedCount = items.filter(i => i.purchased).length

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAddLoading(true)
    try {
      await createItem({
        name: newName.trim(),
        quantity: parseInt(newQuantity) || 1,
        estimated_price: parseFloat(newEstimated) || 0,
        service_id: newServiceId ? parseInt(newServiceId) : undefined,
      })
      setNewName('')
      setNewEstimated('')
      setNewQuantity('1')
      setNewServiceId('')
      setShowAdd(false)
    } finally {
      setAddLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-text-primary">Lista de Compras</h2>

      {/* Summary */}
      <Card className="!bg-primary-light border-primary/20">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm text-text-secondary">Estimado</p>
            <p className="text-lg font-bold text-text-primary">{formatCurrency(totalEstimated)}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Real</p>
            <p className="text-lg font-bold text-success">{formatCurrency(totalActual)}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Comprados</p>
            <p className="text-lg font-bold text-primary">{purchasedCount}/{items.length}</p>
          </div>
        </div>
      </Card>

      {/* Filter */}
      {services.length > 0 && (
        <Select
          label="Filtrar por serviço"
          value={filterServiceId?.toString() || ''}
          onChange={e => setFilterServiceId(e.target.value ? parseInt(e.target.value) : undefined)}
          options={[
            { value: '', label: 'Todos os serviços' },
            ...services.map(s => ({ value: String(s.id), label: s.name })),
          ]}
        />
      )}

      {/* Filter chip */}
      <button
        onClick={toggleOnlyPending}
        className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors ${
          onlyPending
            ? 'bg-primary border-primary text-white'
            : 'bg-transparent border-primary text-primary'
        }`}
      >
        A comprar
      </button>

      {/* Items */}
      {(() => {
        const sorted = [...items].sort((a, b) => Number(a.purchased) - Number(b.purchased))
        const filtered = sorted.filter(item => !onlyPending || !item.purchased)

        if (items.length === 0) {
          return (
            <Card>
              <p className="text-center text-text-secondary text-base py-4">
                Nenhum item na lista de compras.
              </p>
            </Card>
          )
        }

        if (filtered.length === 0) {
          return (
            <Card>
              <p className="text-center text-text-secondary text-base py-4">
                Não há materiais a comprar.
              </p>
            </Card>
          )
        }

        return filtered.map(item => (
          <Card key={item.id}>
            <div className="flex items-start gap-3">
              {/* Purchase checkbox */}
              <button
                onClick={() => togglePurchased(item.id)}
                className={`mt-0.5 w-7 h-7 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors
                  ${item.purchased ? 'bg-success border-success' : 'border-border hover:border-primary'}`}
                aria-label={item.purchased ? 'Marcar como não comprado' : 'Marcar como comprado'}
              >
                {item.purchased ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-5 h-5">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                ) : null}
              </button>

              {/* Content - clickable to navigate to detail */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => navigate(`/shopping/${item.id}`)}
              >
                <h3 className={`text-base font-bold ${item.purchased ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                  {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.name}
                </h3>
                <p className="text-sm text-text-secondary">
                  {item.service_name || 'Avulso'}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="text-sm text-text-secondary">
                    Est: {formatCurrency(item.estimated_price)}{item.quantity > 1 ? ` × ${item.quantity} = ${formatCurrency(item.estimated_price * item.quantity)}` : ''}
                  </span>
                  {item.actual_price !== null ? (
                    <span className="text-base font-bold text-success">
                      Real: {formatCurrency(item.actual_price)}{item.quantity > 1 ? ` × ${item.quantity} = ${formatCurrency(item.actual_price * item.quantity)}` : ''}
                    </span>
                  ) : (
                    <span className="text-sm text-primary font-semibold">
                      + Valor real
                    </span>
                  )}
                </div>
              </div>

              {/* Chevron */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-text-secondary flex-shrink-0 mt-1">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </Card>
        ))
      })()}

      {/* Add Form */}
      {showAdd && (
        <Card>
          <div ref={addFormRef}>
            <h3 className="text-lg font-bold text-text-primary mb-3">Novo Item</h3>
            <div className="space-y-3">
              <Input label="Nome" value={newName} onChange={e => setNewName((e.target as HTMLInputElement).value)} placeholder="Ex: Tinta branca 18L" />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Quantidade" type="number" value={newQuantity} onChange={e => setNewQuantity((e.target as HTMLInputElement).value)} min="1" step="1" />
                <Input label="Preço Unit. Estimado (R$)" type="number" value={newEstimated} onChange={e => setNewEstimated((e.target as HTMLInputElement).value)} placeholder="0.00" step="0.01" />
              </div>
              {services.length > 0 && (
                <Select
                  label="Serviço"
                  value={newServiceId}
                  onChange={e => setNewServiceId(e.target.value)}
                  options={[
                    { value: '', label: 'Nenhum (avulso)' },
                    ...services.map(s => ({ value: String(s.id), label: s.name })),
                  ]}
                />
              )}
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowAdd(false)} className="flex-1">Cancelar</Button>
                <Button onClick={handleAdd} loading={addLoading} className="flex-1">Salvar</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* FAB */}
      {!showAdd && (
        <button
          onClick={() => {
            setShowAdd(true)
            setTimeout(() => addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50)
          }}
          className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-hover transition-colors z-30"
          aria-label="Adicionar item"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}
    </div>
  )
}
