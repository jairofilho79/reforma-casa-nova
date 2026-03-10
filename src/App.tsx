import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { MudancaProvider } from './context/MudancaContext'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ServicesPage } from './pages/ServicesPage'
import { ServiceDetailPage } from './pages/ServiceDetailPage'
import { ShoppingPage } from './pages/ShoppingPage'
import { ShoppingItemDetailPage } from './pages/ShoppingItemDetailPage'
import { AddMudancaPage } from './pages/AddMudancaPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MudancaProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/services/:id" element={<ServiceDetailPage />} />
              <Route path="/shopping" element={<ShoppingPage />} />
              <Route path="/shopping/:id" element={<ShoppingItemDetailPage />} />
              <Route path="/mudancas/new" element={<AddMudancaPage />} />
            </Route>
          </Routes>
        </MudancaProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
