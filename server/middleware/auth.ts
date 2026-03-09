import { Context, Next } from 'hono'
import { jwt } from 'hono/jwt'
import type { Bindings, Variables } from '../types'

export function authMiddleware() {
  return async (c: Context<{ Bindings: Bindings; Variables: Variables }>, next: Next) => {
    const jwtMiddleware = jwt({ secret: c.env.JWT_SECRET })
    await jwtMiddleware(c, next)
  }
}
