import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProviders } from '../hooks/useProviders'
import { useMudanca } from '../context/MudancaContext'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { formatPhoneBrDisplay, isValidPhoneBrDigits, maskPhoneBrInput, digitsOnlyPhone } from '../lib/phoneBr'

export function ProvidersPage() {
  const navigate = useNavigate()
  const { activeMudanca } = useMudanca()
  const { providers, loading, createProvider } = useProviders()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return providers
    return providers.filter(p => p.name.toLowerCase().includes(q))
  }, [providers, search])

  const handlePhoneChange = (v: string) => {
    setPhone(maskPhoneBrInput(v))
    setPhoneError('')
  }

  const handleAdd = async () => {
    if (!name.trim()) return
    const digits = digitsOnlyPhone(phone)
    if (!isValidPhoneBrDigits(phone)) {
      setPhoneError('Telefone inválido (use DDD + número, 10 ou 11 dígitos)')
      return
    }
    setAddLoading(true)
    try {
      await createProvider({
        name: name.trim(),
        phone: digits || undefined,
        notes: notes.trim(),
      })
      setName('')
      setPhone('')
      setNotes('')
      setPhoneError('')
      setShowAdd(false)
    } catch {
      // api throws with message
    } finally {
      setAddLoading(false)
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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-text-primary">Prestadores</h2>

      <Input
        label="Pesquisar"
        value={search}
        onChange={e => setSearch((e.target as HTMLInputElement).value)}
        placeholder="Buscar por nome..."
      />

      {filtered.length === 0 ? (
        <Card>
          <p className="text-center text-text-secondary text-base py-4">
            {providers.length === 0 ? 'Nenhum prestador cadastrado.' : 'Nenhum prestador encontrado.'}
          </p>
        </Card>
      ) : (
        filtered.map(p => (
          <Card key={p.id}>
            <button
              type="button"
              className="w-full text-left"
              onClick={() => navigate(`/providers/${p.id}`)}
            >
              <h3 className="text-base font-bold text-text-primary">{p.name}</h3>
              {p.phone ? (
                <p className="text-sm text-text-secondary mt-1">{formatPhoneBrDisplay(p.phone)}</p>
              ) : null}
              {p.notes ? (
                <p className="text-sm text-text-secondary mt-1 line-clamp-2">{p.notes}</p>
              ) : null}
            </button>
          </Card>
        ))
      )}

      {showAdd && (
        <Card>
          <h3 className="text-lg font-bold text-text-primary mb-3">Novo Prestador</h3>
          <div className="space-y-3">
            <Input
              label="Nome"
              value={name}
              onChange={e => setName((e.target as HTMLInputElement).value)}
              placeholder="Ex: João Pedreiro"
              required
            />
            <Input
              label="Telefone (pt-BR)"
              value={phone}
              onChange={e => handlePhoneChange((e.target as HTMLInputElement).value)}
              placeholder="(11) 98765-4321"
              inputMode="tel"
            />
            {phoneError ? <p className="text-sm text-danger">{phoneError}</p> : null}
            <Input
              label="Anotações"
              value={notes}
              onChange={e => setNotes((e.target as HTMLTextAreaElement).value)}
              placeholder="Observações sobre o prestador"
              multiline
            />
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setShowAdd(false)} className="flex-1">Cancelar</Button>
              <Button onClick={handleAdd} loading={addLoading} className="flex-1" disabled={!name.trim()}>Salvar</Button>
            </div>
          </div>
        </Card>
      )}

      {!showAdd && (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-hover transition-colors z-30"
          aria-label="Adicionar prestador"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
      )}
    </div>
  )
}
