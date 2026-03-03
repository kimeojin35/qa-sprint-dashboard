import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, Settings, Bug } from 'lucide-react'
import { cn } from '@/lib/cn'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/stories', label: 'Stories', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="flex w-60 flex-col bg-sidebar-bg text-sidebar-text">
      <div className="flex items-center gap-2 px-5 py-5">
        <Bug className="h-6 w-6 text-sidebar-active" />
        <span className="text-lg font-bold text-white">QA Sprint</span>
      </div>
      <nav className="flex-1 px-3 py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-active/20 text-white'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-xs text-sidebar-text/60">QA Sprint Dashboard v0.1</p>
      </div>
    </aside>
  )
}
