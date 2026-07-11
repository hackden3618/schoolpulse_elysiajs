export const HOST = process.env.HOST || "http://localhost:5173"
export const BACKEND_URL = process.env.BACKEND || "http://localhost:3000"
export const EXPOSED_BACKEND = process.env.EXPOSED_BACKEND || BACKEND_URL

// Daraja Config
export const MPESA_CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY || ""
export const MPESA_CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET || ""
export const MPESA_SHORTCODE = process.env.MPESA_SHORTCODE || ""
export const MPESA_PASSKEY = process.env.MPESA_PASSKEY || ""
export const MPESA_ENVIRONMENT = process.env.MPESA_ENVIRONMENT || "sandbox"
export const MPESA_CALLBACK_URL = process.env.MPESA_CALLBACK_URL || `${EXPOSED_BACKEND}/mpesa/callback`
export const MPESA_BASE_URL = process.env.MPESA_BASE_URL || "https://sandbox.safaricom.co.ke"
