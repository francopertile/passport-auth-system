// public/js/app.js

// Espera a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', () => {
  
  // (Req: CSRF) El token se inyecta en <script> en el EJS
  // @ts-ignore (ignora error de TS si 'csrfToken' no está definido)
  const CSRF_TOKEN = window.csrfToken || '';

  // --- Selectores de Elementos ---
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const protectedBtn = document.getElementById('protectedBtn');
  const adminBtn = document.getElementById('adminBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const messageDiv = document.getElementById('message');

  // --- Helper para mostrar mensajes ---
  function showMessage (message, isError = true) {
    if (!messageDiv) return;
    messageDiv.textContent = message;
    messageDiv.className = `alert mt-4 ${isError ? 'alert-danger' : 'alert-success'}`;
    messageDiv.classList.remove('d-none'); // Hacer visible
  }

  // --- Lógica de Registro ---
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('regUser').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPass').value;

    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': CSRF_TOKEN // FIX: Nombre de cabecera correcto
        },
        body: JSON.stringify({ username, email, password })
      });

      if (res.ok) {
        showMessage('Usuario registrado. Ahora puedes iniciar sesión.', false);
        registerForm.reset(); // Limpia el formulario
      } else {
        const errorMsg = await res.text();
        showMessage(errorMsg, true);
      }
    } catch (err) {
      showMessage('Error de red al registrar.', true);
    }
  });

  // --- Lógica de Login ---
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPass').value;
    // @ts-ignore
    const mode = document.querySelector('input[name="authMode"]:checked').value;
    const endpoint = mode === 'cookie' ? '/login-cookie' : '/login-jwt';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': CSRF_TOKEN // FIX: Nombre de cabecera correcto
        },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const errorMsg = await res.text();
        return showMessage(errorMsg, true);
      }

      // (Req: Sesión vs JWT)
      if (mode === 'cookie') {
        // Flujo Cookie: El servidor pone las cookies. Solo recargamos.
        window.location.reload();
      } else {
        // Flujo JWT: El servidor nos da tokens, el cliente los guarda.
        const data = await res.json();
        // Guardamos en localStorage para referencia (aunque usaremos el de httpOnly)
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        showMessage('Login (JWT) exitoso. Este token se guardaría en el cliente.', false);
        
        // Para este proyecto, forzamos recarga en ambos casos.
        window.location.reload();
      }

    } catch (err) {
      showMessage('Error de red al iniciar sesión.', true);
    }
  });

  // --- Lógica de Logout ---
  logoutBtn?.addEventListener('click', async () => {
    try {
      await fetch('/logout', {
        method: 'POST',
        headers: { 'x-csrf-token': CSRF_TOKEN } // FIX: Nombre de cabecera correcto
      });
      window.location.href = '/'; // Redirigir al inicio
    } catch (err) {
      showMessage('Error de red al cerrar sesión.', true);
    }
  });

  // --- Lógica de Refresh Token (en página protegida) ---
  refreshBtn?.addEventListener('click', async () => {
    try {
      const res = await fetch('/refresh', {
        method: 'POST',
        headers: { 'x-csrf-token': CSRF_TOKEN } // FIX: Nombre de cabecera correcto
      });

      if (res.ok) {
        alert('Token de acceso renovado.');
      } else {
        alert('No se pudo renovar el token. Sesión expirada.');
        window.location.href = '/';
      }
    } catch (err) {
      alert('Error de red al refrescar token.');
    }
  });

  // --- Botones de Navegación ---
  protectedBtn?.addEventListener('click', () => {
    window.location.href = '/protected';
  });

  adminBtn?.addEventListener('click', () => {
    window.location.href = '/admin/users';
  });

});