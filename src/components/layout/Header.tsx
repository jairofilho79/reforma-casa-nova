import { useAuth } from '../../context/AuthContext'
import { Button } from '../ui/Button'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-primary text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
      <div>
        <h1 className="text-lg font-bold leading-tight">Reforma Casa Nova</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm opacity-90 hidden sm:inline">Olá, {user?.name}</span>
        <Button variant="ghost" size="sm" onClick={logout} className="!text-white hover:!bg-white/20">
          Sair
        </Button>
      </div>
    </header>
  )
}
