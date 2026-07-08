import { fetchWithRetry, NetworkError } from './networkHandler'

const API = '/api'

// Enhanced API function with retry and better error handling
async function apiPost(path, body) {
  try {
    const resp = await fetchWithRetry(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      maxRetries: 2
    })
    
    const data = await resp.json()
    localStorage.setItem('session', JSON.stringify(data))
    return data
  } catch (error) {
    // Convert network errors to user-friendly messages
    if (error instanceof NetworkError) {
      throw error
    }
    
    if (error.status === 400) {
      const err = await error.response?.json().catch(() => ({ error: 'Invalid request' }))
      throw new Error(err.error || 'Invalid request')
    }
    
    if (error.status === 401) {
      throw new Error('Invalid email or password')
    }
    
    if (error.status === 409) {
      throw new Error('Email already registered')
    }
    
    if (error.status >= 500) {
      throw new NetworkError('Server error. Please try again later.')
    }
    
    // Unknown error
    throw new NetworkError('Something went wrong. Please try again.')
  }
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

export async function apiFetch(path, options = {}) {
  const session = getSession()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`
  }
  
  try {
    const response = await fetchWithRetry(`${API}${path}`, { 
      ...options, 
      headers,
      maxRetries: options.maxRetries || 2
    })
    
    return response.json()
  } catch (error) {
    // Convert network errors to user-friendly messages
    if (error instanceof NetworkError) {
      throw error
    }
    
    if (error.status === 401) {
      // Clear invalid session
      clearSession()
      throw new Error('Your session has expired. Please log in again.')
    }
    
    if (error.status === 403) {
      throw new Error('You don\'t have permission to perform this action.')
    }
    
    if (error.status === 404) {
      throw new Error('The requested resource was not found.')
    }
    
    if (error.status >= 500) {
      throw new NetworkError('Server error. Please try again later.')
    }
    
    // Try to get error message from response
    try {
      const errorData = await error.response?.json()
      throw new Error(errorData?.error || 'An error occurred')
    } catch {
      throw new NetworkError('Something went wrong. Please try again.')
    }
  }
}
