import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn, signUp } from '../lib/auth'
import { signInWithGoogle } from '../lib/google'
import { useAuth } from '../lib/AuthContext'
import Spinner from '../components/Spinner'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuth()
  const navigate = useNavigate()

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const session = await signIn(email, password)
      setUser(session.user)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    // Completely bypass backend for local dev
    const mockSession = {
      user: {
        id: 'local-guest-id',
        email: 'guest@pawnacademy.local',
        display_name: 'Guest Player',
        avatar_url: null
      },
      token: 'local-dev-bypass-token'
    }
    
    // Save to localStorage just like real auth does
    localStorage.setItem('session', JSON.stringify(mockSession))
    setUser(mockSession.user)
    navigate('/')
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-logo">
          <span className="logo-icon">♞</span>
          <span className="logo-text">Pawn Academy</span>
        </Link>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-desc">Sign in to continue your training</p>

        <form onSubmit={handleEmailSubmit} className="auth-form">
          <label className="auth-label">
            Email
            <input type="email" className="auth-input" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
          </label>
          <label className="auth-label">
            Password
            <input type="password" className="auth-input" placeholder="Enter your password"
              value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn-primary auth-btn" disabled={loading}>
            {loading ? (
              <>
                <Spinner size={16} color="#fff" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <button onClick={signInWithGoogle} className="btn-google-custom">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Login with Google
        </button>

        <button onClick={handleGuestLogin} className="btn-primary auth-btn" style={{ marginTop: '12px', backgroundColor: '#555', color: '#fff', border: 'none' }} disabled={loading}>
          {loading ? 'Logging in...' : 'Local Dev Bypass (Guest)'}
        </button>

        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
