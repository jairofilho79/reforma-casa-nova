import { Hono } from 'hono'
import type { Bindings, Variables } from '../types'

const shopping = new Hono<{ Bindings: Bindings; Variables: Variables }>()

shopping.get('/summary', async (c) => {
  const result = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as total_items,
      SUM(CASE WHEN purchased = 1 THEN 1 ELSE 0 END) as purchased_count,
      SUM(estimated_price) as total_estimated,
      SUM(CASE WHEN actual_price IS NOT NULL THEN actual_price ELSE 0 END) as total_actual
    FROM shopping_items
  `).first()

  return c.json(result)
})

shopping.get('/', async (c) => {
  const serviceId = c.req.query('service_id')

  let query = `
    SELECT si.*, s.name as service_name
    FROM shopping_items si
    LEFT JOIN services s ON si.service_id = s.id
  `

  if (serviceId) {
    query += ` WHERE si.service_id = ? ORDER BY si.id ASC`
    const { results } = await c.env.DB.prepare(query).bind(serviceId).all()
    return c.json(results)
  }

  query += ` ORDER BY si.purchased ASC, si.id ASC`
  const { results } = await c.env.DB.prepare(query).all()
  return c.json(results)
})

shopping.post('/', async (c) => {
  const body = await c.req.json<{
    service_id?: number
    name: string
    estimated_price?: number
  }>()

  if (!body.name) {
    return c.json({ error: 'Nome é obrigatório' }, 400)
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO shopping_items (service_id, name, estimated_price)
     VALUES (?, ?, ?)`
  ).bind(
    body.service_id || null,
    body.name,
    body.estimated_price || 0
  ).run()

  const item = await c.env.DB.prepare(
    `SELECT si.*, s.name as service_name
     FROM shopping_items si
     LEFT JOIN services s ON si.service_id = s.id
     WHERE si.id = ?`
  ).bind(result.meta.last_row_id).first()

  return c.json(item, 201)
})

shopping.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{
    service_id?: number | null
    name?: string
    estimated_price?: number
    actual_price?: number | null
    purchased?: boolean
  }>()

  const existing = await c.env.DB.prepare(
    'SELECT * FROM shopping_items WHERE id = ?'
  ).bind(id).first()

  if (!existing) {
    return c.json({ error: 'Item não encontrado' }, 404)
  }

  const ex = existing as Record<string, unknown>

  await c.env.DB.prepare(
    `UPDATE shopping_items SET
      service_id = ?,
      name = ?,
      estimated_price = ?,
      actual_price = ?,
      purchased = ?,
      updated_at = datetime('now')
    WHERE id = ?`
  ).bind(
    body.service_id !== undefined ? body.service_id : ex.service_id,
    body.name ?? ex.name,
    body.estimated_price ?? ex.estimated_price,
    body.actual_price !== undefined ? body.actual_price : ex.actual_price,
    body.purchased !== undefined ? (body.purchased ? 1 : 0) : ex.purchased,
    id
  ).run()

  const updated = await c.env.DB.prepare(
    `SELECT si.*, s.name as service_name
     FROM shopping_items si
     LEFT JOIN services s ON si.service_id = s.id
     WHERE si.id = ?`
  ).bind(id).first()

  return c.json(updated)
})

shopping.delete('/:id', async (c) => {
  const id = c.req.param('id')

  const existing = await c.env.DB.prepare(
    'SELECT id FROM shopping_items WHERE id = ?'
  ).bind(id).first()

  if (!existing) {
    return c.json({ error: 'Item não encontrado' }, 404)
  }

  await c.env.DB.prepare('DELETE FROM shopping_items WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

shopping.patch('/:id/purchased', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ actual_price?: number }>().catch(() => ({}))

  const existing = await c.env.DB.prepare(
    'SELECT * FROM shopping_items WHERE id = ?'
  ).bind(id).first() as Record<string, unknown> | null

  if (!existing) {
    return c.json({ error: 'Item não encontrado' }, 404)
  }

  const newPurchased = existing.purchased === 1 ? 0 : 1
  const actualPrice = newPurchased === 1 && body.actual_price !== undefined
    ? body.actual_price
    : (newPurchased === 0 ? null : existing.actual_price)

  await c.env.DB.prepare(
    `UPDATE shopping_items SET purchased = ?, actual_price = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(newPurchased, actualPrice, id).run()

  const updated = await c.env.DB.prepare(
    `SELECT si.*, s.name as service_name
     FROM shopping_items si
     LEFT JOIN services s ON si.service_id = s.id
     WHERE si.id = ?`
  ).bind(id).first()

  return c.json(updated)
})

export { shopping as shoppingRoutes }
