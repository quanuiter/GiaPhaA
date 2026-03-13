import { useAuthStore } from '../store/authStore'
import { useNavigate }  from 'react-router-dom'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <header className="bg-gradient-to-b from-amber-100 to-amber-50 border-b-2 border-amber-900 border-opacity-20 px-6 py-4 flex items-center justify-between shadow-sm">
      <h1 className="text-lg font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>
        Quản Lý Gia Phả
      </h1>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-sm text-amber-900 font-light" style={{fontFamily: 'Georgia, serif'}}>
          <span>•</span>
          <span>{user?.username}</span>
        </div>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="text-sm text-amber-900 hover:bg-amber-200 px-4 py-2 font-light transition-colors border border-amber-900 border-opacity-30 hover:border-opacity-50"
          style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
          Đăng xuất
        </button>
      </div>
    </header>
  )
}
