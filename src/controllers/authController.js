import { UserRepository } from '../models/user-repository.js'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../middlewares/security.js'

// Configuración centralizada de cookies para JWT
const jwtCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 1000 * 60 * 60 * 24 * 7 // 7 días
}

export const renderIndex = (req, res) => {
  const user = req.session?.user || null
  res.render('index', {
    username: user?.username || null,
    role: user?.role || null,
    csrfToken: req.csrfToken ? req.csrfToken() : null
  })
}

export const renderProtected = (req, res) => {
  res.render('protected', {
    user: req.session.user,
    csrfToken: req.csrfToken ? req.csrfToken() : null
  })
}

export const register = async (req, res) => {
  const { username, email, password } = req.body
  try {
    const id = await UserRepository.create({ username, email, password })
    res.status(201).json({ id, message: 'Usuario registrado exitosamente' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const login = async (req, res) => {
  const { email, password, authMode } = req.body
  
  try {
    const user = await UserRepository.login({ email, password })
    
    // Opción A: Sesión Persistente (Cookie tradicional)
    if (authMode === 'cookie') {
      // Regenerar sesión por seguridad (evita Session Fixation)
      req.session.regenerate((err) => {
        if (err) return res.status(500).json({ error: 'Error de servidor al crear sesión' })
        
        req.session.user = { id: user.id, username: user.username, email: user.email, role: user.role }
        req.session.save(() => {
          res.json({ message: 'Login exitoso (Session)', user, mode: 'cookie' })
        })
      })
      return
    }

    // Opción B: JWT (Stateless)
    // Generamos tokens
    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user)

    // La cookie de refresh es HttpOnly (Seguridad)
    // El cliente NO puede leer esto con JS, previene robo XSS
    res.cookie('refresh_token', refreshToken, jwtCookieOptions)

    // El Access Token va en el JSON para que el cliente lo use en memoria
    res.json({
      message: 'Login exitoso (JWT)',
      user,
      accessToken, 
      mode: 'jwt'
    })

  } catch (err) {
    res.status(401).json({ error: err.message })
  }
}

export const logout = (req, res) => {
  // Limpiar sesión tradicional
  req.session.destroy((err) => {
    if (err) console.error('Error destruyendo sesión:', err)
    
    // Limpiar cookies de todos los tipos (Session y JWT)
    res.clearCookie('connect.sid') // Nombre por defecto de cookie de sesión
    res.clearCookie('refresh_token') // Nuestra cookie segura JWT
    res.json({ message: 'Sesión cerrada correctamente' })
  })
}

export const refreshToken = (req, res) => {
  const refreshToken = req.cookies.refresh_token
  if (!refreshToken) return res.status(401).json({ error: 'No hay refresh token' })

  try {
    const userData = verifyRefreshToken(refreshToken)
    const newAccessToken = generateAccessToken({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      role: userData.role
    })

    res.json({ accessToken: newAccessToken })
  } catch (err) {
    res.status(403).json({ error: 'Refresh token inválido o expirado' })
  }
}