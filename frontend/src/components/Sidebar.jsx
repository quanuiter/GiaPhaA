import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, GitBranch, CalendarDays, ChevronLeft } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tổng quan' },
  { to: '/members',   icon: Users,           label: 'Thành viên' },
  { to: '/tree',      icon: GitBranch,       label: 'Phả đồ'    },
  { to: '/events',    icon: CalendarDays,    label: 'Sự kiện'   },
]

export default function Sidebar() {
  const { currentTree, clearTree } = useAuthStore()
  const navigate = useNavigate()

  const handleSwitchTree = () => { clearTree(); navigate('/trees') }

  return (
    <aside className="w-56 bg-blue-900 text-white flex flex-col shadow-xl">
      {/* Tree info */}
      <div className="p-4 border-b border-blue-700">
        <p className="text-xs text-blue-400 uppercase tracking-widest mb-1">Cây đang quản lý</p>
        <p className="font-bold text-sm leading-tight line-clamp-2">{currentTree?.name}</p>
        <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full
          ${currentTree?.myRole === 'admin' ? 'bg-red-900 text-red-200' :
            currentTree?.myRole === 'editor' ? 'bg-blue-700 text-blue-200' : 'bg-gray-700 text-gray-300'}`}>
          {currentTree?.myRole === 'admin' ? '👑 Admin' :
           currentTree?.myRole === 'editor' ? '✏️ Editor' : '👁 Viewer'}
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
               ${isActive ? 'bg-white text-blue-900 shadow-sm' : 'text-blue-100 hover:bg-blue-700'}`
            }>
            <Icon size={18}/> {label}
          </NavLink>
        ))}
      </nav>

      {/* Đổi cây */}
      <div className="p-3 border-t border-blue-700">
        <button onClick={handleSwitchTree}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-blue-200 hover:bg-blue-700 transition-all">
          <ChevronLeft size={18}/> Đổi cây khác
        </button>
      </div>
    </aside>
  )
}