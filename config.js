// Variable de entorno para el puerto, con un valor por defecto
export const PORT = process.env.PORT ?? 3000

// Rondas de Salt para Bcrypt. 10 es un valor seguro y estándar.
export const SALT_ROUNDS = process.env.SALT_ROUNDS ?? 10

// Claves secretas para JWT. ¡Deben ser complejas y guardadas en .env en producción!
export const SECRET_JWT_KEY = process.env.SECRET_JWT_KEY ?? 'clave-secreta-para-access-token'
export const REFRESH_SECRET = process.env.REFRESH_SECRET ?? 'clave-secreta-para-refresh-token'

// Variable para detectar si estamos en producción
export const NODE_ENV = process.env.NODE_ENV ?? 'development'