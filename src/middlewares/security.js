import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import csrf from 'csurf'
import { SECRET_JWT_KEY, REFRESH_SECRET, NODE_ENV } from '../../config.js'

// --- 1. Rate Limit (Fuerza Bruta) ---
export const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 10, // 10 intentos
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta nuevamente en 5 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
})

// --- 2. CSRF Protection (Double Submit Cookie) ---
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'strict'
  }
})

// --- 3. Utilidades JWT ---
export function generateAccessToken (user) {
  const payload = { id: user.id, username: user.username, role: user.role }
  return jwt.sign(payload, SECRET_JWT_KEY, { expiresIn: '15m' })
}

export function generateRefreshToken (user) {
  const payload = { id: user.id, username: user.username, role: user.role }
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' })
}

export function verifyRefreshToken (token) {
  return jwt.verify(token, REFRESH_SECRET)
}

// --- 4. Middleware de Autenticación Unificado ---
export function authenticate (req, res, next) {
  req.user = null // Limpiamos por seguridad

  // Estrategia A: Sesión (Cookie)
  if (req.session && req.session.user) {
    req.user = req.session.user
    return next()
  }

  // Estrategia B: JWT (Header Authorization)
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, SECRET_JWT_KEY)
      req.user = decoded
      return next()
    } catch (err) {
      // Token inválido o expirado, continuamos como "no autenticado"
    }
  }

  next()
}

// --- 5. Middleware de Autorización (Roles) ---
export function authorize (allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      // Si espera JSON (API) o HTML (Navegador)
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(401).json({ error: 'No autenticado' })
      }
      return res.status(401).render('acceso-denegado', { csrfToken: null })
    }

    if (!allowedRoles.includes(req.user.role)) {
      if (req.headers.accept && req.headers.accept.includes('application/json')) {
        return res.status(403).json({ error: 'No tienes permisos suficientes' })
      }
      return res.status(403).render('acceso-denegado', { csrfToken: null })
    }

    next()
  }
}