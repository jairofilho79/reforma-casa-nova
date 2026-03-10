import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useMudanca } from '../../context/MudancaContext'
import { Button } from '../ui/Button'
import { ConfirmDialog } from '../ui/ConfirmDialog'

export function Header() {
  const { user, logout } = useAuth()
  const { mudancas, activeMudanca, switchMudanca, deleteMudanca } = useMudanca()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const handleSwitch = (id: number) => {
    switchMudanca(id)
    setDropdownOpen(false)
  }

  const handleDelete = async () => {
    if (deleteTarget === null) return
    await deleteMudanca(deleteTarget)
    setDeleteTarget(null)
  }

  return (
    <header className="bg-primary text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(prev => !prev)}
          className="flex items-center gap-1.5 text-lg font-bold leading-tight hover:opacity-90 transition-opacity"
        >
          <span className="truncate max-w-[200px]">
            {activeMudanca?.name || 'Carregando...'}
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
            strokeWidth={2.5} stroke="currentColor"
            className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute left-0 top-full mt-2 bg-surface rounded-xl shadow-lg border border-border min-w-[260px] z-50 overflow-hidden">
            <div className="max-h-[300px] overflow-y-auto">
              {mudancas.map(m => (
                <div
                  key={m.id}
                  className={`flex items-center justify-between px-4 py-3 transition-colors
                    ${m.id === activeMudanca?.id
                      ? 'bg-primary/10'
                      : 'hover:bg-gray-100'}`}
                >
                  <button
                    onClick={() => handleSwitch(m.id)}
                    className={`flex-1 text-left text-base font-semibold truncate
                      ${m.id === activeMudanca?.id ? 'text-primary' : 'text-text-primary'}`}
                  >
                    {m.name}
                  </button>
                  {mudancas.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget(m.id)
                        setDropdownOpen(false)
                      }}
                      className="ml-2 p-1 text-text-secondary hover:text-danger transition-colors flex-shrink-0"
                      aria-label={`Excluir ${m.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                        strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-border">
              <button
                onClick={() => {
                  setDropdownOpen(false)
                  navigate('/mudancas/new')
                }}
                className="w-full flex items-center gap-2 px-4 py-3 text-primary font-semibold text-base hover:bg-primary/5 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                  strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Adicionar Mudança
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm opacity-90 hidden sm:inline">Olá, {user?.name}</span>
        <Button variant="ghost" size="sm" onClick={logout} className="!text-white hover:!bg-white/20">
          Sair
        </Button>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Excluir Mudança"
        message={`Tem certeza que deseja excluir "${mudancas.find(m => m.id === deleteTarget)?.name}"? Todos os serviços e itens de compras serão excluídos. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </header>
  )
}
