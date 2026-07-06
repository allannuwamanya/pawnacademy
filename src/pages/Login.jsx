import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: Supabase auth
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
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-label">
            Email
            <input
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="auth-label">
            Password
            <input
              type="password"
              className="auth-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <div className="auth-options">
            <label className="auth-checkbox">
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" className="auth-forgot">Forgot password?</a>
          </div>
          <button type="submit" className="btn-primary auth-btn">Sign In</button>
        </form>
        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
