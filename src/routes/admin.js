import { Router } from 'express'
import { body, param, validationResult } from 'express-validator'
import * as adminController from '../controllers/adminController.js'
import { authenticate, authorize, csrfProtection } from '../middlewares/security.js'

const router = Router()

// --- Seguridad Global del Router de Admin ---
// Todas las rutas aquí requieren estar logueado, ser admin y tener token CSRF válido.
router.use(authenticate)
router.use(authorize(['admin']))
router.use(csrfProtection)

// Helper de validación local
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(val => val.run(req)))
    const errors = validationResult(req)
    if (errors.isEmpty()) return next()
    res.status(400).json({ errors: errors.array() })
  }
}

// 1. Panel Principal (Vista)
router.get('/users', adminController.renderAdminPanel)

// 2. Actualizar Rol (API)
router.post(
  '/users/:id/role',
  validate([
    param('id').isUUID().withMessage('ID de usuario inválido'), // Evita inyección SQL en el ID
    body('role').isIn(['user', 'admin']).withMessage('Rol no permitido')
  ]),
  adminController.updateUserRole
)

// 3. Eliminar Usuario (API)
router.delete(
  '/users/:id',
  validate([
    param('id').isUUID().withMessage('ID de usuario inválido')
  ]),
  adminController.deleteUser
)

export default router