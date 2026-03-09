import { useDashboard } from '../hooks/useDashboard'
import { Card } from '../components/ui/Card'
import { formatCurrency, formatHours } from '../lib/formatters'

export function DashboardPage() {
  const { data, loading } = useDashboard()

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
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div>
            <p className="text-xl font-bold text-warning">{data.progress.pending}</p>
            <p className="text-sm text-text-secondary">Pendentes</p>
          </div>
          <div>
            <p className="text-xl font-bold text-primary">{data.progress.in_progress}</p>
            <p className="text-sm text-text-secondary">Em Andamento</p>
          </div>
          <div>
            <p className="text-xl font-bold text-success">{data.progress.completed}</p>
            <p className="text-sm text-text-secondary">Concluídos</p>
          </div>
        </div>
      </Card>

      {/* Shopping Summary */}
      <Card>
        <h3 className="text-lg font-bold text-text-primary mb-2">Lista de Compras</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-xl font-bold text-primary">{data.shopping.purchased}</p>
            <p className="text-sm text-text-secondary">Comprados</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-bold text-warning">{data.shopping.pending}</p>
            <p className="text-sm text-text-secondary">Pendentes</p>
          </div>
        </div>
      </Card>

      {/* Hours */}
      {data.progress.total_hours > 0 && (
        <Card>
          <h3 className="text-lg font-bold text-text-primary mb-1">Tempo Total</h3>
          <p className="text-2xl font-bold text-primary">{formatHours(data.progress.total_hours)}</p>
        </Card>
      )}

      {/* Materials estimate vs actual */}
      {data.budget.total_estimated_materials > 0 && (
        <Card>
          <h3 className="text-lg font-bold text-text-primary mb-2">Materiais</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-sm text-text-secondary">Estimado</p>
              <p className="text-lg font-bold text-text-primary">{formatCurrency(data.budget.total_estimated_materials)}</p>
            </div>
            <div>
              <p className="text-sm text-text-secondary">Real</p>
              <p className="text-lg font-bold text-text-primary">{formatCurrency(data.budget.total_actual_materials)}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
