import { useAuthStore } from '../store/authStore'
import { useNavigate }  from 'react-router-dom'
import { LogOut, User } from 'lucide-react'

export default function Navbar() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between shadow-sm">
      <h1 className="text-base font-semibold text-gray-700">🌳 Quản Lý Gia Phả</h1>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User size={15}/>
          <span className="font-medium">{user?.username}</span>
        </div>
        <button
          onClick={() => { logout(); navigate('/login') }}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50">
          <LogOut size={15}/> Đăng xuất
        </button>
      </div>
    </header>
  )
}