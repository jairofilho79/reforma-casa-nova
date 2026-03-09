import { useState, useEffect } from 'react'
import { useShoppingItems } from '../hooks/useShoppingItems'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { formatCurrency } from '../lib/formatters'
import { api } from '../lib/api'
import type { Service } from '@server/types'

export function ShoppingPage() {
  const [filterServiceId, setFilterServiceId] = useState<number | undefined>()
  const { items, loading, togglePurchased, createItem, updateItem, deleteItem } = useShoppingItems(filterServiceId)
  const [services, setServices] = useState<Service[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [newName, setNewName] = useState('')
  const [newEstimated, setNewEstimated] = useState('')
  const [newServiceId, setNewServiceId] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editPrice, setEditPrice] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  useEffect(() => {
    api.get<Service[]>('/services').then(setServices).catch(() => {})
  }, [])

  const totalEstimated = items.reduce((sum, i) => sum + i.estimated_price, 0)
  const totalActual = items.reduce((sum, i) => sum + (i.actual_price || 0), 0)
  const purchasedCount = items.filter(i => i.purchased).length

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAddLoading(true)
    try {
      await createItem({
        name: newName.trim(),
        estimated_price: parseFloat(newEstimated) || 0,
        service_id: newServiceId ? parseInt(newServiceId) : undefined,
      })
      setNewName('')
      setNewEstimated('')
      setNewServiceId('')
      setShowAdd(false)
    } finally {
      setAddLoading(false)
    }
  }

  const handleSavePrice = async (id: number) => {
    await updateItem(id, { actual_price: parseFloat(editPrice) || 0 })
    setEditingId(null)
    setEditPrice('')
  }

  const handleDelete = async () => {
    if (deleteConfirm === null) return
    await deleteItem(deleteConfirm)
    setDeleteConfirm(null)
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

      {/* Items */}
      {items.length === 0 ? (
        <Card>
          <p className="text-center text-text-secondary text-base py-4">
            Nenhum item na lista de compras.
          </p>
        </Card>
      ) : (
        items.map(item => (
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

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className={`text-base font-bold ${item.purchased ? 'line-through text-text-secondary' : 'text-text-primary'}`}>
                  {item.name}
                </h3>
                {item.service_name && (
                  <p className="text-sm text-text-secondary">{item.service_name}</p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-text-secondary">
                    Est: {formatCurrency(item.estimated_price)}
                  </span>
                  {item.actual_price !== null ? (
                    <span className="text-base font-bold text-success">
                      Real: {formatCurrency(item.actual_price)}
                    </span>
                  ) : editingId === item.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        className="w-24 border border-border rounded px-2 py-1 text-sm"
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleSavePrice(item.id)}>OK</Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(item.id); setEditPrice('') }}
                      className="text-sm text-primary font-semibold hover:underline"
                    >
                      + Valor real
                    </button>
                  )}
                </div>
              </div>

              {/* Delete */}
              <button
                onClick={() => setDeleteConfirm(item.id)}
                className="p-1.5 text-text-secondary hover:text-danger transition-colors flex-shrink-0"
                aria-label="Excluir"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            </div>
          </Card>
        ))
      )}

      {/* Add Form */}
      {showAdd && (
        <Card>
          <h3 className="text-lg font-bold text-text-primary mb-3">Novo Item</h3>
          <div className="space-y-3">
            <Input label="Nome" value={newName} onChange={e => setNewName((e.target as HTMLInputElement).value)} placeholder="Ex: Tinta branca 18L" />
            <Input label="Preço Estimado (R$)" type="number" value={newEstimated} onChange={e => setNewEstimated((e.target as HTMLInputElement).value)} placeholder="0.00" step="0.01" />
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
        </Card>
      )}

      {/* FAB */}
      {!showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-hover transition-colors z-30"
          aria-label="Adicionar item"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}

      <ConfirmDialog
        open={deleteConfirm !== null}
        title="Excluir Item"
        message="Tem certeza que deseja excluir este item da lista de compras?"
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
