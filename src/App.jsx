import { useState, useEffect } from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Tactics from './pages/Tactics.jsx'
import Settings from './pages/Settings.jsx'
import AppLayout from './components/AppLayout.jsx'
import NetworkStatus from './components/NetworkStatus.jsx'
import { ToastProvider } from './components/Toast.jsx'
import { useAuth } from './lib/AuthContext.jsx'
import './App.css'

const pieces = ['♟', '♞', '♝', '♜', '♛', '♚']

const FloatingPieces = () => (
  <div className="floating-pieces" aria-hidden="true">
    {Array.from({ length: 12 }, (_, i) => (
      <span
        key={i}
        className="float-piece"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          fontSize: `${20 + Math.random() * 30}px`,
          animationDelay: `${Math.random() * 8}s`,
          animationDuration: `${12 + Math.random() * 16}s`,
          opacity: 0.04 + Math.random() * 0.06,
        }}
      >
        {pieces[i % pieces.length]}
      </span>
    ))}
  </div>
)

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-icon">♞</span>
          <span className="logo-text">Pawn Academy</span>
        </Link>
        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          <a href="/#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="/#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          <a href="/#engine" onClick={() => setMenuOpen(false)}>Engine</a>
          <Link to="/login" className="btn-nav" onClick={() => setMenuOpen(false)}>Sign In</Link>
        </div>
      </div>
    </nav>
  )
}

const Hero = () => (
  <section className="hero">
    <FloatingPieces />
    <div className="hero-bg-pattern" />
    <div className="hero-content">
      <div className="hero-badge">Master Chess. Your Way.</div>
      <h1 className="hero-title">
        Master Chess.
        <br />
        <span className="gold">Play. Learn. Improve.</span>
      </h1>
      <p className="hero-subtitle">
        The modern chess training platform. Study openings, endgames, tactics,
        and analyze every blunder — all powered by the strongest chess engine.
      </p>
      <div className="hero-actions">
        <Link to="/signup" className="btn-primary">Start Training Free</Link>
        <a href="#features" className="btn-secondary">Explore Features</a>
      </div>
      <div className="hero-stats">
        <div className="stat">
          <span className="stat-number">3500+</span>
          <span className="stat-label">Engine Rating</span>
        </div>
        <div className="stat">
          <span className="stat-number">∞</span>
          <span className="stat-label">Openings Database</span>
        </div>
        <div className="stat">
          <span className="stat-number">Real-time</span>
          <span className="stat-label">Analysis</span>
        </div>
      </div>
    </div>
  </section>
)

const features = [
  { icon: '♟', title: 'Tactics Trainer', desc: 'Hundreds of curated tactical puzzles with instant feedback. Forks, pins, skewers, sacrifices — master them all.' },
  { icon: '♜', title: 'Opening Explorer', desc: 'Navigate a massive opening tree with engine evaluations at every node. Learn the why behind every move.' },
  { icon: '♚', title: 'Endgame Studies', desc: 'From basic checkmates to complex pawn endgames. Interactive tablebase-backed positions with clear explanations.' },
  { icon: '♛', title: 'Blunder Analysis', desc: 'Upload or play games and get instant blunder detection. See exactly where you lost the advantage and why.' },
  { icon: '♝', title: 'Engine Play', desc: 'Play against adjustable difficulty levels. From beginner-friendly to grandmaster crushing difficulty.' },
  { icon: '♞', title: 'Progress Tracking', desc: 'Track your rating, puzzle performance, and opening repertoire. Identify weaknesses and improve systematically.' },
]

const Features = () => (
  <section id="features" className="features">
    <div className="section-header">
      <span className="section-label">Everything You Need</span>
      <h2 className="section-title">Train Like a Grandmaster</h2>
      <p className="section-desc">Every tool to take you from beginner to club champion — and beyond.</p>
    </div>
    <div className="features-grid">
      {features.map((f, i) => (
        <div key={i} className="feature-card">
          <span className="feature-icon">{f.icon}</span>
          <h3 className="feature-title">{f.title}</h3>
          <p className="feature-desc">{f.desc}</p>
        </div>
      ))}
    </div>
  </section>
)

const testimonials = [
  { quote: "I went from 1200 to 1800 in six months using Pawn Academy's tactics trainer. The instant engine feedback on every puzzle is a game-changer.", name: 'Alex M.', title: 'Club Player' },
  { quote: 'The opening explorer helped me build a complete repertoire. I finally understand why I\'m playing each move, not just memorizing lines.', name: 'Sarah K.', title: 'Tournament Player' },
  { quote: 'As a coach, I recommend Pawn Academy to all my students. The blunder analysis feature alone is worth it — it catches things even I miss.', name: 'GM David R.', title: 'Grandmaster & Coach' },
]

const Testimonials = () => (
  <section id="testimonials" className="testimonials">
    <div className="section-header">
      <span className="section-label">Trusted by Players</span>
      <h2 className="section-title">What Our Users Say</h2>
      <p className="section-desc">Join thousands of players already improving with Pawn Academy.</p>
    </div>
    <div className="testimonials-grid">
      {testimonials.map((t, i) => (
        <div key={i} className="testimonial-card">
          <div className="testimonial-stars">{'★'.repeat(5)}</div>
          <p className="testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
          <div className="testimonial-author">
            <div className="testimonial-avatar">{t.name.charAt(0)}</div>
            <div>
              <div className="testimonial-name">{t.name}</div>
              <div className="testimonial-title">{t.title}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
)

const plans = [
  { name: 'Free', price: '$0', period: 'forever', features: ['Basic tactics puzzles', 'Opening explorer (limited)', 'Engine analysis (depth 12)', '5 saved games', 'Community forum access'], cta: 'Start Free', highlighted: false },
  { name: 'Pro', price: '$9', period: '/month', features: ['Unlimited tactics puzzles', 'Full opening explorer', 'Engine analysis (depth 24)', 'Unlimited saved games', 'Blunder analysis', 'Progress tracking'], cta: 'Go Pro', highlighted: true },
  { name: 'Grandmaster', price: '$19', period: '/month', features: ['Everything in Pro', 'Engine analysis (depth 30+)', 'Multi-variation analysis (5 lines)', 'Syzygy tablebase endgames', 'Priority support', 'Coaching tools & export'], cta: 'Go Grandmaster', highlighted: false },
]

const Pricing = () => (
  <section id="pricing" className="pricing">
    <div className="section-header">
      <span className="section-label">Simple Pricing</span>
      <h2 className="section-title">Choose Your Plan</h2>
      <p className="section-desc">Start free. Upgrade when you&apos;re ready to go deeper.</p>
    </div>
    <div className="pricing-grid">
      {plans.map((p, i) => (
        <div key={i} className={`pricing-card ${p.highlighted ? 'highlighted' : ''}`}>
          {p.highlighted && <div className="pricing-badge">Most Popular</div>}
          <h3 className="pricing-name">{p.name}</h3>
          <div className="pricing-price">
            <span className="pricing-amount">{p.price}</span>
            <span className="pricing-period">{p.period}</span>
          </div>
          <ul className="pricing-features">
            {p.features.map((f, j) => <li key={j}><span className="check">✓</span> {f}</li>)}
          </ul>
          <Link to="/signup" className={p.highlighted ? 'btn-primary pricing-btn' : 'btn-secondary pricing-btn'}>{p.cta}</Link>
        </div>
      ))}
    </div>
  </section>
)

const EngineSection = () => (
  <section id="engine" className="engine">
    <div className="engine-bg-glow" />
    <div className="engine-content">
      <div className="engine-visual">
        <div className="engine-board">
          {Array.from({ length: 64 }, (_, i) => {
            const row = Math.floor(i / 8)
            const col = i % 8
            return <div key={i} className={`board-square ${(row + col) % 2 === 1 ? 'dark' : 'light'}`} />
          })}
          <div className="engine-overlay">
            <div className="engine-eval">
              <div className="eval-bar" />
              <span className="eval-text">+1.42</span>
            </div>
          </div>
        </div>
      </div>
      <div className="engine-text">
        <span className="section-label">Stockfish 17 Engine</span>
        <h2 className="section-title">World-Class Analysis,<br />Instant Results</h2>
        <p className="section-desc">The strongest chess engine in the world, running right in your browser. Every move evaluated, every tactic calculated, every plan uncovered.</p>
        <ul className="engine-features">
          <li><span className="check">✓</span> Multi-variation analysis (up to 5 lines)</li>
          <li><span className="check">✓</span> Adjustable depth (1–30+ ply)</li>
          <li><span className="check">✓</span> Opening book with 3M+ positions</li>
          <li><span className="check">✓</span> Syzygy tablebase for perfect endgame play</li>
          <li><span className="check">✓</span> Adaptive difficulty that matches your skill</li>
        </ul>
      </div>
    </div>
  </section>
)

const CTA = () => (
  <section id="cta" className="cta">
    <div className="cta-glow" />
    <div className="cta-content">
      <h2 className="cta-title">Ready to Transform Your Game?</h2>
      <p className="cta-desc">Join thousands of players using Pawn Academy to level up their chess. Free during early access — no credit card required.</p>
      <form className="cta-form" onSubmit={(e) => e.preventDefault()}>
        <input type="email" placeholder="Enter your email" className="cta-input" required />
        <button type="submit" className="btn-primary cta-btn">Get Early Access</button>
      </form>
      <p className="cta-note">No spam. Unsubscribe anytime.</p>
    </div>
  </section>
)

const Footer = () => (
  <footer className="footer">
    <div className="footer-inner">
      <div className="footer-brand">
        <span className="logo-icon">♞</span>
        <span className="logo-text">Pawn Academy</span>
      </div>
      <div className="footer-links">
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
        <a href="#">Contact</a>
      </div>
      <p className="footer-copy">&copy; {new Date().getFullYear()} Pawn Academy. All rights reserved.</p>
    </div>
  </footer>
)

function Landing() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <Pricing />
        <EngineSection />
        <CTA />
      </main>
      <Footer />
    </>
  )
}

function b64url(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  while (s.length % 4) s += '='
  return atob(s)
}

/* Placeholder pages for routes not yet built */
function PlaceholderPage({ title }) {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center' }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>{title}</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>This screen is coming soon. Stay tuned!</p>
    </div>
  )
}

/* Wrapper component that passes title to AppLayout and protects the route */
function AppShell({ title, subtitle }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <AppLayout title={title} subtitle={subtitle} />
}

/* Public route wrapper that redirects logged-in users to /dashboard */
function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const { setUser } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const gs = params.get('gs')
    if (gs) {
      try {
        const data = JSON.parse(b64url(gs))
        localStorage.setItem('session', JSON.stringify(data))
        setUser(data.user)
        window.history.replaceState({}, '', '/')
      } catch {}
    }
  }, [setUser])

  return (
    <ToastProvider>
      <NetworkStatus />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        {/* App routes (with sidebar + topbar) */}
        <Route element={<AppShell title="Dashboard" />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        <Route element={<AppShell title="Tactics Trainer" subtitle="Puzzle #3,847" />}>
          <Route path="/train/tactics" element={<Tactics />} />
        </Route>
        <Route element={<AppShell title="Opening Explorer" />}>
          <Route path="/train/openings" element={<PlaceholderPage title="Opening Explorer" />} />
        </Route>
        <Route element={<AppShell title="Endgame Studies" />}>
          <Route path="/train/endgames" element={<PlaceholderPage title="Endgame Studies" />} />
        </Route>
        <Route element={<AppShell title="Play vs Engine" />}>
          <Route path="/play" element={<PlaceholderPage title="Play vs Engine" />} />
        </Route>
        <Route element={<AppShell title="Analyze a Game" />}>
          <Route path="/analyze" element={<PlaceholderPage title="Analyze a Game" />} />
        </Route>
        <Route element={<AppShell title="Progress" />}>
          <Route path="/progress" element={<PlaceholderPage title="Progress" />} />
        </Route>
        <Route element={<AppShell title="Settings" />}>
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route element={<AppShell title="Upgrade" />}>
          <Route path="/pricing" element={<PlaceholderPage title="Upgrade to Pro" />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}
