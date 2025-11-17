// src/routes/auth.js
import express from 'express'
import { UserRepository } from '../models/user-repository.js'
import {
  authenticate,
  authorize,
  loginRateLimiter,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  csrfProtection // <--- AÑADIDO
} from '../middlewares/security.js'
import { NODE_ENV } from '../../config.js'

const router = express.Router()

// --- Configuración de Cookies Seguras ---
// Opciones base para todas las cookies que emitamos
const cookieOptions = {
  httpOnly: true, // (Req: Cookies Seguras)
  secure: NODE_ENV === 'production', // (Req: Cookies Seguras)
  sameSite: 'strict', // (Req: Cookies Seguras)
}

// --- Rutas de Vistas ---

// (Req: Sesión vs JWT)
// GET /: Página principal.
// Usa 'authenticate' PRIMERO, y 'csrfProtection' DESPUÉS.
router.get('/', authenticate, csrfProtection, (req, res) => { // <--- AÑADIDO
  const user = req.session.user || null
  res.render('index', {
    username: user?.username || null,
    role: user?.role || null,
    csrfToken: req.csrfToken() // (Req: CSRF) Pasa el token a la vista
  })
})

// (Req: RBAC)
// GET /protected: Página protegida solo para admins.
router.get('/protected', authenticate, csrfProtection, authorize(['admin']), (req, res) => { // <--- AÑADIDO
  res.render('protected', {
    user: req.session.user,
    csrfToken: req.csrfToken()
  })
})

// --- Rutas de API de Autenticación ---

// (Req: Registro, Fuerza Bruta)
// POST /register: Creación de un nuevo usuario.
router.post('/register', loginRateLimiter, csrfProtection, async (req, res) => { // <--- AÑADIDO
  const { username, email, password } = req.body
  try {
    // (Req: Hashing) El hash se hace dentro de 'create'
    const id = await UserRepository.create({ username, email, password })
    res.status(201).send({ id })
  } catch (err) {
    res.status(400).send(err.message)
  }
})

// (Req: Sesión Persistente, Fuerza Bruta)
// POST /login-cookie: Flujo de inicio de sesión "tradicional".
router.post('/login-cookie', loginRateLimiter, csrfProtection, async (req, res) => { // <--- AÑADIDO
  const { email, password } = req.body
  try {
    // (Req: Hashing) La comparación se hace dentro de 'login'
    const user = await UserRepository.login({ email, password })

    // Guardamos al usuario en la sesión de express-session
    req.session.user = { id: user.id, username: user.username, email: user.email, role: user.role }

    // (Req: JWT) Generamos ambos tokens
    const accessToken = generateAccessToken(req.session.user)
    const refreshToken = generateRefreshToken(req.session.user)

    // (Req: Cookies Seguras) Emitimos los tokens como cookies httpOnly
    res
      .cookie('access_token', accessToken, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 15 // 15 minutos
      })
      .cookie('refresh_token', refreshToken, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 días
      })
      .send({ user, mode: 'cookie-session' })
  } catch (err) {
    res.status(401).send(err.message)
  }
})

// (Req: Sesión JWT, Fuerza Bruta)
// POST /login-jwt: Flujo "Stateless" para clientes que no usan cookies (ej. App móvil).
// (Omitimos CSRF aquí intencionalmente)
router.post('/login-jwt', loginRateLimiter, async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await UserRepository.login({ email, password })

    // (Req: JWT) Generamos ambos tokens
    const accessToken = generateAccessToken({ id: user.id, username: user.username, email: user.email, role: user.role })
    const refreshToken = generateRefreshToken({ id: user.id, username: user.username, email: user.email, role: user.role })

    // (Req: JWT) Devolvemos los tokens en el JSON, el cliente los guarda.
    res.send({
      user,
      mode: 'jwt-stateless',
      accessToken,
      refreshToken
    })
  } catch (err) {
    res.status(401).send(err.message)
  }
})

// (Req: Eliminar Sesión)
// POST /logout: Cierra la sesión del usuario.
router.post('/logout', csrfProtection, (req, res) => { // <--- AÑADIDO
  // Destruye la sesión de express-session
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Error al cerrar sesión')
    }
    // (Req: Eliminar Sesión) Limpiamos las cookies de tokens
    res.clearCookie('access_token')
    res.clearCookie('refresh_token')
    res.send({ message: 'Sesión cerrada' })
  })
})

// (Req: JWT)
// POST /refresh: Permite al cliente obtener un nuevo access_token
router.post('/refresh', csrfProtection, (req, res) => { // <--- AÑADIDO
  const refreshToken = req.cookies.refresh_token
  if (!refreshToken) return res.status(401).send('No hay refresh token')

  try {
    const userData = verifyRefreshToken(refreshToken)
    const newAccessToken = generateAccessToken(userData)

    // (Req: Cookies Seguras) Re-emitimos el access token
    res
      .cookie('access_token', newAccessToken, {
        ...cookieOptions,
        maxAge: 1000 * 60 * 15 // 15 minutos
      })
      .send({ message: 'Token renovado' })
  } catch (err) {
    // Si el refresh token es inválido o expiró, forzamos logout
    res.clearCookie('access_token')
    res.clearCookie('refresh_token')
    res.status(403).send('Refresh token inválido o expirado')
  }
})

export default router