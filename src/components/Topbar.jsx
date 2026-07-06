import { Flame, Bell, CircleUser } from 'lucide-react'
import './Topbar.css'

export default function Topbar({ title, subtitle }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{title}</h1>
        {subtitle && <span className="topbar-subtitle">{subtitle}</span>}
      </div>
      <div className="topbar-right">
        {/* Streak */}
        <div className="topbar-badge streak" title="Daily streak">
          <Flame size={16} />
          <span>7</span>
        </div>
        {/* Rating */}
        <div className="topbar-badge rating" title="Your rating">
          <span className="topbar-knight">♞</span>
          <span>1,620</span>
        </div>
        {/* Notifications */}
        <button className="topbar-icon-btn" title="Notifications">
          <Bell size={18} />
          <span className="topbar-notif-dot" />
        </button>
        {/* Avatar */}
        <button className="topbar-icon-btn topbar-avatar-btn" title="Profile">
          <CircleUser size={22} />
        </button>
      </div>
    </header>
  )
}
