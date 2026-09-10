export const JWT_SECRET_STRING = process.env.JWT_SECRET || 'pharmatrack-super-secret-jwt-key-2026-production-ready';
export const JWT_SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);
