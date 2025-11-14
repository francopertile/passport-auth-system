// src/middlewares/security.js
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import csrf from 'csurf'
import { SECRET_JWT_KEY, REFRESH_SECRET, NODE_ENV } from '../../config.js'

/**
 * (Req: Prevención Fuerza Bruta)
 * Limita los intentos de login a 5 por minuto por IP.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 5, // 5 intentos
  message: 'Demasiados intentos de login. Intenta más tarde.',
  standardHeaders: true, // Devuelve info de rate limit en headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita headers `X-RateLimit-*`
})

/**
 * (Req: CSRF)
 * Configuración de csurf para usar cookies.
 */
export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: NODE_ENV === 'production', // (Req: Cookies Seguras)
    sameSite: 'strict', // (Req: Cookies Seguras)
  },
})

/**
 * (Req: JWT)
 * Genera un Access Token de corta duración (15 min).
 */
export function generateAccessToken (user) {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role
  }
  return jwt.sign(payload, SECRET_JWT_KEY, { expiresIn: '15m' })
}

/**
 * (Req: JWT)
 * Genera un Refresh Token de larga duración (7 días).
 */
export function generateRefreshToken (user) {
  const payload = {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role
  }
  // Usa un secreto diferente para el refresh token
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' })
}

/**
 * (Req: JWT)
 * Verifica el Access Token.
 */
export function verifyAccessToken (token) {
  return jwt.verify(token, SECRET_JWT_KEY)
}

/**
 * (Req: JWT)
 * Verifica el Refresh Token.
 */
export function verifyRefreshToken (token) {
  return jwt.verify(token, REFRESH_SECRET)
}

/**
 * (Req: Sesión vs JWT - Fusión)
 * Middleware de autenticación principal.
 * Lee el JWT desde la cookie 'access_token', lo verifica,
 * y carga los datos del usuario en 'req.session.user'.
 * Se ejecuta en CADA petición que necesite saber si hay un usuario logueado.
 */
export function authenticate (req, res, next) {
  const token = req.cookies?.access_token

  if (!req.session) req.session = {}

  if (!token) {
    // No hay token, nos aseguramos que no haya sesión de usuario
    req.session.user = null
    return next()
  }

  try {
    const data = verifyAccessToken(token)
    // Token válido: poblamos la sesión con los datos del token.
    // Ahora 'req.session.user' existe para las vistas EJS y otros middlewares.
    req.session.user = data
  } catch (err) {
    // Token inválido (expirado, malformado, etc.)
    req.session.user = null
  }

  next()
}

/**
 * (Req: RBAC)
 * Middleware de autorización basado en roles.
 * Verifica si el 'req.session.user' (poblado por 'authenticate')
 * tiene uno de los roles permitidos.
 */
export function authorize (allowedRoles = []) {
  return (req, res, next) => {
    const user = req.session?.user
    const allowed = allowedRoles.map(r => r.toLowerCase())

    if (!user || !allowed.includes((user.role || '').toLowerCase())) {
      // Usuario no logueado o no tiene el rol
      const csrfToken = (typeof req.csrfToken === 'function') ? req.csrfToken() : null
      // (Req: XSS) El escape de HTML se hará en la vista 'acceso-denegado.ejs'
      return res.status(403).render('acceso-denegado', { csrfToken })
    }

    // Usuario autorizado, continuar.
    next()
  }
}