export type Bindings = {
  DB: D1Database
  JWT_SECRET: string
}

export type Variables = {
  userId: number
  username: string
}

export type Service = {
  id: number
  name: string
  materials_description: string
  service_cost: number
  status: 'pending' | 'in_progress' | 'completed'
  selected: number
  time_spent_hours: number
  created_at: string
  updated_at: string
}

export type ShoppingItem = {
  id: number
  service_id: number | null
  service_name?: string
  name: string
  quantity: number
  estimated_price: number
  actual_price: number | null
  purchased: number
  created_at: string
  updated_at: string
}

export type User = {
  id: number
  username: string
  name: string
  password_hash: string
}
