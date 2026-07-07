const GOOGLE_CLIENT_ID = '310339672720-pkqtq1eok2g9noi56h453fnb7a8l3782.apps.googleusercontent.com'
const CALLBACK_URL = typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : 'https://pawn-academy.pages.dev/api/auth/callback'

export function signInWithGoogle() {
  const nonce = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  sessionStorage.setItem('google_nonce', nonce)
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce,
    response_mode: 'form_post',
  })
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export { GOOGLE_CLIENT_ID }
