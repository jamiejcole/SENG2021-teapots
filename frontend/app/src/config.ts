export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000/api/v2'
}

