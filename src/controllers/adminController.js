import { UserRepository } from '../models/user-repository.js'

export const renderAdminPanel = async (req, res) => {
  try {
    const users = await UserRepository.listAll()
    res.render('admin-users', {
      users,
      csrfToken: req.csrfToken ? req.csrfToken() : null
    })
  } catch (err) {
    res.status(500).send('Error cargando usuarios')
  }
}

export const updateUserRole = async (req, res) => {
  const { id } = req.params
  const { role } = req.body
  try {
    await UserRepository.updateRole(id, role)
    res.json({ message: 'Rol actualizado correctamente' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const deleteUser = async (req, res) => {
  const { id } = req.params
  
  // Validación de seguridad: No auto-eliminarse
  // Nota: req.session.user existe gracias al middleware 'authenticate' que usaremos en las rutas
  // o si es JWT, vendrá de la validación del token.
  const currentUser = req.session?.user || req.user
  
  if (currentUser && currentUser.id === id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta de administrador' })
  }

  try {
    await UserRepository.delete(id)
    res.json({ message: 'Usuario eliminado correctamente' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}