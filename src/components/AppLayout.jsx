import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import './AppLayout.css'

export default function AppLayout({ title, subtitle }) {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  
  const hideTopbar = location.pathname.startsWith('/play')

  return (
    <div className={`app-layout ${collapsed ? 'sidebar-collapsed' : ''} ${hideTopbar ? 'hide-topbar' : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="app-main">
        {!hideTopbar && <Topbar title={title} subtitle={subtitle} />}
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
