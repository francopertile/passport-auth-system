import fs from 'node:fs'
import path from 'node:path'
import { UserRepository } from '../src/models/user-repository.js'

// 1. Asegurar que la carpeta 'data' existe
const dataDir = path.join(process.cwd(), 'data')
if (!fs.existsSync(dataDir)) {
  console.log('📁 Creando carpeta data/...')
  fs.mkdirSync(dataDir)
}

// Datos de prueba
const SEED_USERS = [
  { username: 'admin', email: 'admin@test.com', password: 'password123', role: 'admin' },
  { username: 'usuario', email: 'user@test.com', password: 'password123', role: 'user' }
]

async function seed() {
  console.log('🌱 Iniciando sembrado de base de datos...')
  
  for (const user of SEED_USERS) {
    try {
      // Intentamos crear el usuario
      const id = await UserRepository.create(user)
      console.log(`✅ Usuario creado: ${user.username} (${user.role})`)
    } catch (error) {
      // Si el error es que ya existe, lo ignoramos (es normal al correr el seed 2 veces)
      if (error.message === 'Usuario ya existente' || error.message === 'El correo ya está registrado') {
        console.log(`ℹ️  Usuario ya existe: ${user.username} (Saltando)`)
      } else {
        console.error(`❌ Error creando ${user.username}:`, error.message)
      }
    }
  }

  console.log('✨ Sembrado finalizado. ¡Listo para probar!')
}

seed()