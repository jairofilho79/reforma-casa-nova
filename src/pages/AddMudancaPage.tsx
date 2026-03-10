import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMudanca } from '../context/MudancaContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export function AddMudancaPage() {
  const navigate = useNavigate()
  const { createMudanca } = useMudanca()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await createMudanca(name.trim())
      navigate('/', { replace: true })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-primary font-semibold text-base hover:underline"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Voltar
      </button>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="text-xl font-bold text-text-primary">Nova Mudança</h2>

          <div className="bg-amber-50 border border-amber-300 rounded-lg px-4 py-3">
            <p className="text-sm text-amber-700 font-semibold">
              O nome da mudança não poderá ser alterado depois de criada.
            </p>
          </div>

          <Input
            label="Nome da Mudança"
            value={name}
            onChange={e => setName((e.target as HTMLInputElement).value)}
            placeholder="Ex: Reforma do Apartamento"
            required
          />

          {error && (
            <p className="text-sm text-danger font-semibold">{error}</p>
          )}

          <Button type="submit" loading={saving} className="w-full">
            Criar Mudança
          </Button>
        </form>
      </Card>
    </div>
  )
}
