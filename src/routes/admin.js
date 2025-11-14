// src/routes/admin.js
import express from 'express'
import { UserRepository } from '../models/user-repository.js'
import { authenticate, authorize } from '../middlewares/security.js'

const router = express.Router()

// (Req: RBAC)
// Aplicamos middlewares a TODAS las rutas en este archivo.
// 1. 'authenticate': Asegura que el usuario esté logueado (cookie JWT válida).
// 2. 'authorize(['admin'])': Asegura que el rol del usuario sea 'admin'.
router.use(authenticate)
router.use(authorize(['admin']))

// (Req: RBAC)
// GET /admin/users: Muestra el panel de administración de usuarios.
router.get('/users', async (req, res) => {
  try {
    const users = await UserRepository.listAll()
    // (Req: CSRF) Pasamos el token a la vista para las acciones (delete/update).
    res.render('admin-users', {
      users,
      csrfToken: req.csrfToken()
    })
  } catch (err) {
    res.status(500).send(err.message)
  }
})

// (Req: RBAC)
// POST /admin/users/:id/role: Actualiza el rol de un usuario.
router.post('/users/:id/role', async (req, res) => {
  const { id } = req.params
  const { role } = req.body
  try {
    await UserRepository.updateRole(id, role)
    // Usamos 'res.json' para que el frontend (JS) reciba una confirmación
    res.json({ message: 'Rol actualizado' })
  } catch (err) {
    res.status(400).send(err.message)
  }
})

// (Req: RBAC)
// DELETE /admin/users/:id: Elimina un usuario.
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params
  try {
    // No permitimos que un admin se elimine a sí mismo
    if (id === req.session.user.id) {
      return res.status(400).send('No puedes eliminarte a ti mismo.')
    }
    await UserRepository.delete(id)
    res.json({ message: 'Usuario eliminado' })
  } catch (err) {
    res.status(400).send(err.message)
  }
})

export default router