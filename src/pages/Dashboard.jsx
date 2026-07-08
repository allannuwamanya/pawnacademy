import { useState, useEffect } from 'react'
import { TrendingUp, Target, Trophy, Flame, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Spinner from '../components/Spinner'
import { useToast } from '../components/Toast'
import { apiFetch } from '../lib/auth'
import { NetworkError, isOnline } from '../lib/networkHandler'
import './Dashboard.css'

export default function Dashboard() {
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)
  const [progress, setProgress] = useState(null)
  const [history, setHistory] = useState([])

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch user progress and statistics
        const data = await apiFetch('/progress')
        
        if (data.progress) {
          setProgress(data.progress)
          
          // Transform progress into stats cards
          setStats({
            rating: data.progress.current_rating || 1500,
            ratingDelta: '+32', // TODO: Calculate from history
            puzzlesSolved: data.progress.total_solved || 0,
            puzzlesToday: data.progress.puzzles_today || 0,
            winRate: data.progress.total_attempts > 0
              ? Math.round((data.progress.total_solved / data.progress.total_attempts) * 100)
              : 0,
            streak: data.progress.current_streak || 0,
            longestStreak: data.progress.longest_streak || 0
          })
        }

        // Transform history data for the chart
        if (data.history && data.history.length > 0) {
          // Convert to chart format with dates
          const chartData = data.history.reverse().map(day => ({
            day: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            rating: 1500, // TODO: Track rating history
            attempts: day.attempts,
            solved: day.solved
          }))
          setHistory(chartData)
        } else {
          // Default empty data
          setHistory([
            { day: 'Today', rating: progress?.current_rating || 1500, attempts: 0, solved: 0 }
          ])
        }

      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        
        if (err instanceof NetworkError) {
          setError(err.message)
          if (!isOnline()) {
            toast.offline('Dashboard data will load when connection is restored.')
          } else {
            toast.error('Failed to load your statistics. Please try again.')
          }
        } else if (err.message?.includes('session has expired')) {
          setError('Your session has expired. Please log in again.')
          toast.error('Session expired. Please log in again.')
        } else {
          setError('Failed to load dashboard data')
          toast.error('Unable to load your stats. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="dashboard-loading">
        <Spinner size={40} />
        <p>Loading your stats...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="dashboard-error">
        <p className="dashboard-error-message">{error}</p>
        <button className="btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    )
  }

  // No data yet - first time user
  if (!stats) {
    return (
      <div className="dashboard-empty">
        <div className="dashboard-empty-content">
          <h2>Welcome to Pawn Academy! 🎉</h2>
          <p>Start solving puzzles to see your progress here.</p>
          <Link to="/train/tactics" className="btn-primary">
            Solve Your First Puzzle
          </Link>
        </div>
      </div>
    )
  }

  const STATS = [
    { label: 'Rating', value: stats.rating.toString(), delta: stats.ratingDelta, deltaUp: true, icon: '♞' },
    { label: 'Puzzles Solved', value: stats.puzzlesSolved.toString(), delta: `+${stats.puzzlesToday} today`, deltaUp: true, Icon: Target },
    { label: 'Success Rate', value: `${stats.winRate}%`, delta: `${stats.puzzlesSolved}/${stats.puzzlesSolved + (progress?.total_failed || 0)}`, deltaUp: true, Icon: Trophy },
    { label: 'Current Streak', value: `${stats.streak} days`, delta: `🏆 Best: ${stats.longestStreak}`, deltaUp: true, Icon: Flame },
  ]

  // Placeholder data for features not yet implemented
  const RECENT_GAMES = [
    { opponent: 'Puzzle Practice', result: 'Solved', resultClass: 'win', moves: stats.puzzlesToday || 0, opening: 'Tactics', date: 'Today' },
  ]

  const RECOMMENDATIONS = [
    { title: 'Master the Pin', type: 'Tactics', difficulty: 'Intermediate', icon: '♟' },
    { title: 'Ruy Lopez: Morphy Defense', type: 'Opening', difficulty: 'Advanced', icon: '♝' },
    { title: 'King & Pawn vs King', type: 'Endgame', difficulty: 'Beginner', icon: '♚' },
  ]

  const DAILY_PUZZLE = {
    title: 'Tactic of the Day',
    subtitle: 'Ready for today\'s challenge?',
    difficulty: '★★★☆☆',
    theme: 'Daily Challenge',
  }

  return (
    <div className="dashboard">
      {/* Stat Cards */}
      <div className="dash-stats">
        {STATS.map((stat, i) => (
          <div key={i} className="dash-stat-card">
            <div className="dash-stat-icon">
              {stat.icon ? <span className="chess-icon">{stat.icon}</span> : <stat.Icon size={20} />}
            </div>
            <div className="dash-stat-info">
              <div className="dash-stat-value">{stat.value}</div>
              <div className="dash-stat-label">{stat.label}</div>
            </div>
            <div className={`dash-stat-delta ${stat.deltaUp ? 'up' : 'down'}`}>
              {stat.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Main row */}
      <div className="dash-row">
        {/* Rating chart */}
        <div className="dash-card dash-chart-card">
          <div className="dash-card-header">
            <h3>Activity Progress</h3>
            <span className="dash-card-label">Last 30 days</span>
          </div>
          <div className="dash-chart">
            {history.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f0c040" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#f0c040" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    contentStyle={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, fontSize: 13 }}
                    labelStyle={{ color: '#888' }}
                    itemStyle={{ color: '#f0c040' }}
                    formatter={(value, name) => {
                      if (name === 'solved') return [`${value} solved`, 'Puzzles']
                      if (name === 'attempts') return [`${value} attempts`, 'Total']
                      return [value, name]
                    }}
                  />
                  <Area type="monotone" dataKey="solved" stroke="#f0c040" strokeWidth={2} fill="url(#goldGradient)" dot={false} activeDot={{ r: 4, fill: '#f0c040' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="dash-chart-empty">
                <p>No activity data yet. Start solving puzzles!</p>
              </div>
            )}
          </div>
        </div>

        {/* Daily puzzle */}
        <div className="dash-card dash-puzzle-card">
          <div className="dash-card-header">
            <h3>{DAILY_PUZZLE.title}</h3>
            <span className="dash-card-label">{DAILY_PUZZLE.difficulty}</span>
          </div>
          <div className="dash-puzzle-board">
            {/* Mini 4x4 visual board */}
            <div className="mini-board">
              {Array.from({ length: 16 }, (_, i) => {
                const row = Math.floor(i / 4)
                const col = i % 4
                return <div key={i} className={`mini-sq ${(row + col) % 2 === 1 ? 'dark' : 'light'}`} />
              })}
              <div className="mini-overlay">
                <span className="mini-piece">♞</span>
              </div>
            </div>
            <div className="dash-puzzle-info">
              <p className="dash-puzzle-theme">{DAILY_PUZZLE.theme}</p>
              <p className="dash-puzzle-sub">{DAILY_PUZZLE.subtitle}</p>
              <Link to="/train/tactics" className="dash-puzzle-btn">
                Start Training <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="dash-row">
        {/* Recent activity */}
        <div className="dash-card dash-games-card">
          <div className="dash-card-header">
            <h3>Recent Activity</h3>
            <Link to="/train/tactics" className="dash-card-link">View All</Link>
          </div>
          <div className="dash-games-list">
            {progress && progress.total_attempts > 0 ? (
              <>
                <div className="dash-game-row">
                  <span className="dash-game-result win">Active</span>
                  <span className="dash-game-opp">Puzzle Training</span>
                  <span className="dash-game-opening">{stats.puzzlesSolved} solved</span>
                  <span className="dash-game-moves">{progress.total_attempts} attempts</span>
                  <span className="dash-game-date">Last: {progress.last_attempt_date ? new Date(progress.last_attempt_date).toLocaleDateString() : 'Today'}</span>
                </div>
              </>
            ) : (
              <div className="dash-games-empty">
                <p>No recent activity. Start solving puzzles to track your progress!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="dash-card dash-rec-card">
          <div className="dash-card-header">
            <h3>Recommended For You</h3>
          </div>
          <div className="dash-rec-list">
            {RECOMMENDATIONS.map((rec, i) => (
              <Link key={i} to="/train/tactics" className="dash-rec-item">
                <span className="dash-rec-icon">{rec.icon}</span>
                <div className="dash-rec-info">
                  <div className="dash-rec-title">{rec.title}</div>
                  <div className="dash-rec-meta">{rec.type} · {rec.difficulty}</div>
                </div>
                <ChevronRight size={16} className="dash-rec-arrow" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
