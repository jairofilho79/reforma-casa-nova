import { Hono } from 'hono'
import type { Bindings, Variables } from '../types'

const services = new Hono<{ Bindings: Bindings; Variables: Variables }>()

services.get('/summary', async (c) => {
  const result = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as total_services,
      SUM(CASE WHEN selected = 1 THEN 1 ELSE 0 END) as selected_services,
      SUM(CASE WHEN selected = 1 THEN service_cost ELSE 0 END) as total_cost_selected,
      SUM(service_cost) as total_cost_all,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
      SUM(time_spent_hours) as total_hours
    FROM services
  `).first()

  return c.json(result)
})

services.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM services ORDER BY id ASC'
  ).all()
  return c.json(results)
})

services.get('/:id', async (c) => {
  const id = c.req.param('id')
  const service = await c.env.DB.prepare(
    'SELECT * FROM services WHERE id = ?'
  ).bind(id).first()

  if (!service) {
    return c.json({ error: 'Serviço não encontrado' }, 404)
  }

  const { results: shoppingItems } = await c.env.DB.prepare(
    'SELECT * FROM shopping_items WHERE service_id = ? ORDER BY id ASC'
  ).bind(id).all()

  return c.json({ ...service, shopping_items: shoppingItems })
})

services.post('/', async (c) => {
  const body = await c.req.json<{
    name: string
    materials_description?: string
    service_cost?: number
  }>()

  if (!body.name) {
    return c.json({ error: 'Nome é obrigatório' }, 400)
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO services (name, materials_description, service_cost)
     VALUES (?, ?, ?)`
  ).bind(
    body.name,
    body.materials_description || '',
    body.service_cost || 0
  ).run()

  const service = await c.env.DB.prepare(
    'SELECT * FROM services WHERE id = ?'
  ).bind(result.meta.last_row_id).first()

  return c.json(service, 201)
})

services.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{
    name?: string
    materials_description?: string
    service_cost?: number
    status?: string
    selected?: boolean
    time_spent_hours?: number
  }>()

  const existing = await c.env.DB.prepare(
    'SELECT * FROM services WHERE id = ?'
  ).bind(id).first()

  if (!existing) {
    return c.json({ error: 'Serviço não encontrado' }, 404)
  }

  await c.env.DB.prepare(
    `UPDATE services SET
      name = ?,
      materials_description = ?,
      service_cost = ?,
      status = ?,
      selected = ?,
      time_spent_hours = ?,
      updated_at = datetime('now')
    WHERE id = ?`
  ).bind(
    body.name ?? (existing as Record<string, unknown>).name,
    body.materials_description ?? (existing as Record<string, unknown>).materials_description,
    body.service_cost ?? (existing as Record<string, unknown>).service_cost,
    body.status ?? (existing as Record<string, unknown>).status,
    body.selected !== undefined ? (body.selected ? 1 : 0) : (existing as Record<string, unknown>).selected,
    body.time_spent_hours ?? (existing as Record<string, unknown>).time_spent_hours,
    id
  ).run()

  const updated = await c.env.DB.prepare(
    'SELECT * FROM services WHERE id = ?'
  ).bind(id).first()

  return c.json(updated)
})

services.delete('/:id', async (c) => {
  const id = c.req.param('id')

  const existing = await c.env.DB.prepare(
    'SELECT id FROM services WHERE id = ?'
  ).bind(id).first()

  if (!existing) {
    return c.json({ error: 'Serviço não encontrado' }, 404)
  }

  await c.env.DB.prepare('DELETE FROM services WHERE id = ?').bind(id).run()
  return c.json({ success: true })
})

services.patch('/:id/toggle', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(
    `UPDATE services SET selected = CASE WHEN selected = 1 THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ?`
  ).bind(id).run()

  const updated = await c.env.DB.prepare(
    'SELECT * FROM services WHERE id = ?'
  ).bind(id).first()

  return c.json(updated)
})

services.patch('/:id/status', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ status: string }>()

  if (!['pending', 'in_progress', 'completed'].includes(body.status)) {
    return c.json({ error: 'Status inválido' }, 400)
  }

  await c.env.DB.prepare(
    `UPDATE services SET status = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(body.status, id).run()

  const updated = await c.env.DB.prepare(
    'SELECT * FROM services WHERE id = ?'
  ).bind(id).first()

  return c.json(updated)
})

export { services as serviceRoutes }
