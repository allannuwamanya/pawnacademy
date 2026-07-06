import { NavLink, Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Swords,
  ScanLine,
  TrendingUp,
  SlidersHorizontal,
  Crown,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  GitBranch,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import './Sidebar.css'

const NAV_SECTIONS = [
  {
    label: 'TRAIN',
    items: [
      { to: '/train/tactics', icon: '♟', label: 'Tactics Trainer', useChessIcon: true },
      { to: '/train/openings', icon: GitBranch, label: 'Opening Explorer' },
      { to: '/train/endgames', icon: BookOpen, label: 'Endgame Studies' },
    ],
  },
  {
    label: 'PLAY',
    items: [
      { to: '/play', icon: Swords, label: 'Play vs Engine' },
      { to: '/analyze', icon: ScanLine, label: 'Analyze a Game' },
    ],
  },
]

const BOTTOM_ITEMS = [
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/settings', icon: SlidersHorizontal, label: 'Settings' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth()

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div className="sidebar-header">
        <Link to="/dashboard" className="sidebar-logo">
          <span className="sidebar-logo-icon">♞</span>
          {!collapsed && <span className="sidebar-logo-text">Pawn Academy</span>}
        </Link>
        <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Main nav */}
      <nav className="sidebar-nav">
        {/* Dashboard - top-level */}
        <NavLink to="/dashboard" className="sidebar-item" title="Dashboard">
          <LayoutDashboard size={20} />
          {!collapsed && <span>Dashboard</span>}
        </NavLink>

        {NAV_SECTIONS.map(section => (
          <div key={section.label} className="sidebar-section">
            {!collapsed && <div className="sidebar-section-label">{section.label}</div>}
            {section.items.map(item => (
              <NavLink key={item.to} to={item.to} className="sidebar-item" title={item.label}>
                {item.useChessIcon ? (
                  <span className="sidebar-chess-icon">{item.icon}</span>
                ) : (
                  <item.icon size={20} />
                )}
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="sidebar-bottom">
        {BOTTOM_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} className="sidebar-item" title={item.label}>
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}

        {/* Upgrade button (for free users) */}
        {!collapsed && (
          <Link to="/pricing" className="sidebar-upgrade">
            <Crown size={18} />
            <span>Go Pro</span>
          </Link>
        )}

        {/* User */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {user?.display_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'}
          </div>
          {!collapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.display_name || user?.email?.split('@')[0] || 'Player'}</div>
              <button className="sidebar-logout" onClick={logout}>
                <LogOut size={14} />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
