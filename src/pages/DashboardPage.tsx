import { useNavigate } from 'react-router-dom'
import { useDashboard } from '../hooks/useDashboard'
import { Card } from '../components/ui/Card'
import { formatCurrency } from '../lib/formatters'

export function DashboardPage() {
  const { data, loading } = useDashboard()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-text-primary">Painel Financeiro</h2>

      {/* Budget Cards */}
      <div className="grid grid-cols-1 gap-3">
        <Card className="!bg-primary-light border-primary/20">
          <p className="text-sm font-semibold text-primary">Orçamento Total</p>
          <p className="text-2xl font-bold text-primary mt-1">{formatCurrency(data.budget.selected_service_cost)}</p>
          <p className="text-sm text-text-secondary mt-0.5">serviços selecionados</p>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="!bg-warning-light border-warning/20">
            <p className="text-sm font-semibold text-warning">Gasto</p>
            <p className="text-xl font-bold text-warning mt-1">{formatCurrency(data.budget.total_actual_materials)}</p>
            <p className="text-sm text-text-secondary mt-0.5">materiais</p>
          </Card>

          <Card className="!bg-success-light border-success/20">
            <p className="text-sm font-semibold text-success">Restante</p>
            <p className="text-xl font-bold text-success mt-1">{formatCurrency(data.budget.remaining)}</p>
            <p className="text-sm text-text-secondary mt-0.5">estimado</p>
          </Card>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <div
          className="cursor-pointer"
          onClick={() => navigate('/services')}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-text-primary">Progresso</h3>
            <span className="text-xl font-bold text-primary">{data.progress.completion_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${data.progress.completion_percentage}%` }}
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="cursor-pointer" onClick={() => navigate('/services?status=pending')}>
            <p className="text-xl font-bold text-warning">{data.progress.pending}</p>
            <p className="text-sm text-text-secondary">Pendentes</p>
          </div>
          <div className="cursor-pointer" onClick={() => navigate('/services?status=in_progress')}>
            <p className="text-xl font-bold text-primary">{data.progress.in_progress}</p>
            <p className="text-sm text-text-secondary">Em Andamento</p>
          </div>
          <div className="cursor-pointer" onClick={() => navigate('/services?status=completed')}>
            <p className="text-xl font-bold text-success">{data.progress.completed}</p>
            <p className="text-sm text-text-secondary">Concluídos</p>
          </div>
        </div>
      </Card>

      {/* Gastos por prestador (Top 5) */}
      <Card>
        <h3 className="text-lg font-bold text-text-primary mb-3">Gastos por Prestador (Top 5)</h3>
        {(data.providers_summary ?? []).length === 0 ? (
          <p className="text-center text-text-secondary text-base py-2">
            Nenhum prestador com serviços ou pagamentos nesta mudança.
          </p>
        ) : (
          <div className="space-y-2">
            {(data.providers_summary ?? []).map(row => (
              <button
                key={row.provider_id}
                type="button"
                className="w-full text-left p-3 rounded-lg border border-border hover:border-primary transition-colors"
                onClick={() => navigate(`/providers/${row.provider_id}`)}
              >
                <p className="text-base font-bold text-text-primary truncate">{row.name}</p>
                <div className="flex justify-between gap-2 mt-2 text-sm">
                  <span className="text-success font-semibold">Pago: {formatCurrency(row.total_paid)}</span>
                  <span className="text-warning font-semibold">A pagar: {formatCurrency(row.total_pending)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* Shopping & Materials */}
      <Card>
        <h3
          className="text-lg font-bold text-text-primary mb-2 cursor-pointer"
          onClick={() => navigate('/shopping')}
        >
          Lista de Compras
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="text-center cursor-pointer" onClick={() => navigate('/shopping')}>
            <p className="text-xl font-bold text-primary">{data.shopping.purchased}</p>
            <p className="text-sm text-text-secondary">Comprados</p>
          </div>
          <div className="text-center cursor-pointer" onClick={() => navigate('/shopping?pending=true')}>
            <p className="text-xl font-bold text-warning">{data.shopping.pending}</p>
            <p className="text-sm text-text-secondary">Pendentes</p>
          </div>
        </div>
        {data.budget.total_estimated_materials > 0 && (
          <div
            className="grid grid-cols-2 gap-3 pt-3 border-t border-border text-center cursor-pointer"
            onClick={() => navigate('/shopping')}
          >
            <div>
              <p className="text-sm text-text-secondary">Estimado</p>
              <p className="text-lg font-bold text-text-primary">{formatCurrency(data.budget.total_estimated_materials)}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Real</p>
              <p className="text-lg font-bold text-text-primary">{formatCurrency(data.budget.total_actual_materials)}</p>
            </div>
          </div>
        )}
      </Card>

    </div>
  )
}
