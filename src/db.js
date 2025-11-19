import Database from 'better-sqlite3'
import path from 'node:path'

// Apuntamos a la carpeta 'data' para mantener el orden
const dbPath = path.join(process.cwd(), 'data', 'users.db')

const db = new Database(dbPath, { verbose: console.log })

// Mejor rendimiento
db.pragma('journal_mode = WAL')

// Crear tabla de usuarios (Solo usuarios, nada de sesiones aquí)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
  )
`)

console.log(`[DB] Base de datos de usuarios conectada en: ${dbPath}`)

export default db