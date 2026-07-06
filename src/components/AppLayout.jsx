import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import './AppLayout.css'

export default function AppLayout({ title, subtitle }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="app-main">
        <Topbar title={title} subtitle={subtitle} />
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
