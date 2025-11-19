import 'dotenv/config' // Carga variables de entorno al inicio
import express from 'express'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import SQLiteStoreFactory from 'connect-sqlite3'
import helmet from 'helmet'
import path from 'node:path'

// Configuración local
import { PORT, SECRET_JWT_KEY, NODE_ENV } from './config.js'

// Importar Rutas
import adminRoutes from './src/routes/admin.js'
import authRoutes from './src/routes/auth.js'

const app = express()
const SQLiteStore = SQLiteStoreFactory(session)

// 1. Seguridad y Configuración Básica
app.use(helmet()) // Protege cabeceras HTTP automáticamente
app.set('view engine', 'ejs')

// Permitir que bootstrap y estilos carguen (Helmet a veces bloquea CDNs externos)
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
    },
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static('public'))

// 2. Configuración de Sesión (EL HOTFIX: Archivo separado)
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',     // Nombre distinto al de usuarios
    dir: './data',         // Guardado en la carpeta data
    table: 'sessions',
    concurrentDB: true
  }),
  secret: SECRET_JWT_KEY,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 día
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'strict'
  }
}))

// 3. Rutas
app.use('/admin', adminRoutes)
app.use('/', authRoutes)

// 4. Manejo de Errores Global
app.use((err, req, res, next) => {
  console.error(err.stack)
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).render('acceso-denegado', { csrfToken: req.csrfToken ? req.csrfToken() : null })
  }
  res.status(500).send('Error interno del servidor')
})

// 5. Iniciar
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})

export default app