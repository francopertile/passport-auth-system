/*
 * app.js
 * Punto de entrada principal del servidor.
 * Configura los middlewares globales y arranca la aplicación.
 */
import express from 'express'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import SQLiteStore from 'connect-sqlite3' // Para sesiones en DB

// Configuración local
import { PORT, SECRET_JWT_KEY, NODE_ENV } from './config.js'
// import db from './src/db.js' // Ya no es necesario aquí

// Middlewares de seguridad
import { csrfProtection } from './src/middlewares/security.js'

// --- Próximos pasos: Importar Rutas ---
// import adminRoutes from './src/routes/admin.js'
import authRoutes from './src/routes/auth.js' // <--- AÑADE ESTA LÍNEA

// Inicialización de la app
const app = express()

// --- 1. Configuración de Vistas y Middlewares Globales ---
app.set('view engine', 'ejs')
app.use(express.json()) // Parsea body de JSON
app.use(express.urlencoded({ extended: false })) // Parsea body de formularios
app.use(cookieParser()) // Parsea cookies
app.use(express.static('public')) // Sirve archivos estáticos (CSS, JS cliente)

// --- 2. Configuración de Sesión (Req: Sesión Persistente) ---
const SQLiteStoreSession = SQLiteStore(session)

app.use(session({
  // (Req: Sesión Persistente) Guarda sesiones en la tabla 'sessions' de 'main.db'
  store: new SQLiteStoreSession({
    db: 'main.db', // Usa la misma DB principal que creamos
    table: 'sessions',
    dir: './',
  }),
  secret: SECRET_JWT_KEY, // Clave para firmar la cookie de sesión
  resave: false, // No volver a guardar si no hay cambios
  saveUninitialized: false, // No crear sesiones vacías
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 día
    httpOnly: true, // (Req: Cookies Seguras)
    secure: NODE_ENV === 'production', // (Req: Cookies Seguras)
    sameSite: 'strict', // (Req: CSRF / Cookies Seguras)
  }
}))

// --- 3. Configuración de Seguridad (Req: CSRF) ---
// ¡Importante! csurf DEBE ir después de session y cookieParser.
app.use(csrfProtection)

// --- 4. Rutas (se implementarán en próximos commits) ---
// app.use('/admin', adminRoutes);
app.use('/', authRoutes); // <--- AÑADE ESTA LÍNEA

// --- 5. Manejador de Errores ---
app.use((err, req, res, next) => {
  console.error(err.stack)

  // (Req: CSRF) Manejo de error específico para tokens CSRF inválidos
  if (err.code === 'EBADCSRFTOKEN') {
    // (Req: XSS) El escape se hará en la vista
    return res.status(403).render('acceso-denegado', { csrfToken: req.csrfToken() })
  }

  res.status(500).send('Algo salió mal en el servidor.')
})

// --- 6. Iniciar Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})

// Exportamos 'app' por si queremos usarla en tests (buena práctica)
export default app