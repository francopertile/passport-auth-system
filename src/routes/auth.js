import { Router } from 'express'
import { body, validationResult } from 'express-validator'
import * as authController from '../controllers/authController.js'
import {
  loginRateLimiter,
  authenticate,
  authorize,
  csrfProtection
} from '../middlewares/security.js'

const router = Router()

// Middleware helper para manejar errores de validación
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)))

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }
    // Si hay errores, devolvemos 400 Bad Request con los detalles
    res.status(400).json({ errors: errors.array() })
  }
}

// --- Vistas (Frontend Renderizado) ---
// Estas rutas sirven el HTML inicial
router.get('/', authenticate, csrfProtection, authController.renderIndex)
router.get('/protected', authenticate, csrfProtection, authorize(['admin']), authController.renderProtected)

// --- API Endpoints (JSON) ---

// 1. Registro
router.post(
  '/register',
  loginRateLimiter, // Protección contra fuerza bruta
  csrfProtection,   // Token anti-falsificación
  validate([
    body('username')
      .trim()
      .notEmpty().withMessage('El usuario es requerido')
      .escape(), // (Req: XSS) Sanitización básica
    body('email')
      .isEmail().withMessage('Debe ser un email válido')
      .normalizeEmail(), // Saneamiento (ej: quita puntos innecesarios en gmail)
    body('password')
      .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
  ]),
  authController.register
)

// 2. Login Unificado (Reemplaza a login-cookie y login-jwt)
router.post(
  '/login',
  loginRateLimiter,
  csrfProtection,
  validate([
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('Contraseña requerida'),
    body('authMode').isIn(['cookie', 'jwt']).withMessage('Modo de autenticación inválido')
  ]),
  authController.login
)

// 3. Logout
router.post('/logout', csrfProtection, authController.logout)

// 4. Refresh Token (Solo para JWT)
router.post('/refresh', csrfProtection, authController.refreshToken)

export default router