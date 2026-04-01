export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000/api/v2'
}

/** Origin for public PDF URLs (same host as API parent, unless overridden). */
export function getPublicAppOrigin() {
  const explicit = (import.meta.env.VITE_PUBLIC_APP_URL as string | undefined)?.replace(/\/$/, '')
  if (explicit) return explicit
  const base = getApiBaseUrl().replace(/\/api\/v2\/?$/, '')
  return base || (typeof window !== 'undefined' ? window.location.origin : '')
}

