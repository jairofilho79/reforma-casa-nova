import { Hono } from 'hono'
import type { Bindings, Variables } from '../types'

const dashboard = new Hono<{ Bindings: Bindings; Variables: Variables }>()

dashboard.get('/', async (c) => {
  const [serviceSummary, shoppingSummary] = await Promise.all([
    c.env.DB.prepare(`
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
    `).first(),

    c.env.DB.prepare(`
      SELECT
        COUNT(*) as total_items,
        SUM(CASE WHEN purchased = 1 THEN 1 ELSE 0 END) as purchased_count,
        SUM(estimated_price) as total_estimated,
        SUM(CASE WHEN purchased = 1 AND actual_price IS NOT NULL THEN actual_price ELSE 0 END) as total_actual
      FROM shopping_items
    `).first(),
  ])

  const ss = serviceSummary as Record<string, number>
  const sh = shoppingSummary as Record<string, number>

  const totalBudget = (ss.total_cost_selected || 0) + (sh.total_estimated || 0)
  const totalSpent = sh.total_actual || 0

  return c.json({
    budget: {
      total_service_cost: ss.total_cost_all || 0,
      selected_service_cost: ss.total_cost_selected || 0,
      total_estimated_materials: sh.total_estimated || 0,
      total_actual_materials: sh.total_actual || 0,
      total_budget: totalBudget,
      total_spent: totalSpent,
      remaining: totalBudget - totalSpent,
    },
    progress: {
      total_services: ss.total_services || 0,
      completed: ss.completed_count || 0,
      in_progress: ss.in_progress_count || 0,
      pending: ss.pending_count || 0,
      completion_percentage: ss.total_services
        ? Math.round((ss.completed_count / ss.total_services) * 100)
        : 0,
      total_hours: ss.total_hours || 0,
    },
    shopping: {
      total_items: sh.total_items || 0,
      purchased: sh.purchased_count || 0,
      pending: (sh.total_items || 0) - (sh.purchased_count || 0),
    },
  })
})

export { dashboard as dashboardRoutes }
