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
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4a574\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}} >
      <div className="w-full max-w-md">

        <div className="text-center mb-8 relative">
          <div className="flex justify-center items-center gap-2 mb-6">
            <div className="w-12 h-px bg-amber-900 opacity-40"></div>
            <div className="w-2 h-2 bg-amber-900 rounded-full"></div>
            <div className="w-2 h-2 bg-amber-900 rounded-full"></div>
            <div className="w-2 h-2 bg-amber-900 rounded-full"></div>
            <div className="w-12 h-px bg-amber-900 opacity-40"></div>
          </div>
        </div>

        <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm shadow-2xl p-12 border-4 border-amber-900 border-opacity-20">

          <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-amber-800 opacity-30"></div>
          <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-amber-800 opacity-30"></div>
          <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-amber-800 opacity-30"></div>
          <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-amber-800 opacity-30"></div>

          {/* Title */}
          <div className="text-center mb-10">
            <div className="text-6xl mb-4" style={{letterSpacing: '0.2em', fontFamily: 'Georgia, serif', fontWeight: '400', color: '#3d2817'}}>
              Gia Phả
            </div>
            <h1 className="text-3xl font-light text-amber-900 mb-1" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.15em'}}>
              Quản Lý Gia Phả
            </h1>
            <p className="text-sm text-amber-700 font-light" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>
              Lịch Sử Gia Tộc
            </p>
          </div>

          <div className="flex justify-center items-center gap-3 mb-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900 opacity-30"></div>
            <div className="text-amber-800 opacity-40" style={{fontSize: '0.8rem'}}>※</div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900 opacity-30"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">

            <div>
              <label className="block text-sm text-amber-900 font-light mb-2">
                Tên đăng nhập
              </label>
              <input
                className="w-full border-2 border-amber-900 border-opacity-30 bg-white bg-opacity-70 px-4 py-3 focus:outline-none focus:border-amber-800"
                placeholder="Nhập tên đăng nhập"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm text-amber-900 font-light mb-2">
                Mật khẩu
              </label>
              <input
                className="w-full border-2 border-amber-900 border-opacity-30 bg-white bg-opacity-70 px-4 py-3 focus:outline-none focus:border-amber-800"
                type="password"
                placeholder="Nhập mật khẩu"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-900 text-amber-50 font-light transition hover:bg-amber-950 disabled:opacity-50 mt-8"
            >
              {loading ? 'Đang kết nối...' : 'Đăng nhập'}
            </button>

          </form>

          <div className="flex justify-center items-center gap-3 my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900 opacity-30"></div>
            <div className="text-amber-800 opacity-40" style={{fontSize: '0.8rem'}}>※</div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900 opacity-30"></div>
          </div>

          <p className="text-center text-xs text-amber-700 font-light">
            Tài khoản demo: admin / admin123
          </p>

        </div>

      </div>
    </div>
  )
}