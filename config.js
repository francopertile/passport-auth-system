// Configuración centralizada
// En producción, estos valores DEBEN venir del archivo .env

export const PORT = process.env.PORT ?? 3000

export const SALT_ROUNDS = Number(process.env.SALT_ROUNDS ?? 10)

// ¡IMPORTANTE! En producción, estas claves deben ser largas y aleatorias
export const SECRET_JWT_KEY = process.env.SECRET_JWT_KEY || 'dev-access-token-secret-key'
export const REFRESH_SECRET = process.env.REFRESH_SECRET || 'dev-refresh-token-secret-key'

export const NODE_ENV = process.env.NODE_ENV ?? 'development'