/**
 * Network error handling and retry logic
 * Provides robust offline detection and automatic retry with exponential backoff
 */

// Check if the browser is online
export function isOnline() {
  return navigator.onLine
}

// Network status event listeners
const networkListeners = new Set()

export function addNetworkListener(callback) {
  networkListeners.add(callback)
  
  // Add browser online/offline listeners
  const onlineHandler = () => callback(true)
  const offlineHandler = () => callback(false)
  
  window.addEventListener('online', onlineHandler)
  window.addEventListener('offline', offlineHandler)
  
  // Return cleanup function
  return () => {
    networkListeners.delete(callback)
    window.removeEventListener('online', onlineHandler)
    window.removeEventListener('offline', offlineHandler)
  }
}

// Exponential backoff retry with jitter
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    shouldRetry = () => true,
    onRetry = () => {}
  } = options

  let lastError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      // Don't retry if we're offline
      if (!isOnline()) {
        throw new NetworkError('You are offline. Please check your internet connection.')
      }
      
      // Don't retry if custom check says no
      if (!shouldRetry(error, attempt)) {
        throw error
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error
      }
      
      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      )
      const jitter = Math.random() * 0.3 * exponentialDelay
      const delay = exponentialDelay + jitter
      
      onRetry(attempt + 1, delay, error)
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

// Custom error class for network errors
export class NetworkError extends Error {
  constructor(message, originalError = null) {
    super(message)
    this.name = 'NetworkError'
    this.originalError = originalError
    this.isNetworkError = true
  }
}

// Determine if an error is retryable
export function isRetryableError(error) {
  // Network errors are always retryable
  if (error instanceof NetworkError) return true
  if (error.name === 'NetworkError') return true
  if (error.message?.includes('Failed to fetch')) return true
  if (error.message?.includes('Network request failed')) return true
  if (error.message?.includes('internet connection')) return true
  
  // Timeout errors are retryable
  if (error.name === 'AbortError') return true
  if (error.message?.includes('timeout')) return true
  
  // 5xx server errors are retryable (but not 4xx client errors)
  if (error.status >= 500 && error.status < 600) return true
  
  // 429 Too Many Requests is retryable
  if (error.status === 429) return true
  
  // 408 Request Timeout is retryable
  if (error.status === 408) return true
  
  return false
}

// Enhanced fetch with retry logic
export async function fetchWithRetry(url, options = {}) {
  const {
    maxRetries = 3,
    timeout = 30000,
    ...fetchOptions
  } = options
  
  return retryWithBackoff(
    async () => {
      // Check online status before attempting
      if (!isOnline()) {
        throw new NetworkError('You are offline. Please check your internet connection.')
      }
      
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        // Check for HTTP errors
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
          error.status = response.status
          error.response = response
          throw error
        }
        
        return response
      } catch (error) {
        clearTimeout(timeoutId)
        
        // Convert fetch errors to NetworkError
        if (error.name === 'AbortError') {
          throw new NetworkError('Request timed out. Please try again.', error)
        }
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          throw new NetworkError('Unable to connect. Please check your internet connection.', error)
        }
        
        throw error
      }
    },
    {
      maxRetries,
      shouldRetry: (error) => isRetryableError(error),
      onRetry: (attempt, delay) => {
        console.log(`Retry attempt ${attempt} after ${Math.round(delay)}ms`)
      }
    }
  )
}

// Queue for offline requests
const offlineQueue = []

export function queueOfflineRequest(request) {
  offlineQueue.push(request)
  console.log(`Queued request for later: ${offlineQueue.length} pending`)
}

export async function processOfflineQueue() {
  if (!isOnline() || offlineQueue.length === 0) return
  
  console.log(`Processing ${offlineQueue.length} queued requests...`)
  
  const results = []
  
  while (offlineQueue.length > 0) {
    const request = offlineQueue.shift()
    
    try {
      const result = await request()
      results.push({ success: true, result })
    } catch (error) {
      console.error('Failed to process queued request:', error)
      results.push({ success: false, error })
    }
  }
  
  return results
}

// Auto-process queue when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Connection restored, processing offline queue...')
    processOfflineQueue()
  })
}
