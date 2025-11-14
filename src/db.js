// src/db.js
import Database from 'better-sqlite3'

// Tu .gitignore ya está configurado para ignorar archivos *.db
// Esta línea crea o abre el archivo de base de datos en la raíz del proyecto.
const db = new Database('main.db', { verbose: console.log })

// PRAGMAS recomendados para WAL (Write-Ahead Logging)
// Mejora la concurrencia (múltiples lecturas y una escritura al mismo tiempo).
db.pragma('journal_mode = WAL');

// (Req: RBAC) Creamos la tabla de usuarios.
// Usamos el esquema de 'ortiz-ivan' que incluye email.
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
  )
`)

// (Req: Sesión Persistente) Creamos la tabla para las sesiones.
// Esta tabla es la que usará 'connect-sqlite3' para guardar las sesiones.
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    expired INTEGER NOT NULL,
    sess TEXT NOT NULL
  )
`);

console.log('Base de datos y tablas inicializadas.');

export default db