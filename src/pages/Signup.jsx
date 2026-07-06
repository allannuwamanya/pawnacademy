import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Auth.css'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')

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
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-desc">Start your chess journey today</p>
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
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </label>
          <label className="auth-label">
            Confirm password
            <input
              type="password"
              className="auth-input"
              placeholder="Repeat your password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              required
            />
          </label>
          <button type="submit" className="btn-primary auth-btn">Create Account</button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
