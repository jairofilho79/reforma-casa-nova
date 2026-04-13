export type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

export type Variables = {
  userId: number
  username: string
}

export type Mudanca = {
  id: number
  name: string
  created_at: string
}

export type Service = {
  id: number
  mudanca_id: number
  name: string
  materials_description: string
  service_cost: number
  status: 'pending' | 'in_progress' | 'completed'
  selected: number
  start_date?: string
  end_date?: string
  provider: string
  provider_id: number | null
  created_at: string
  updated_at: string
}

export type Provider = {
  id: number
  mudanca_id: number
  name: string
  phone: string
  notes: string
  created_at: string
  updated_at: string
}

export type ProviderPayment = {
  id: number
  mudanca_id: number
  provider_id: number
  payment_date: string
  amount: number
  notes: string
  created_at: string
}

export type ShoppingItem = {
  id: number
  mudanca_id: number
  service_id: number | null
  service_name?: string
  name: string
  quantity: number
  estimated_price: number
  actual_price: number | null
  purchased: number
  purchase_date?: string
  supplier: string
  created_at: string
  updated_at: string
}

export type User = {
  id: number
  username: string
  name: string
  password_hash: string
}
