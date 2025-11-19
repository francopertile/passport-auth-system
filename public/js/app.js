/**
 * Jimeván Client - Lógica de Frontend
 * Maneja la autenticación híbrida (Cookie/JWT) y el ciclo de vida de los tokens.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Estado global (en memoria, como le gusta a Jimena para seguridad)
  let state = {
    accessToken: null,
    user: null
  }

  // Obtener CSRF Token inyectado en la vista
  const csrfToken = window.csrfToken || ''

  // --- UI Elements ---
  const loginForm = document.getElementById('loginForm')
  const registerForm = document.getElementById('registerForm')
  const logoutBtn = document.getElementById('logoutBtn')
  const messageDiv = document.getElementById('message')
  const protectedBtn = document.getElementById('protectedBtn')
  const adminBtn = document.getElementById('adminBtn')

  // --- 1. Cliente HTTP Robusto (Interceptor) ---
  async function apiRequest(url, options = {}) {
    // Configurar headers por defecto
    const headers = {
      'Content-Type': 'application/json',
      'CSRF-Token': csrfToken, // Siempre enviamos CSRF por seguridad
      ...options.headers
    }

    // Si tenemos token en memoria, lo inyectamos (Modo JWT)
    if (state.accessToken) {
      headers['Authorization'] = `Bearer ${state.accessToken}`
    }

    const config = {
      ...options,
      headers
    }

    let response = await fetch(url, config)

    // Manejo de Auto-Refresh (Solo para JWT)
    // Si recibimos 401 (Unauthorized) y tenemos un token, intentamos refrescarlo
    if (response.status === 401 && state.accessToken) {
      console.log('[Client] Token expirado. Intentando refresh...')
      
      try {
        // Llamamos al endpoint de refresh (el navegador envía la cookie httpOnly automáticamente)
        const refreshRes = await fetch('/refresh', { 
          method: 'POST',
          headers: { 'CSRF-Token': csrfToken } 
        })

        if (refreshRes.ok) {
          const data = await refreshRes.json()
          state.accessToken = data.accessToken // Guardamos el nuevo token
          console.log('[Client] Token refrescado con éxito. Reintentando petición...')
          
          // Actualizamos el header con el nuevo token y reintentamos la petición original
          config.headers['Authorization'] = `Bearer ${state.accessToken}`
          response = await fetch(url, config)
        } else {
          console.warn('[Client] Falló el refresh. Cerrando sesión local.')
          doClientLogout()
        }
      } catch (err) {
        console.error('[Client] Error en refresh:', err)
        doClientLogout()
      }
    }

    return response
  }

  // --- 2. Funciones de Lógica de Negocio ---

  function showMessage(msg, type = 'info') {
    if (!messageDiv) return
    messageDiv.textContent = msg
    messageDiv.className = `alert mt-4 alert-${type === 'error' ? 'danger' : 'success'}`
    messageDiv.classList.remove('d-none')
  }

  function doClientLogout() {
    state.accessToken = null
    state.user = null
    window.location.href = '/'
  }

  // --- 3. Event Listeners ---

  // REGISTER
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      const username = document.getElementById('regUser').value
      const email = document.getElementById('regEmail').value
      const password = document.getElementById('regPass').value

      try {
        const res = await apiRequest('/register', {
          method: 'POST',
          body: JSON.stringify({ username, email, password })
        })

        const data = await res.json()

        if (res.ok) {
          showMessage('✅ Usuario creado. Por favor inicia sesión.', 'success')
          registerForm.reset()
        } else {
          // express-validator devuelve un array de errores
          const errorMsg = data.errors ? data.errors.map(e => e.msg).join(', ') : data.error
          showMessage(`⚠️ ${errorMsg}`, 'error')
        }
      } catch (err) {
        showMessage('Error de conexión', 'error')
      }
    })
  }

  // LOGIN
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault()
      const email = document.getElementById('loginEmail').value
      const password = document.getElementById('loginPass').value
      const authMode = document.querySelector('input[name="authMode"]:checked').value

      try {
        const res = await apiRequest('/login', {
          method: 'POST',
          body: JSON.stringify({ email, password, authMode })
        })

        const data = await res.json()

        if (res.ok) {
          if (authMode === 'cookie') {
            // Modo Sesión: El servidor puso la cookie, recargamos para ver la vista protegida
            window.location.href = '/protected'
          } else {
            // Modo JWT: Guardamos token en memoria
            state.accessToken = data.accessToken
            state.user = data.user
            showMessage(`🔓 Login JWT Exitoso. Token en memoria (Seguro).`, 'success')
            console.log('Access Token:', data.accessToken)
            
            // Modificar UI para mostrar que estamos logueados (sin recargar)
            document.querySelector('.card-body').innerHTML = `
              <div class="text-center">
                <h2 class="mb-4 text-success">¡Bienvenido ${data.user.username}!</h2>
                <p class="text-muted">Estás autenticado vía <strong>JWT (Stateless)</strong></p>
                <div class="d-grid gap-3">
                   <button class="btn btn-outline-primary" onclick="alert('El token está en la variable state.accessToken')">Ver Token en Consola</button>
                   <button class="btn btn-danger" id="jwtLogout">Cerrar Sesión (JWT)</button>
                </div>
              </div>
            `
            document.getElementById('jwtLogout').addEventListener('click', async () => {
               await apiRequest('/logout', { method: 'POST' })
               doClientLogout()
            })
          }
        } else {
          const errorMsg = data.errors ? data.errors.map(e => e.msg).join(', ') : data.error
          showMessage(`❌ ${errorMsg}`, 'error')
        }
      } catch (err) {
        console.error(err)
        showMessage('Error de conexión al servidor', 'error')
      }
    })
  }

  // LOGOUT (Botón de navbar)
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault()
      try {
        await apiRequest('/logout', { method: 'POST' })
        doClientLogout()
      } catch (err) {
        console.error(err)
      }
    })
  }

  // Botón Refrescar (En vista protected)
  const refreshBtn = document.getElementById('refreshBtn')
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
       // En modo cookie, esto solo verifica que la sesión siga viva
       // En modo JWT, esto pediría un nuevo token. 
       // Como 'protected' se renderiza por servidor, asumimos contexto de cookie aquí.
       location.reload() 
    })
  }
})