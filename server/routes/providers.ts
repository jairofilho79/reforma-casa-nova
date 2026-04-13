import { Hono } from 'hono'
import type { Bindings, Variables } from '../types'

const providers = new Hono<{ Bindings: Bindings; Variables: Variables }>()

function isValidDateYYYYMMDD(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function normalizePhoneBR(value: string) {
  const digits = value.replace(/\D/g, '')
  return digits
}

providers.get('/', async (c) => {
  const mudancaId = c.req.query('mudanca_id')
  if (!mudancaId) return c.json({ error: 'mudanca_id é obrigatório' }, 400)

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM providers WHERE mudanca_id = ? ORDER BY name ASC`
  ).bind(mudancaId).all()

  return c.json(results)
})

providers.post('/', async (c) => {
  const body = await c.req.json<{
    mudanca_id: number
    name: string
    phone?: string
    notes?: string
  }>()

  if (!body.mudanca_id) return c.json({ error: 'mudanca_id é obrigatório' }, 400)
  if (!body.name || !body.name.trim()) return c.json({ error: 'Nome é obrigatório' }, 400)

  const phone = normalizePhoneBR(body.phone || '')
  if (phone && (phone.length < 10 || phone.length > 11)) {
    return c.json({ error: 'Telefone inválido (pt-BR)' }, 400)
  }

  const name = body.name.trim()

  try {
    const result = await c.env.DB.prepare(
      `INSERT INTO providers (mudanca_id, name, phone, notes)
       VALUES (?, ?, ?, ?)`
    ).bind(body.mudanca_id, name, phone, body.notes || '').run()

    const created = await c.env.DB.prepare(
      `SELECT * FROM providers WHERE id = ?`
    ).bind(result.meta.last_row_id).first()

    return c.json(created, 201)
  } catch {
    const existing = await c.env.DB.prepare(
      `SELECT * FROM providers WHERE mudanca_id = ? AND name = ?`
    ).bind(body.mudanca_id, name).first()

    if (existing) return c.json(existing, 200)
    return c.json({ error: 'Erro ao criar prestador' }, 500)
  }
})

providers.get('/:id', async (c) => {
  const id = c.req.param('id')

  const provider = await c.env.DB.prepare(
    `SELECT * FROM providers WHERE id = ?`
  ).bind(id).first()

  if (!provider) return c.json({ error: 'Prestador não encontrado' }, 404)

  const p = provider as Record<string, unknown>
  const mudancaId = p.mudanca_id as number

  const { results: services } = await c.env.DB.prepare(
    `SELECT id, name, status, service_cost, start_date, end_date
     FROM services
     WHERE mudanca_id = ? AND provider_id = ?
     ORDER BY id ASC`
  ).bind(mudancaId, id).all()

  const { results: payments } = await c.env.DB.prepare(
    `SELECT * FROM provider_payments
     WHERE mudanca_id = ? AND provider_id = ?
     ORDER BY payment_date ASC, id ASC`
  ).bind(mudancaId, id).all()

  const totalCombined = (services as Array<Record<string, unknown>>).reduce((sum, s) => {
    return sum + (Number(s.service_cost) || 0)
  }, 0)

  const totalPaid = (payments as Array<Record<string, unknown>>).reduce((sum, pay) => {
    return sum + (Number(pay.amount) || 0)
  }, 0)

  // Allocation algorithm: payments (saldo geral) abatem serviços em ordem.
  let remaining = totalPaid
  const servicesWithPayment = (services as Array<Record<string, unknown>>).map((s) => {
    const cost = Number(s.service_cost) || 0
    const allocated = Math.max(0, Math.min(remaining, cost))
    remaining = Math.max(0, remaining - allocated)
    const pending = Math.max(0, cost - allocated)
    return { ...s, paid_amount: allocated, pending_amount: pending }
  })

  const totalPending = Math.max(0, totalCombined - totalPaid)

  return c.json({
    provider,
    services: servicesWithPayment,
    payments,
    totals: {
      total_combined: totalCombined,
      total_paid: totalPaid,
      total_pending: totalPending,
    },
  })
})

providers.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ name?: string; phone?: string; notes?: string }>()

  const existing = await c.env.DB.prepare(
    `SELECT * FROM providers WHERE id = ?`
  ).bind(id).first()

  if (!existing) return c.json({ error: 'Prestador não encontrado' }, 404)
  const ex = existing as Record<string, unknown>

  const nextName = body.name !== undefined ? body.name.trim() : (ex.name as string)
  if (!nextName) return c.json({ error: 'Nome é obrigatório' }, 400)

  const nextPhone = body.phone !== undefined ? normalizePhoneBR(body.phone) : (ex.phone as string)
  if (nextPhone && (nextPhone.length < 10 || nextPhone.length > 11)) {
    return c.json({ error: 'Telefone inválido (pt-BR)' }, 400)
  }

  await c.env.DB.prepare(
    `UPDATE providers SET
      name = ?,
      phone = ?,
      notes = ?,
      updated_at = datetime('now')
     WHERE id = ?`
  ).bind(
    nextName,
    nextPhone || '',
    body.notes !== undefined ? body.notes : (ex.notes as string),
    id
  ).run()

  const updated = await c.env.DB.prepare(
    `SELECT * FROM providers WHERE id = ?`
  ).bind(id).first()

  return c.json(updated)
})

providers.delete('/:id', async (c) => {
  const id = c.req.param('id')

  const existing = await c.env.DB.prepare(
    `SELECT * FROM providers WHERE id = ?`
  ).bind(id).first()
  if (!existing) return c.json({ error: 'Prestador não encontrado' }, 404)

  const { results: linked } = await c.env.DB.prepare(
    `SELECT id FROM services WHERE provider_id = ? LIMIT 1`
  ).bind(id).all()

  if (linked.length > 0) {
    return c.json({ error: 'Não é possível excluir: há serviços vinculados' }, 400)
  }

  await c.env.DB.prepare(`DELETE FROM providers WHERE id = ?`).bind(id).run()
  return c.json({ success: true })
})

providers.post('/:id/payments', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ payment_date: string; amount: number; notes?: string }>()

  const provider = await c.env.DB.prepare(
    `SELECT * FROM providers WHERE id = ?`
  ).bind(id).first()

  if (!provider) return c.json({ error: 'Prestador não encontrado' }, 404)
  const p = provider as Record<string, unknown>

  if (!body.payment_date || !isValidDateYYYYMMDD(body.payment_date)) {
    return c.json({ error: 'Data do pagamento inválida' }, 400)
  }
  const amount = Number(body.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return c.json({ error: 'Valor pago inválido' }, 400)
  }

  const mudancaId = p.mudanca_id as number

  const result = await c.env.DB.prepare(
    `INSERT INTO provider_payments (mudanca_id, provider_id, payment_date, amount, notes)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(mudancaId, id, body.payment_date, amount, body.notes || '').run()

  const created = await c.env.DB.prepare(
    `SELECT * FROM provider_payments WHERE id = ?`
  ).bind(result.meta.last_row_id).first()

  return c.json(created, 201)
})

export { providers as providerRoutes }
