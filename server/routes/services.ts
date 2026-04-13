import { Hono } from 'hono'
import type { Bindings, Variables } from '../types'

const services = new Hono<{ Bindings: Bindings; Variables: Variables }>()

function readMudancaId(raw: string | undefined): number | null {
  if (!raw) return null
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

async function ensureProviderId(
  c: { env: { DB: D1Database } },
  mudancaId: number,
  providerId: number | null | undefined,
  providerName: string | undefined,
  currentProviderId: number | null
) {
  if (providerId === undefined && providerName === undefined) return currentProviderId

  if (providerId !== undefined) {
    if (providerId === null) return null

    const existing = await c.env.DB.prepare(
      `SELECT id FROM providers WHERE id = ? AND mudanca_id = ?`
    ).bind(providerId, mudancaId).first()

    if (!existing) {
      throw new Error('INVALID_PROVIDER_ID')
    }
    return providerId
  }

  const name = (providerName || '').trim()
  if (!name) return null

  try {
    const result = await c.env.DB.prepare(
      `INSERT INTO providers (mudanca_id, name) VALUES (?, ?)`
    ).bind(mudancaId, name).run()
    return Number(result.meta.last_row_id)
  } catch {
    const existing = await c.env.DB.prepare(
      `SELECT id FROM providers WHERE mudanca_id = ? AND name = ?`
    ).bind(mudancaId, name).first() as Record<string, unknown> | null
    return existing ? Number(existing.id) : null
  }
}

services.get('/summary', async (c) => {
  const mudancaId = c.req.query('mudanca_id')
  if (!mudancaId) {
    return c.json({ error: 'mudanca_id é obrigatório' }, 400)
  }

  const result = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as total_services,
      SUM(CASE WHEN selected = 1 THEN 1 ELSE 0 END) as selected_services,
      SUM(CASE WHEN selected = 1 THEN service_cost ELSE 0 END) as total_cost_selected,
      SUM(service_cost) as total_cost_all,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count
    FROM services
    WHERE mudanca_id = ?
  `).bind(mudancaId).first()

  return c.json(result)
})

services.get('/', async (c) => {
  const mudancaId = c.req.query('mudanca_id')
  if (!mudancaId) {
    return c.json({ error: 'mudanca_id é obrigatório' }, 400)
  }

  const { results } = await c.env.DB.prepare(
    'SELECT * FROM services WHERE mudanca_id = ? ORDER BY id ASC'
  ).bind(mudancaId).all()
  return c.json(results)
})

services.get('/providers', async (c) => {
  // Legacy endpoint kept for UI autocomplete compatibility.
  // Now returns provider names from providers table.
  const mudancaId = c.req.query('mudanca_id')
  if (mudancaId) {
    const { results } = await c.env.DB.prepare(
      `SELECT name FROM providers WHERE mudanca_id = ? ORDER BY name ASC`
    ).bind(mudancaId).all()
    return c.json(results.map((r: Record<string, unknown>) => r.name as string))
  }

  const { results } = await c.env.DB.prepare(
    `SELECT DISTINCT name FROM providers ORDER BY name ASC`
  ).all()
  return c.json(results.map((r: Record<string, unknown>) => r.name as string))
})

services.get('/:id', async (c) => {
  const id = c.req.param('id')
  const mudancaId = readMudancaId(c.req.query('mudanca_id'))
  if (!mudancaId) {
    return c.json({ error: 'mudanca_id válido é obrigatório' }, 400)
  }

  const service = await c.env.DB.prepare(
    `SELECT s.*, p.name as provider_name
     FROM services s
     LEFT JOIN providers p ON s.provider_id = p.id
     WHERE s.id = ? AND s.mudanca_id = ?`
  ).bind(id, mudancaId).first()

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
    mudanca_id: number
    name: string
    materials_description?: string
    service_cost?: number
    provider?: string
    provider_id?: number | null
  }>()

  if (!body.name) {
    return c.json({ error: 'Nome é obrigatório' }, 400)
  }

  if (!body.mudanca_id) {
    return c.json({ error: 'mudanca_id é obrigatório' }, 400)
  }

  let providerId: number | null
  try {
    providerId = await ensureProviderId(c, body.mudanca_id, body.provider_id, body.provider, null)
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_PROVIDER_ID') {
      return c.json({ error: 'provider_id inválido para esta mudança' }, 400)
    }
    throw error
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO services (mudanca_id, name, materials_description, service_cost, provider, provider_id)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(
    body.mudanca_id,
    body.name,
    body.materials_description || '',
    body.service_cost || 0,
    body.provider || '',
    providerId
  ).run()

  const service = await c.env.DB.prepare(
    `SELECT s.*, p.name as provider_name
     FROM services s
     LEFT JOIN providers p ON s.provider_id = p.id
     WHERE s.id = ?`
  ).bind(result.meta.last_row_id).first()

  return c.json(service, 201)
})

services.put('/:id', async (c) => {
  const id = c.req.param('id')
  const mudancaId = readMudancaId(c.req.query('mudanca_id'))
  if (!mudancaId) {
    return c.json({ error: 'mudanca_id válido é obrigatório' }, 400)
  }
  const body = await c.req.json<{
    name?: string
    materials_description?: string
    service_cost?: number
    status?: string
    selected?: boolean
    start_date?: string
    end_date?: string
    provider?: string
    provider_id?: number | null
  }>()

  const existing = await c.env.DB.prepare(
    'SELECT * FROM services WHERE id = ? AND mudanca_id = ?'
  ).bind(id, mudancaId).first()

  if (!existing) {
    return c.json({ error: 'Serviço não encontrado' }, 404)
  }

  const ex = existing as Record<string, unknown>
  const serviceMudancaId = Number(ex.mudanca_id)
  const currentProviderId = ex.provider_id !== null ? Number(ex.provider_id) : null

  let providerId: number | null
  try {
    providerId = await ensureProviderId(c, serviceMudancaId, body.provider_id, body.provider, currentProviderId)
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_PROVIDER_ID') {
      return c.json({ error: 'provider_id inválido para esta mudança' }, 400)
    }
    throw error
  }

  await c.env.DB.prepare(
    `UPDATE services SET
      name = ?,
      materials_description = ?,
      service_cost = ?,
      status = ?,
      selected = ?,
      start_date = ?,
      end_date = ?,
      provider = ?,
      provider_id = ?,
      updated_at = datetime('now')
    WHERE id = ? AND mudanca_id = ?`
  ).bind(
    body.name ?? ex.name,
    body.materials_description ?? ex.materials_description,
    body.service_cost ?? ex.service_cost,
    body.status ?? ex.status,
    body.selected !== undefined ? (body.selected ? 1 : 0) : ex.selected,
    body.start_date !== undefined ? body.start_date : ex.start_date,
    body.end_date !== undefined ? body.end_date : ex.end_date,
    body.provider ?? ex.provider,
    providerId,
    id,
    mudancaId
  ).run()

  const updated = await c.env.DB.prepare(
    `SELECT s.*, p.name as provider_name
     FROM services s
     LEFT JOIN providers p ON s.provider_id = p.id
     WHERE s.id = ? AND s.mudanca_id = ?`
  ).bind(id, mudancaId).first()

  return c.json(updated)
})

services.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const mudancaId = readMudancaId(c.req.query('mudanca_id'))
  if (!mudancaId) {
    return c.json({ error: 'mudanca_id válido é obrigatório' }, 400)
  }

  const existing = await c.env.DB.prepare(
    'SELECT id FROM services WHERE id = ? AND mudanca_id = ?'
  ).bind(id, mudancaId).first()

  if (!existing) {
    return c.json({ error: 'Serviço não encontrado' }, 404)
  }

  await c.env.DB.prepare('DELETE FROM services WHERE id = ? AND mudanca_id = ?').bind(id, mudancaId).run()
  return c.json({ success: true })
})

services.patch('/:id/toggle', async (c) => {
  const id = c.req.param('id')
  const mudancaId = readMudancaId(c.req.query('mudanca_id'))
  if (!mudancaId) {
    return c.json({ error: 'mudanca_id válido é obrigatório' }, 400)
  }

  const existing = await c.env.DB.prepare(
    'SELECT id FROM services WHERE id = ? AND mudanca_id = ?'
  ).bind(id, mudancaId).first()

  if (!existing) {
    return c.json({ error: 'Serviço não encontrado' }, 404)
  }

  await c.env.DB.prepare(
    `UPDATE services SET selected = CASE WHEN selected = 1 THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ? AND mudanca_id = ?`
  ).bind(id, mudancaId).run()

  const updated = await c.env.DB.prepare(
    'SELECT * FROM services WHERE id = ? AND mudanca_id = ?'
  ).bind(id, mudancaId).first()

  return c.json(updated)
})

services.patch('/:id/status', async (c) => {
  const id = c.req.param('id')
  const mudancaId = readMudancaId(c.req.query('mudanca_id'))
  if (!mudancaId) {
    return c.json({ error: 'mudanca_id válido é obrigatório' }, 400)
  }
  const body = await c.req.json<{ status: string; start_date?: string; end_date?: string }>()

  if (!['pending', 'in_progress', 'completed'].includes(body.status)) {
    return c.json({ error: 'Status inválido' }, 400)
  }

  const existing = await c.env.DB.prepare(
    'SELECT * FROM services WHERE id = ? AND mudanca_id = ?'
  ).bind(id, mudancaId).first()

  if (!existing) {
    return c.json({ error: 'Serviço não encontrado' }, 404)
  }

  const ex = existing as Record<string, unknown>

  await c.env.DB.prepare(
    `UPDATE services SET status = ?, start_date = ?, end_date = ?, updated_at = datetime('now') WHERE id = ? AND mudanca_id = ?`
  ).bind(
    body.status,
    body.start_date !== undefined ? body.start_date : ex.start_date,
    body.end_date !== undefined ? body.end_date : ex.end_date,
    id,
    mudancaId
  ).run()

  const updated = await c.env.DB.prepare(
    'SELECT * FROM services WHERE id = ? AND mudanca_id = ?'
  ).bind(id, mudancaId).first()

  return c.json(updated)
})

export { services as serviceRoutes }
