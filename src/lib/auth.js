const API = '/api'

async function apiPost(path, body) {
  const resp = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error)
  }
  const data = await resp.json()
  localStorage.setItem('session', JSON.stringify(data))
  return data
}

export async function signUp(email, password) {
  return apiPost('/auth/signup', { email, password })
}

export async function signIn(email, password) {
  return apiPost('/auth/login', { email, password })
}

export async function loginWithGoogle(credential) {
  return apiPost('/auth/google', { credential })
}

export function getSession() {
  try {
    const raw = localStorage.getItem('session')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem('session')
}

export function apiFetch(path, options = {}) {
  const session = getSession()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`
  }
  return fetch(`${API}${path}`, { ...options, headers }).then(async (r) => {
    if (!r.ok) {
      const err = await r.json().catch(() => ({ error: r.statusText }))
      throw new Error(err.error || 'API error')
    }
    return r.json()
  })
}
