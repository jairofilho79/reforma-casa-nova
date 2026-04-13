import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useMudanca } from '../context/MudancaContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { MoneyInput } from '../components/ui/MoneyInput'
import { StatusBadge } from '../components/ui/StatusBadge'
import { formatCurrency } from '../lib/formatters'
import { formatPhoneBrDisplay } from '../lib/phoneBr'
import type { Provider, ProviderPayment } from '@server/types'

type ServiceRow = {
  id: number
  name: string
  status: string
  service_cost: number
  paid_amount: number
  pending_amount: number
}

type ProviderDetailPayload = {
  provider: Provider
  services: ServiceRow[]
  payments: ProviderPayment[]
  totals: {
    total_combined: number
    total_paid: number
    total_pending: number
  }
}

export function ProviderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { activeMudanca } = useMudanca()
  const [data, setData] = useState<ProviderDetailPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [payLoading, setPayLoading] = useState(false)
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentNotes, setPaymentNotes] = useState('')

  const load = useCallback(async () => {
    if (!activeMudanca || !id) return
    const res = await api.get<ProviderDetailPayload>(
      `/providers/${id}?mudanca_id=${activeMudanca.id}`
    )
    setData(res)
  }, [activeMudanca?.id, id])

  useEffect(() => {
    if (!activeMudanca || !id) {
      setLoading(false)
      return
    }
    setLoading(true)
    load()
      .catch(() => navigate('/providers', { replace: true }))
      .finally(() => setLoading(false))
  }, [id, activeMudanca?.id, load, navigate])

  const handlePay = async (e: FormEvent) => {
    e.preventDefault()
    if (!activeMudanca || !id || !paymentDate.trim() || !paymentAmount.trim()) return
    setPayLoading(true)
    try {
      await api.post(`/providers/${id}/payments?mudanca_id=${activeMudanca.id}`, {
        payment_date: paymentDate,
        amount: parseFloat(paymentAmount) || 0,
        notes: paymentNotes.trim(),
      })
      setPaymentAmount('')
      setPaymentNotes('')
      await load()
    } finally {
      setPayLoading(false)
    }
  }

  if (!activeMudanca) {
    return (
      <Card>
        <p className="text-center text-text-secondary py-4">Selecione uma mudança no menu superior.</p>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!data) return null

  const { provider, services, totals } = data

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => navigate('/providers')}
        className="flex items-center gap-1 text-primary font-semibold text-base hover:underline"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Voltar
      </button>

      <Card>
        <h2 className="text-xl font-bold text-text-primary">{provider.name}</h2>
        {provider.phone ? (
          <p className="text-sm text-text-secondary mt-2">{formatPhoneBrDisplay(provider.phone)}</p>
        ) : null}
        {provider.notes ? (
          <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap">{provider.notes}</p>
        ) : null}
      </Card>

      <Card className="!bg-primary-light border-primary/20">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-sm text-text-secondary">Valor pago</p>
            <p className="text-lg font-bold text-success">{formatCurrency(totals.total_paid)}</p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">A pagar</p>
            <p className="text-lg font-bold text-warning">{formatCurrency(totals.total_pending)}</p>
          </div>
        </div>
        <p className="text-xs text-text-secondary text-center mt-2">
          Valor combinado (serviços): {formatCurrency(totals.total_combined)}
        </p>
      </Card>

      <Card>
        <h3 className="text-lg font-bold text-text-primary mb-3">Serviços</h3>
        {services.length === 0 ? (
          <p className="text-center text-text-secondary text-base py-2">Nenhum serviço vinculado a este prestador.</p>
        ) : (
          <div className="space-y-3">
            {services.map(s => (
              <button
                key={s.id}
                type="button"
                className="w-full text-left p-3 rounded-lg border border-border hover:border-primary transition-colors"
                onClick={() => navigate(`/services/${s.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-base font-bold text-text-primary truncate">{s.name}</h4>
                  <StatusBadge status={s.status} />
                </div>
                <p className="text-sm text-text-secondary mt-1">Combinado: {formatCurrency(s.service_cost)}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-sm">
                  <span className="text-success font-semibold">Pago: {formatCurrency(s.paid_amount)}</span>
                  <span className="text-warning font-semibold">Pendente: {formatCurrency(s.pending_amount)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <form onSubmit={handlePay} className="space-y-4">
          <h3 className="text-lg font-bold text-text-primary">Pagar prestador (direto)</h3>
          <p className="text-sm text-text-secondary">
            O valor abate o saldo geral do prestador, independente de qual serviço.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Data do pagamento"
              type="date"
              value={paymentDate}
              onChange={e => setPaymentDate((e.target as HTMLInputElement).value)}
              required
            />
            <MoneyInput
              label="Valor pago"
              value={paymentAmount}
              onChange={setPaymentAmount}
              required
              placeholder="R$ 0,00"
            />
          </div>
          <Input
            label="Anotações"
            value={paymentNotes}
            onChange={e => setPaymentNotes((e.target as HTMLTextAreaElement).value)}
            multiline
            placeholder="Observações sobre o pagamento"
          />
          <Button
            type="submit"
            loading={payLoading}
            className="w-full"
            disabled={!paymentDate.trim() || !paymentAmount.trim()}
          >
            Registrar pagamento
          </Button>
        </form>
      </Card>
    </div>
  )
}
