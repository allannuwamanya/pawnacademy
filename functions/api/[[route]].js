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

// Simple in-memory cache for Google certs to avoid fetching on every request
let _googleCertsCache = { keys: null, fetchedAt: 0, ttl: 60 * 60 * 1000 }
async function getGooglePublicKeys() {
  const now = Date.now()
  if (_googleCertsCache.keys && (now - _googleCertsCache.fetchedAt) < _googleCertsCache.ttl) {
    return _googleCertsCache.keys
  }
  const resp = await fetch('https://www.googleapis.com/oauth2/v3/certs')
  const data = await resp.json()
  _googleCertsCache = { keys: data, fetchedAt: now, ttl: 60 * 60 * 1000 }
  return data
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
  // Set an expiry 30 days from creation
  await sql`INSERT INTO sessions (user_id, token, expires_at) VALUES (${userId}, ${token}, NOW() + INTERVAL '30 days')`
  return token
}

async function getAuthUser(request, sql) {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice(7)
  // Only accept sessions created within the last 30 days
  // Prefer explicit expires_at when available, fall back to created_at window
  const result = await sql`
    SELECT user_id FROM sessions
    WHERE token = ${token}
    AND (
      (expires_at IS NOT NULL AND expires_at > NOW())
      OR (expires_at IS NULL AND created_at > NOW() - INTERVAL '30 days')
    )
    LIMIT 1
  `
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

  // POST /api/auth/logout - revoke current session token
  if (route === 'auth/logout' && request.method === 'POST') {
    const auth = request.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    const token = auth.slice(7)
    await sql`DELETE FROM sessions WHERE token = ${token}`
    return new Response(null, { status: 204 })
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

  // ============================================================================
  // PUZZLE ENDPOINTS
  // ============================================================================

  // GET /api/puzzles/random - Fetch a random puzzle near user's rating
  if (route === 'puzzles/random' && request.method === 'GET') {
    const user = await getAuthUser(request, sql)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401,
        headers: { 'Content-Type': 'application/json' } })
    }

    // Get user's puzzle rating (default 1500 if not found)
    const progressResult = await sql`
      SELECT current_rating FROM user_puzzle_progress WHERE user_id = ${user.id} LIMIT 1
    `
    const userRating = progressResult.length ? progressResult[0].current_rating : 1500
    
    // Find puzzles within ±200 rating range that user hasn't solved recently
    const ratingMin = userRating - 200
    const ratingMax = userRating + 200
    
    const puzzles = await sql`
      SELECT p.id, p.puzzle_id, p.fen, p.rating, p.themes, p.opening_tags
      FROM puzzles p
      WHERE p.rating BETWEEN ${ratingMin} AND ${ratingMax}
      AND NOT EXISTS (
        SELECT 1 FROM puzzle_attempts pa
        WHERE pa.puzzle_id = p.id 
        AND pa.user_id = ${user.id}
        AND pa.solved = true
        AND pa.created_at > NOW() - INTERVAL '7 days'
      )
      ORDER BY RANDOM()
      LIMIT 1
    `
    
    if (!puzzles.length) {
      // Fallback: return any unsolved puzzle
      const fallback = await sql`
        SELECT p.id, p.puzzle_id, p.fen, p.rating, p.themes, p.opening_tags
        FROM puzzles p
        WHERE NOT EXISTS (
          SELECT 1 FROM puzzle_attempts pa
          WHERE pa.puzzle_id = p.id AND pa.user_id = ${user.id} AND pa.solved = true
        )
        ORDER BY RANDOM()
        LIMIT 1
      `
      
      if (!fallback.length) {
        return new Response(JSON.stringify({ error: 'No puzzles available' }), { status: 404,
          headers: { 'Content-Type': 'application/json' } })
      }
      
      return new Response(JSON.stringify({ puzzle: fallback[0] }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }
    
    return new Response(JSON.stringify({ puzzle: puzzles[0] }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // GET /api/puzzles/daily - Get today's featured puzzle
  if (route === 'puzzles/daily' && request.method === 'GET') {
    const user = await getAuthUser(request, sql)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401,
        headers: { 'Content-Type': 'application/json' } })
    }

    const today = new Date().toISOString().split('T')[0]
    const result = await sql`
      SELECT p.id, p.puzzle_id, p.fen, p.rating, p.themes, p.opening_tags
      FROM daily_puzzles dp
      JOIN puzzles p ON p.id = dp.puzzle_id
      WHERE dp.date = ${today}
      LIMIT 1
    `
    
    if (!result.length) {
      return new Response(JSON.stringify({ error: 'No daily puzzle set' }), { status: 404,
        headers: { 'Content-Type': 'application/json' } })
    }
    
    // Check if user has already solved it
    const attempt = await sql`
      SELECT solved FROM puzzle_attempts
      WHERE user_id = ${user.id} AND puzzle_id = ${result[0].id}
      ORDER BY created_at DESC
      LIMIT 1
    `
    
    return new Response(JSON.stringify({ 
      puzzle: result[0],
      alreadySolved: attempt.length > 0 && attempt[0].solved
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // POST /api/puzzles/:id/attempt - Submit a puzzle solution
  if (route.startsWith('puzzles/') && route.endsWith('/attempt') && request.method === 'POST') {
    const user = await getAuthUser(request, sql)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401,
        headers: { 'Content-Type': 'application/json' } })
    }

    const puzzleId = parseInt(route.split('/')[1])
    if (isNaN(puzzleId)) {
      return new Response(JSON.stringify({ error: 'Invalid puzzle ID' }), { status: 400,
        headers: { 'Content-Type': 'application/json' } })
    }

    const body = await request.json()
    const { moves, timeSpent } = body
    
    if (!moves || !Array.isArray(moves)) {
      return new Response(JSON.stringify({ error: 'Invalid moves format' }), { status: 400,
        headers: { 'Content-Type': 'application/json' } })
    }

    // Validate move format (simple UCI move pattern, allow promotion piece)
    const uciRe = /^[a-h][1-8][a-h][1-8][qrbn]?$/
    if (!moves.every(m => typeof m === 'string' && uciRe.test(m.trim()))) {
      return new Response(JSON.stringify({ error: 'Invalid move values' }), { status: 400,
        headers: { 'Content-Type': 'application/json' } })
    }

    const normalizedMoves = moves.map(m => m.trim())

    // Get the puzzle and its solution
    const puzzleResult = await sql`
      SELECT id, moves FROM puzzles WHERE id = ${puzzleId} LIMIT 1
    `
    
    if (!puzzleResult.length) {
      return new Response(JSON.stringify({ error: 'Puzzle not found' }), { status: 404,
        headers: { 'Content-Type': 'application/json' } })
    }

    const puzzle = puzzleResult[0]
    const solutionMoves = puzzle.moves.trim().split(/\s+/)
    
    // Validate: user moves should match solution moves
    // For now, we check if user's moves contain the solution sequence
    const userMovesStr = moves.join(' ')
    const solved = solutionMoves.every((solutionMove, idx) => {
      return normalizedMoves[idx] === solutionMove
    }) && normalizedMoves.length === solutionMoves.length

    // Count previous attempts for this puzzle
    const attemptCount = await sql`
      SELECT COUNT(*) as count FROM puzzle_attempts
      WHERE user_id = ${user.id} AND puzzle_id = ${puzzleId}
    `
    const attemptNumber = parseInt(attemptCount[0].count) + 1

    // Record the attempt (triggers will auto-update progress)
    await sql`
      INSERT INTO puzzle_attempts (user_id, puzzle_id, solved, time_spent, moves_made, attempt_number)
      VALUES (${user.id}, ${puzzleId}, ${solved}, ${timeSpent || null}, ${normalizedMoves}, ${attemptNumber})
    `

    // Get updated user progress
    const progress = await sql`
      SELECT current_rating, total_solved, current_streak, puzzles_today
      FROM user_puzzle_progress
      WHERE user_id = ${user.id}
      LIMIT 1
    `

    return new Response(JSON.stringify({ 
      correct: solved,
      solution: solutionMoves,
      attemptNumber,
      progress: progress.length ? progress[0] : null
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // GET /api/puzzles/:id - Get a specific puzzle by ID
  if (route.startsWith('puzzles/') && request.method === 'GET' && !route.includes('/')) {
    const user = await getAuthUser(request, sql)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401,
        headers: { 'Content-Type': 'application/json' } })
    }

    const puzzleId = parseInt(route.split('/')[1])
    if (isNaN(puzzleId)) {
      return new Response(JSON.stringify({ error: 'Invalid puzzle ID' }), { status: 400,
        headers: { 'Content-Type': 'application/json' } })
    }

    const result = await sql`
      SELECT id, puzzle_id, fen, rating, themes, opening_tags
      FROM puzzles 
      WHERE id = ${puzzleId}
      LIMIT 1
    `
    
    if (!result.length) {
      return new Response(JSON.stringify({ error: 'Puzzle not found' }), { status: 404,
        headers: { 'Content-Type': 'application/json' } })
    }
    
    return new Response(JSON.stringify({ puzzle: result[0] }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // GET /api/progress - Get user's puzzle progress and statistics
  if (route === 'progress' && request.method === 'GET') {
    const user = await getAuthUser(request, sql)
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401,
        headers: { 'Content-Type': 'application/json' } })
    }

    // Get or create user progress
    let progress = await sql`
      SELECT * FROM user_puzzle_progress WHERE user_id = ${user.id} LIMIT 1
    `
    
    if (!progress.length) {
      // Create initial progress entry
      await sql`
        INSERT INTO user_puzzle_progress (user_id)
        VALUES (${user.id})
      `
      progress = await sql`
        SELECT * FROM user_puzzle_progress WHERE user_id = ${user.id} LIMIT 1
      `
    }

    // Get recent attempt history (last 30 days for chart data)
    const history = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as attempts,
        SUM(CASE WHEN solved THEN 1 ELSE 0 END) as solved
      FROM puzzle_attempts
      WHERE user_id = ${user.id}
      AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `

    // Get theme breakdown
    const themeStats = await sql`
      SELECT 
        UNNEST(p.themes) as theme,
        COUNT(*) as attempts,
        SUM(CASE WHEN pa.solved THEN 1 ELSE 0 END) as solved
      FROM puzzle_attempts pa
      JOIN puzzles p ON p.id = pa.puzzle_id
      WHERE pa.user_id = ${user.id}
      GROUP BY theme
      ORDER BY attempts DESC
      LIMIT 10
    `

    return new Response(JSON.stringify({ 
      progress: progress[0],
      history: history,
      themeStats: themeStats
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404,
    headers: { 'Content-Type': 'application/json' } })
}
