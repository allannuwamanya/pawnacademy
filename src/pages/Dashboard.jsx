import { TrendingUp, Target, Trophy, Flame, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import './Dashboard.css'

const STATS = [
  { label: 'Rating', value: '1,620', delta: '+32', deltaUp: true, icon: '♞' },
  { label: 'Puzzles Solved', value: '247', delta: '+12 today', deltaUp: true, Icon: Target },
  { label: 'Win Rate', value: '62%', delta: '+3%', deltaUp: true, Icon: Trophy },
  { label: 'Daily Streak', value: '7 days', delta: '🔥', deltaUp: true, Icon: Flame },
]

const RATING_DATA = [
  { day: 'Jun 1', rating: 1520 },
  { day: 'Jun 5', rating: 1535 },
  { day: 'Jun 9', rating: 1510 },
  { day: 'Jun 13', rating: 1560 },
  { day: 'Jun 17', rating: 1545 },
  { day: 'Jun 21', rating: 1580 },
  { day: 'Jun 25', rating: 1610 },
  { day: 'Jun 29', rating: 1595 },
  { day: 'Jul 3', rating: 1620 },
]

const RECENT_GAMES = [
  { opponent: 'Engine (1400)', result: 'Won', resultClass: 'win', moves: 34, opening: 'Sicilian Defense', date: 'Today' },
  { opponent: 'Engine (1600)', result: 'Lost', resultClass: 'loss', moves: 42, opening: 'Ruy Lopez', date: 'Today' },
  { opponent: 'Engine (1200)', result: 'Won', resultClass: 'win', moves: 28, opening: "Queen's Gambit", date: 'Yesterday' },
  { opponent: 'Engine (1500)', result: 'Draw', resultClass: 'draw', moves: 51, opening: 'Italian Game', date: 'Yesterday' },
  { opponent: 'Engine (1800)', result: 'Lost', resultClass: 'loss', moves: 37, opening: 'King\'s Indian', date: '2 days ago' },
]

const DAILY_PUZZLE = {
  title: 'Tactic of the Day',
  subtitle: 'White to move — find the fork!',
  difficulty: '★★★☆☆',
  theme: 'Knight Fork',
}

const RECOMMENDATIONS = [
  { title: 'Master the Pin', type: 'Tactics', difficulty: 'Intermediate', icon: '♟' },
  { title: 'Ruy Lopez: Morphy Defense', type: 'Opening', difficulty: 'Advanced', icon: '♝' },
  { title: 'King & Pawn vs King', type: 'Endgame', difficulty: 'Beginner', icon: '♚' },
]

export default function Dashboard() {
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
            <h3>Rating Progress</h3>
            <span className="dash-card-label">Last 30 days</span>
          </div>
          <div className="dash-chart">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={RATING_DATA}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f0c040" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f0c040" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#555', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip
                  contentStyle={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, fontSize: 13 }}
                  labelStyle={{ color: '#888' }}
                  itemStyle={{ color: '#f0c040' }}
                />
                <Area type="monotone" dataKey="rating" stroke="#f0c040" strokeWidth={2} fill="url(#goldGradient)" dot={false} activeDot={{ r: 4, fill: '#f0c040' }} />
              </AreaChart>
            </ResponsiveContainer>
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
                Solve Puzzle <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="dash-row">
        {/* Recent games */}
        <div className="dash-card dash-games-card">
          <div className="dash-card-header">
            <h3>Recent Games</h3>
            <Link to="/analyze" className="dash-card-link">View All</Link>
          </div>
          <div className="dash-games-list">
            {RECENT_GAMES.map((game, i) => (
              <div key={i} className="dash-game-row">
                <span className={`dash-game-result ${game.resultClass}`}>{game.result}</span>
                <span className="dash-game-opp">{game.opponent}</span>
                <span className="dash-game-opening">{game.opening}</span>
                <span className="dash-game-moves">{game.moves} moves</span>
                <span className="dash-game-date">{game.date}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="dash-card dash-rec-card">
          <div className="dash-card-header">
            <h3>Recommended For You</h3>
          </div>
          <div className="dash-rec-list">
            {RECOMMENDATIONS.map((rec, i) => (
              <div key={i} className="dash-rec-item">
                <span className="dash-rec-icon">{rec.icon}</span>
                <div className="dash-rec-info">
                  <div className="dash-rec-title">{rec.title}</div>
                  <div className="dash-rec-meta">{rec.type} · {rec.difficulty}</div>
                </div>
                <ChevronRight size={16} className="dash-rec-arrow" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
