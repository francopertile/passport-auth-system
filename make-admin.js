/*
 * make-admin.js
 * Script de utilidad para promover un usuario a 'admin'.
 * * Uso (en otra PC con Node.js):
 * npm run make-admin -- tu-email@ejemplo.com
 */

import { UserRepository } from './src/models/user-repository.js'
import db from './src/db.js'

async function makeAdmin (email) {
  if (!email) {
    console.error('Error: Debes proporcionar un email.')
    console.log('Uso: npm run make-admin -- <email-del-usuario>')
    process.exit(1)
  }

  try {
    console.log(`Buscando usuario con email: ${email}...`)
    
    // Usamos una consulta directa de 'better-sqlite3' para encontrar al usuario
    const user = db.prepare('SELECT id, username, role FROM users WHERE email = ?').get(email)

    if (!user) {
      console.error(`Error: Usuario con email "${email}" no encontrado.`)
      process.exit(1)
    }

    if (user.role === 'admin') {
      console.log(`El usuario "${user.username}" (${email}) ya es un administrador.`)
      process.exit(0)
    }

    // Actualizar rol a 'admin'
    await UserRepository.updateRole(user.id, 'admin')
    console.log(`✅ ¡Éxito! El usuario "${user.username}" (${email}) ahora es administrador.`)
  } catch (err) {
    console.error('Error al ejecutar el script:', err.message)
  }
}

// Obtenemos el email del argumento de la línea de comandos
// process.argv[2] será el primer argumento después de 'node make-admin.js'
const emailToPromote = process.argv[2]
makeAdmin(emailToPromote)