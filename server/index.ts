import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'
import { authRoutes } from './routes/auth'
import { serviceRoutes } from './routes/services'
import { shoppingRoutes } from './routes/shopping'
import { dashboardRoutes } from './routes/dashboard'
import { mudancaRoutes } from './routes/mudancas'
import { providerRoutes } from './routes/providers'
import type { Bindings, Variables } from './types'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().basePath('/api')

app.use('*', cors())

// Public routes
app.route('/auth', authRoutes)

// Protected routes - JWT middleware
app.use('/services/*', (c, next) => jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' })(c, next))
app.use('/shopping/*', (c, next) => jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' })(c, next))
app.use('/dashboard/*', (c, next) => jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' })(c, next))
app.use('/mudancas/*', (c, next) => jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' })(c, next))
app.use('/providers/*', (c, next) => jwt({ secret: c.env.JWT_SECRET, alg: 'HS256' })(c, next))

app.route('/services', serviceRoutes)
app.route('/shopping', shoppingRoutes)
app.route('/dashboard', dashboardRoutes)
app.route('/mudancas', mudancaRoutes)
app.route('/providers', providerRoutes)

export default app
