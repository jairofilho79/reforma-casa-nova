import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import type { Bindings, Variables, User } from '../types'

const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>()

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false
  const encoder = new TextEncoder()
  const data = encoder.encode(salt + password)
  // Use Web Crypto API (available in Workers)
  // We need to do this synchronously-ish, so we'll use a different approach
  // Actually, let's use the same crypto approach but async
  return false // placeholder, real check is async below
}

async function verifyPasswordAsync(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(':')
  if (!salt || !hash) return false
  const encoder = new TextEncoder()
  const data = encoder.encode(salt + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex === hash
}

auth.post('/login', async (c) => {
  const body = await c.req.json<{ username: string; password: string }>()

  if (!body.username || !body.password) {
    return c.json({ error: 'Usuário e senha são obrigatórios' }, 400)
  }

  const user = await c.env.DB.prepare(
    'SELECT id, username, password_hash, name FROM users WHERE username = ?'
  ).bind(body.username).first<User>()

  if (!user) {
    return c.json({ error: 'Usuário ou senha inválidos' }, 401)
  }

  const valid = await verifyPasswordAsync(body.password, user.password_hash)
  if (!valid) {
    return c.json({ error: 'Usuário ou senha inválidos' }, 401)
  }

  const token = await sign(
    { userId: user.id, username: user.username, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 },
    c.env.JWT_SECRET
  )

  return c.json({
    token,
    user: { id: user.id, username: user.username, name: user.name },
  })
})

auth.get('/me', async (c) => {
  const payload = c.get('jwtPayload' as never) as { userId: number; username: string } | undefined
  if (!payload) {
    return c.json({ error: 'Não autorizado' }, 401)
  }

  const user = await c.env.DB.prepare(
    'SELECT id, username, name FROM users WHERE id = ?'
  ).bind(payload.userId).first()

  if (!user) {
    return c.json({ error: 'Usuário não encontrado' }, 404)
  }

  return c.json({ user })
})

export { auth as authRoutes }
