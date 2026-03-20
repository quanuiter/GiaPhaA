import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const navItems = [
  { to: '/dashboard', label: 'Tổng quan' },
  { to: '/tree',      label: 'Phả đồ' },
  { to: '/members',   label: 'Thành viên' },
  { to: '/events',    label: 'Sự kiện' },
  { to: '/reports',   label: 'Báo cáo' },
  { to: '/export',    label: 'Xuất dữ liệu' },
  { to: '/admin',     label: 'Quản lý quyền hạn', admin: true },
]

const roleLabel = { admin: 'Quản trị viên', editor: 'Biên tập viên', viewer: 'Khách' }

export default function Sidebar() {
  const { currentTree, clearTree } = useAuthStore()
  const navigate = useNavigate()

  const handleSwitchTree = () => { clearTree(); navigate('/trees') }

  return (
    <aside className="w-56 bg-gradient-to-b from-amber-100 to-amber-50 flex flex-col shadow-xl border-r-4 border-amber-900 border-opacity-20">
      {/* Tree info */}
      <div className="p-5 border-b-2 border-amber-900 border-opacity-20">
        <p className="text-xs text-amber-800 font-light mb-2" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>Cây Đang Quản Lý</p>
        <p className="font-light text-sm leading-tight line-clamp-2 text-amber-950" style={{fontFamily: 'Georgia, serif'}}>{currentTree?.name}</p>
        <span className="text-xs mt-2 inline-block px-3 py-1 bg-amber-200 text-amber-900 font-light" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
          {roleLabel[currentTree?.myRole]}
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(({ to, label, admin }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center px-4 py-2.5 text-sm font-light transition-all ${isActive 
                ? 'bg-amber-900 text-amber-50 border-l-2 border-amber-900' 
                : 'text-amber-900 hover:bg-amber-200 hover:bg-opacity-50'} ${admin ? 'border-t border-amber-200 mt-2 pt-2' : ''}`
            }
            style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
            • {label}
          </NavLink>
        ))}
      </nav>

      {/* Decorative divider */}
      <div className="px-4 py-2 flex justify-center">
        <div className="text-amber-800 opacity-40" style={{fontSize: '0.7rem'}}>※</div>
      </div>

      {/* Đổi cây */}
      <div className="p-4 border-t-2 border-amber-900 border-opacity-20">
        <button onClick={handleSwitchTree}
          className="w-full px-4 py-2.5 text-sm text-amber-900 border-2 border-amber-900 border-opacity-30 hover:bg-amber-200 font-light transition-all"
          style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
          ← Đổi cây khác
        </button>
      </div>
    </aside>
  )
}
