# Auth System Challenge (Sistema de Autenticación Híbrido)

Este proyecto es una aplicación web Node.js construida como solución al "Passport Auth System Challenge". Demuestra una implementación de un sistema de autenticación robusto y seguro desde cero, comparando dos enfoques principales: sesiones persistentes (manejadas por el servidor) y autenticación sin estado (stateless) usando JSON Web Tokens (JWT).

El sistema está construido con un enfoque de **seguridad primero**, implementando todos los requisitos obligatorios del desafío.

## 🚀 Características Principales

Este proyecto implementa las siguientes características de seguridad y funcionalidad:

* **Autenticación Híbrida:**
    * **1. Sesión Persistente (Cookie):** Un flujo de inicio de sesión tradicional que utiliza `express-session` para crear una sesión en el servidor, almacenada en una base de datos SQLite (`connect-sqlite3`).
    * **2. JWT Stateless (Token):** Un flujo de inicio de sesión (`/login-jwt`) que devuelve un `accessToken` y `refreshToken` al cliente, ideal para APIs consumidas por aplicaciones móviles o SPAs (Single Page Applications).
* **Hashing de Contraseñas:** (Requisito ✅) Las contraseñas se hashean de forma segura usando **bcrypt.js** (`SALT_ROUNDS = 10`) antes de almacenarse en la base de datos. En ningún momento se almacenan en texto plano.
* **Control de Acceso Basado en Roles (RBAC):** (Requisito ✅)
    * **Usuario (`user`):** Rol por defecto con permisos básicos.
    * **Administrador (`admin`):** Rol con acceso a un panel de administración (`/admin/users`) para ver, actualizar roles y eliminar otros usuarios.
* **Protección CSRF (Cross-Site Request Forgery):** (Requisito ✅) Todas las rutas que modifican el estado (login, registro, logout, y todas las acciones de admin) están protegidas por un middleware (`csurf`) que valida un token anti-CSRF único por sesión.
* **Prevención de Fuerza Bruta:** (Requisito ✅) Las rutas de inicio de sesión (`/login-cookie` y `/login-jwt`) están protegidas con `express-rate-limit` para bloquear IPs después de múltiples intentos fallidos.
* **Cookies Seguras:** (Requisito ✅) Todas las cookies emitidas por la aplicación (sesión, CSRF y tokens JWT) están configuradas con las flags `httpOnly`, `secure` (en producción) y `sameSite: 'strict'`.
* **Prevención de XSS (Cross-Site Scripting):** (Requisito ✅) Todos los datos dinámicos renderizados en las vistas EJS (como nombres de usuario, roles, etc.) se escapan usando la sintaxis `<%= ... %>` de EJS para prevenir la inyección de HTML o scripts.

## 🛠 Stack Tecnológico

* **Backend:** Node.js, Express.js
* **Base de Datos:** better-sqlite3
* **Manejo de Sesiones:** express-session, connect-sqlite3
* **Autenticación:** jsonwebtoken (JWT), bcryptjs (Hashing)
* **Seguridad:** csurf (CSRF), express-rate-limit (Fuerza Bruta)
* **Frontend:** EJS (Server-Side Rendering), Bootstrap 5 (para estilos)

## ⚙️ (Futuro) Uso e Instalación

1.  Clonar el repositorio.
2.  Instalar las dependencias:
    ```bash
    npm install
    ```
3.  Iniciar el servidor de desarrollo:
    ```bash
    npm run dev
    ```
    *(Añadiremos este script a `package.json` en un próximo commit).*

4.  Acceder a `http://localhost:3000` en el navegador.

---
*Proyecto creado por Franco Pertile, basado en el desafío de autenticación.*