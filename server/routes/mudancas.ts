import { Hono } from 'hono'
import type { Bindings, Variables } from '../types'

const mudancas = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// GET / - List all mudancas
mudancas.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM mudancas ORDER BY id ASC'
  ).all()
  return c.json(results)
})

// POST / - Create a new mudanca
mudancas.post('/', async (c) => {
  const body = await c.req.json<{ name: string }>()

  if (!body.name || !body.name.trim()) {
    return c.json({ error: 'Nome é obrigatório' }, 400)
  }

  const result = await c.env.DB.prepare(
    'INSERT INTO mudancas (name) VALUES (?)'
  ).bind(body.name.trim()).run()

  const mudanca = await c.env.DB.prepare(
    'SELECT * FROM mudancas WHERE id = ?'
  ).bind(result.meta.last_row_id).first()

  return c.json(mudanca, 201)
})

// DELETE /:id - Delete a mudanca and all its data
mudancas.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))

  const count = await c.env.DB.prepare(
    'SELECT COUNT(*) as count FROM mudancas'
  ).first<{ count: number }>()

  if (count && count.count <= 1) {
    return c.json({ error: 'Não é possível excluir a única mudança' }, 400)
  }

  const existing = await c.env.DB.prepare(
    'SELECT id FROM mudancas WHERE id = ?'
  ).bind(id).first()

  if (!existing) {
    return c.json({ error: 'Mudança não encontrada' }, 404)
  }

  // Cascade delete: shopping_items first, then services, then mudanca
  await c.env.DB.prepare('DELETE FROM shopping_items WHERE mudanca_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM services WHERE mudanca_id = ?').bind(id).run()
  await c.env.DB.prepare('DELETE FROM mudancas WHERE id = ?').bind(id).run()

  return c.json({ success: true })
})

export { mudancas as mudancaRoutes }
