import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'
import { cls } from '../components/ui'
export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.username || !form.password)
      return toast.error('Vui lòng nhập đầy đủ thông tin')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', form)
      login(data.user, data.token)
      toast.success('Đăng nhập thành công!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Sai tên đăng nhập hoặc mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🌳</div>
          <h1 className="text-2xl font-bold text-gray-800">Quản Lý Gia Phả</h1>
          <p className="text-gray-500 text-sm mt-1">Đăng nhập để tiếp tục</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Tên đăng nhập</label>
            <input className={cls.input} placeholder="Nhập tên đăng nhập"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
          </div>
          <div>
            <label className="label">Mật khẩu</label>
            <input className={cls.input} type="password" placeholder="Nhập mật khẩu"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>
          <button type="submit" disabled={loading}
            className="btn-primary w-full justify-center py-2.5 mt-2">
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6">
          Tài khoản mặc định: admin / admin123
        </p>
      </div>
    </div>
  )
}