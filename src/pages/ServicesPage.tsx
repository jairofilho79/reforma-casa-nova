import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useServices } from '../hooks/useServices'
import { useProviders } from '../hooks/useProviders'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { MoneyInput } from '../components/ui/MoneyInput'
import { StatusBadge } from '../components/ui/StatusBadge'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { formatCurrency } from '../lib/formatters'
import { Select } from '../components/ui/Select'

const nextStatus: Record<string, string> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'pending',
}

export function ServicesPage() {
  const { services, loading, toggleSelected, updateStatus, createService, deleteService } = useServices()
  const { providers } = useProviders()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCost, setNewCost] = useState('')
  const [newMaterials, setNewMaterials] = useState('')
  const [newProviderId, setNewProviderId] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const addFormRef = useRef<HTMLDivElement | null>(null)

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || '')

  useEffect(() => {
    if (!showAdd) return

    const frameId = requestAnimationFrame(() => {
      addFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

    return () => cancelAnimationFrame(frameId)
  }, [showAdd])

  const filtered = services.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterStatus && s.status !== filterStatus) return false
    return true
  })

  const selectedTotal = filtered
    .filter(s => s.selected)
    .reduce((sum, s) => sum + s.service_cost, 0)

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAddLoading(true)
    try {
      await createService({
        name: newName.trim(),
        service_cost: parseFloat(newCost) || 0,
        materials_description: newMaterials.trim(),
        provider_id: newProviderId ? parseInt(newProviderId) : null,
      })
      setNewName('')
      setNewCost('')
      setNewMaterials('')
      setNewProviderId('')
      setShowAdd(false)
    } finally {
      setAddLoading(false)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirm === null) return
    await deleteService(deleteConfirm)
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
      {/* Summary Bar */}
      <Card className="!bg-primary-light border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Total Selecionado</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(selectedTotal)}</p>
          </div>
          <p className="text-sm text-text-secondary">
            {services.filter(s => s.selected).length} de {services.length}
          </p>
        </div>
      </Card>

      {/* Search */}
      <Input
        label="Pesquisar"
        value={search}
        onChange={e => setSearch((e.target as HTMLInputElement).value)}
        placeholder="Buscar por nome..."
      />

      {/* Status Filter Chips */}
      <div className="flex gap-2 flex-wrap">
        {([
          { value: '', label: 'Todos' },
          { value: 'pending', label: 'Pendente' },
          { value: 'in_progress', label: 'Em Andamento' },
          { value: 'completed', label: 'Concluído' },
        ] as const).map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilterStatus(opt.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-colors ${filterStatus === opt.value
              ? 'bg-primary border-primary text-white'
              : 'bg-transparent border-primary text-primary'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Service Cards */}
      {filtered.length === 0 ? (
        <Card>
          <p className="text-center text-text-secondary text-base py-4">
            Nenhum serviço encontrado.
          </p>
        </Card>
      ) : filtered.map(service => (
        <Card key={service.id} className={`transition-opacity ${!service.selected ? 'opacity-60' : ''}`}>
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <button
              onClick={() => toggleSelected(service.id)}
              className="mt-0.5 w-7 h-7 rounded-md border-2 border-border flex items-center justify-center flex-shrink-0 transition-colors hover:border-primary"
              aria-label={service.selected ? 'Desselecionar' : 'Selecionar'}
            >
              {service.selected ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-primary">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
              ) : null}
            </button>

            {/* Content */}
            <div
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => navigate(`/services/${service.id}`)}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-bold text-text-primary truncate">{service.name}</h3>
                <StatusBadge
                  status={service.status}
                  onClick={() => {
                    const newStatus = nextStatus[service.status]
                    let startDate = service.start_date
                    let endDate = service.end_date
                    const now = new Date()
                    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

                    if (newStatus === 'in_progress' && !startDate) {
                      startDate = today
                    }
                    if (newStatus === 'completed' && !endDate) {
                      endDate = today
                    }
                    updateStatus(service.id, newStatus, startDate, endDate)
                  }}
                />
              </div>
              <p className="text-lg font-bold text-primary mt-1">{formatCurrency(service.service_cost)}</p>
              {service.materials_description && (
                <p className="text-sm text-text-secondary mt-0.5 line-clamp-2">{service.materials_description}</p>
              )}
            </div>

            {/* Delete */}
            <button
              onClick={() => setDeleteConfirm(service.id)}
              className="p-1.5 text-text-secondary hover:text-danger transition-colors flex-shrink-0"
              aria-label="Excluir"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
              </svg>
            </button>
          </div>
        </Card>
      ))}

      {/* Add Form */}
      {showAdd && (
        <div ref={addFormRef}>
          <Card>
            <h3 className="text-lg font-bold text-text-primary mb-3">Novo Serviço</h3>
            <div className="space-y-3">
              <Input label="Nome" value={newName} onChange={e => setNewName((e.target as HTMLInputElement).value)} placeholder="Ex: Pintura da sala" />
              <MoneyInput label="Valor do Serviço" value={newCost} onChange={setNewCost} placeholder="R$ 0,00" />
              <Input label="Materiais" value={newMaterials} onChange={e => setNewMaterials((e.target as HTMLInputElement).value)} placeholder="Lista de materiais necessários" multiline />
              <Select
                label="Prestador"
                value={newProviderId}
                onChange={e => setNewProviderId(e.target.value)}
                options={[
                  { value: '', label: 'Nenhum' },
                  ...providers.map(p => ({ value: String(p.id), label: p.name })),
                ]}
              />
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowAdd(false)} className="flex-1">Cancelar</Button>
                <Button onClick={handleAdd} loading={addLoading} className="flex-1">Salvar</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* FAB */}
      {!showAdd && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-hover transition-colors z-30"
          aria-label="Adicionar serviço"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        open={deleteConfirm !== null}
        title="Excluir Serviço"
        message="Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
