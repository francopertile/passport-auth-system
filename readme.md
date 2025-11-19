# 🛡️ Sistema de Autenticación Híbrido

Un sistema de autenticación robusto y listo para producción construido con **Node.js** y **Express v5**. Este proyecto implementa una **Estrategia de Autenticación Híbrida** segura, soportando flujos con estado (Sesión/Cookie) y sin estado (JWT) dentro de una **Arquitectura MVC** modular.

![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg) ![Express](https://img.shields.io/badge/Express-v5.0-blue.svg) ![Security](https://img.shields.io/badge/Security-OWASP%20Hardened-red.svg) ![Architecture](https://img.shields.io/badge/Architecture-MVC-orange.svg)

## 📋 Descripción General

Este repositorio resuelve el "Passport Challenge" superando los requisitos básicos. Aborda problemas críticos comunes en implementaciones de Node.js/SQLite —específicamente los **bloqueos de concurrencia en base de datos**— mediante la segregación de las capas de persistencia.

Está diseñado para simular un escenario real donde una aplicación debe servir tanto a clientes basados en navegador (vía sesiones seguras) como a clientes externos o aplicaciones móviles (vía JWTs), sin comprometer la seguridad ni la mantenibilidad.

## 🚀 Características Clave

### 🔐 Autenticación Híbrida
* **Sesión con Estado (Stateful):** Sesiones tradicionales del lado del servidor usando `express-session` con almacenamiento persistente en SQLite (`connect-sqlite3`).
* **JWT Sin Estado (Stateless):** Implementación segura de JSON Web Tokens.
    * **Access Token:** De vida corta, enviado en el cuerpo JSON.
    * **Refresh Token:** De vida larga, almacenado estrictamente en una **Cookie `HttpOnly`** para prevenir ataques XSS.

### 🏗️ Arquitectura Escalable
* **Patrón MVC:** Separación completa de responsabilidades. La lógica reside en `controllers`, el enrutamiento en `routes` y el acceso a datos en `models`.
* **Segregación de Base de Datos:** Resuelve los problemas de bloqueo WAL de SQLite separando `users.db` (Datos de Negocio) de `sessions.db` (Datos Efímeros).
* **Interceptor del Cliente:** Un cliente inteligente en JS Vanilla que maneja la inyección de tokens y el **auto-refresco silencioso** ante errores 401.

### 🛡️ Seguridad Primero (Security First)
* **Saneamiento de Entradas:** Validación rigurosa usando `express-validator` para prevenir inyecciones.
* **Protección contra Fuerza Bruta:** Rate limiting (límite de velocidad) en endpoints sensibles (`/login`, `/register`).
* **Cabeceras Seguras:** Implementadas vía `helmet` (HSTS, X-Frame-Options, etc.).
* **Protección CSRF:** Patrón de "Double-submit cookie" para prevenir la falsificación de peticiones en sitios cruzados.
* **Hashing de Contraseñas:** Implementación del estándar de la industria `bcrypt`.

## 🛠️ Stack Tecnológico

* **Core:** Node.js, Express v5 (Router)
* **Base de Datos:** `better-sqlite3` (Datos de Usuario), `connect-sqlite3` (Almacén de Sesiones)
* **Seguridad:** `helmet`, `csurf`, `express-rate-limit`, `bcryptjs`, `express-validator`
* **Auth:** `jsonwebtoken`, `express-session`
* **Frontend:** EJS (Renderizado en Servidor), Bootstrap 5

## ⚙️ Instalación y Configuración

Este proyecto incluye un **script de sembrado (seeding)** para inicializar la infraestructura automáticamente.

1.  **Clonar el repositorio:**
    ```bash
    git clone [https://github.com/francopertile/passport-auth-system.git](https://github.com/francopertile/passport-auth-system.git)
    cd passport-auth-system
    ```

2.  **Instalar Dependencias:**
    ```bash
    npm install
    ```

3.  **Configuración de Entorno:**
    Crea un archivo `.env` en la raíz (o usa los valores por defecto de `config.js` para desarrollo):
    ```env
    NODE_ENV=development
    PORT=3000
    SALT_ROUNDS=10
    SECRET_JWT_KEY=super-clave-secreta-access
    REFRESH_SECRET=super-clave-secreta-refresh
    ```

4.  **Inicializar y Sembrar Base de Datos:**
    Este comando crea la carpeta `data/` y la puebla con usuarios de prueba.
    ```bash
    npm run seed
    ```

5.  **Iniciar el Servidor:**
    ```bash
    npm run dev
    ```

## 🧪 Probando el Sistema

Una vez que el servidor esté corriendo en `http://localhost:3000`:

### Credenciales por Defecto (del Seed)
| Rol | Email | Contraseña |
| :--- | :--- | :--- |
| **Admin** | `admin@test.com` | `password123` |
| **Usuario** | `user@test.com` | `password123` |

*También puedes registrar nuevos usuarios a través del Formulario de Registro.*

## 📂 Estructura del Proyecto

```text
src/
├── controllers/      # Lógica de negocio (Auth, Admin)
├── middlewares/      # Seguridad, Auth, Validación
├── models/           # Capa de Acceso a Datos (DAO)
├── routes/           # Definiciones de API y Vistas
├── db.js             # Conexión y configuración de DB
└── index.js          # Punto de entrada
public/
└── js/               # Cliente Inteligente (Fetch Interceptor)
data/                 # Archivos SQLite (Generados por seed)
scripts/              # Scripts de utilidad (Seeding, Mantenimiento)