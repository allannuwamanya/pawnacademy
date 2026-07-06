import { neon } from '@neondatabase/serverless'

async function pbkdf2(password, salt) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256)
  return btoa(String.fromCharCode(...new Uint8Array(bits)))
}

function generateToken() {
  return crypto.randomUUID() + '-' + crypto.randomUUID()
}

async function getGooglePublicKeys() {
  const resp = await fetch('https://www.googleapis.com/oauth2/v3/certs')
  return resp.json()
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  return Uint8Array.from(atob(str), c => c.charCodeAt(0))
}

async function verifyGoogleIdToken(idToken, clientId) {
  try {
    const parts = idToken.split('.')
    if (parts.length !== 3) return null
    const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0])))
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])))

    if (payload.aud !== clientId || payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') return null
    if (payload.exp * 1000 < Date.now()) return null

    const keys = await getGooglePublicKeys()
    const key = keys.keys.find(k => k.kid === header.kid)
    if (!key) return null

    const jwk = { kty: key.kty, n: key.n, e: key.e, alg: key.alg || 'RS256' }
    const cryptoKey = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify'])
    const sig = base64UrlDecode(parts[2])
    const data = new TextEncoder().encode(parts[0] + '.' + parts[1])
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, sig, data)
    if (!valid) return null

    return payload
  } catch { return null }
}

async function createSession(sql, userId) {
  const token = generateToken()
  await sql`INSERT INTO sessions (user_id, token) VALUES (${userId}, ${token})`
  return token
}

async function getAuthUser(request, sql) {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  const result = await sql`SELECT user_id FROM sessions WHERE token = ${token} LIMIT 1`
  if (!result.length) return null
  const user = await sql`SELECT id, email, display_name, avatar_url, created_at FROM users WHERE id = ${result[0].user_id} LIMIT 1`
  return user[0] || null
}

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)
  const route = url.pathname.replace('/api/', '').replace(/\/$/, '') || ''

  if (request.method === 'GET' && route === 'health') {
    return new Response(JSON.stringify({ status: 'ok' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const sql = neon(env.NEON_DATABASE_URL)

  if (route === 'auth/signup' && request.method === 'POST') {
    const body = await request.json()
    if (!body.email || !body.password || body.password.length < 8) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 400,
        headers: { 'Content-Type': 'application/json' } })
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${body.email} LIMIT 1`
    if (existing.length) {
      return new Response(JSON.stringify({ error: 'Email already registered' }), { status: 409,
        headers: { 'Content-Type': 'application/json' } })
    }

    const salt = crypto.randomUUID()
    const hash = await pbkdf2(body.password, salt)
    const result = await sql`
      INSERT INTO users (firebase_uid, email, display_name, password_hash)
      VALUES (${salt}, ${body.email}, ${body.email.split('@')[0]}, ${salt + ':' + hash})
      RETURNING id, email, display_name, avatar_url, created_at
    `
    const token = await createSession(sql, result[0].id)
    return new Response(JSON.stringify({ user: result[0], token }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (route === 'auth/login' && request.method === 'POST') {
    const body = await request.json()
    const result = await sql`SELECT id, email, display_name, avatar_url, password_hash FROM users WHERE email = ${body.email} LIMIT 1`
    if (!result.length || !result[0].password_hash) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401,
        headers: { 'Content-Type': 'application/json' } })
    }

    const [salt, storedHash] = result[0].password_hash.split(':')
    const hash = await pbkdf2(body.password, salt)
    if (hash !== storedHash) {
      return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401,
        headers: { 'Content-Type': 'application/json' } })
    }

    const token = await createSession(sql, result[0].id)
    const { password_hash, ...user } = result[0]
    return new Response(JSON.stringify({ user, token }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (route === 'auth/google' && request.method === 'POST') {
    const body = await request.json()
    const payload = await verifyGoogleIdToken(body.credential, '310339672720-pkqtq1eok2g9noi56h453fnb7a8l3782.apps.googleusercontent.com')
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401,
        headers: { 'Content-Type': 'application/json' } })
    }

    const result = await sql`
      INSERT INTO users (firebase_uid, email, display_name, avatar_url)
      VALUES (${payload.sub}, ${payload.email}, ${payload.name || ''}, ${payload.picture || ''})
      ON CONFLICT (firebase_uid) DO UPDATE
      SET email = ${payload.email}, display_name = COALESCE(${payload.name}, users.display_name),
          avatar_url = COALESCE(${payload.picture}, users.avatar_url)
      RETURNING id, email, display_name, avatar_url, created_at
    `
    const token = await createSession(sql, result[0].id)
    return new Response(JSON.stringify({ user: result[0], token }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (route === 'auth/callback' && request.method === 'POST') {
    const formData = await request.formData()
    const credential = formData.get('credential') || formData.get('id_token')
    if (!credential) {
      return new Response('Missing credential', { status: 400 })
    }

    const payload = await verifyGoogleIdToken(credential, '310339672720-pkqtq1eok2g9noi56h453fnb7a8l3782.apps.googleusercontent.com')
    if (!payload) {
      return new Response('Invalid token', { status: 401 })
    }

    const result = await sql`
      INSERT INTO users (firebase_uid, email, display_name, avatar_url)
      VALUES (${payload.sub}, ${payload.email}, ${payload.name || ''}, ${payload.picture || ''})
      ON CONFLICT (firebase_uid) DO UPDATE
      SET email = ${payload.email}, display_name = COALESCE(${payload.name}, users.display_name),
          avatar_url = COALESCE(${payload.picture}, users.avatar_url)
      RETURNING id, email, display_name, avatar_url, created_at
    `
    const token = await createSession(sql, result[0].id)
    const data = btoa(JSON.stringify({ user: result[0], token })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    return new Response(null, {
      status: 302,
      headers: { Location: `/?gs=${data}` },
    })
  }

  if (route === 'profile' && request.method === 'GET') {
    const user = await getAuthUser(request, sql)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401,
        headers: { 'Content-Type': 'application/json' } })
    }
    return new Response(JSON.stringify({ user }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404,
    headers: { 'Content-Type': 'application/json' } })
}
