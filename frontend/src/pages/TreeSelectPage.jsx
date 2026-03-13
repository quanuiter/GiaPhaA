import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Plus, Trees, Users, LogOut, Trash2, ChevronRight } from 'lucide-react'

export default function TreeSelectPage() {
  const { user, logout, setCurrentTree } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  const { data: trees = [], isLoading } = useQuery({
    queryKey: ['trees'],
    queryFn: () => api.get('/trees').then(r => r.data)
  })

  const createMutation = useMutation({
    mutationFn: data => api.post('/trees', data),
    onSuccess: () => {
      qc.invalidateQueries(['trees'])
      toast.success('Đã tạo cây gia phả mới!')
      setShowCreate(false)
      setForm({ name: '', description: '' })
    },
    onError: err => toast.error(err.response?.data?.message || 'Lỗi tạo cây')
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/trees/${id}`),
    onSuccess: () => { qc.invalidateQueries(['trees']); toast.success('Đã xóa cây') },
    onError: err => toast.error(err.response?.data?.message || 'Lỗi xóa cây')
  })

  const handleSelectTree = (tree) => {
    setCurrentTree({ id: tree.id, name: tree.name, myRole: tree.myRole })
    navigate('/dashboard')
  }

  const handleLogout = () => { logout(); navigate('/login') }

  const roleColor = {
    admin:  'bg-red-100 text-red-700',
    editor: 'bg-blue-100 text-blue-700',
    viewer: 'bg-gray-100 text-gray-600'
  }
  const roleLabel = { admin: '👑 Admin', editor: '✏️ Biên tập viên', viewer: '👁 Khách' }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-blue-600">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🌳</span>
          <div>
            <h1 className="text-white font-bold text-lg">Quản Lý Gia Phả</h1>
            <p className="text-blue-200 text-xs">Xin chào, {user?.username}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 text-blue-200 hover:text-white text-sm transition-colors">
          <LogOut size={16}/> Đăng xuất
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Cây gia phả của bạn</h2>
            <p className="text-blue-200 text-sm mt-1">Chọn cây để quản lý hoặc tạo mới</p>
          </div>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-white text-blue-700 font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-50 transition-all shadow-lg">
            <Plus size={18}/> Tạo cây mới
          </button>
        </div>

        {/* Danh sách cây */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"/>
          </div>
        ) : trees.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🌱</div>
            <p className="text-white text-xl font-medium">Bạn chưa có cây gia phả nào</p>
            <p className="text-blue-200 text-sm mt-2 mb-6">Hãy tạo cây đầu tiên để bắt đầu</p>
            <button onClick={() => setShowCreate(true)}
              className="bg-white text-blue-700 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-all">
              <Plus className="inline mr-2" size={18}/>Tạo cây gia phả
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {trees.map(tree => (
              <div key={tree.id}
                className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-200">
                {/* Banner màu */}
                <div className="h-3 bg-gradient-to-r from-blue-500 to-purple-500"/>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 text-lg truncate">{tree.name}</h3>
                      {tree.description && (
                        <p className="text-gray-500 text-sm mt-0.5 line-clamp-2">{tree.description}</p>
                      )}
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ml-3 flex-shrink-0 ${roleColor[tree.myRole]}`}>
                      {roleLabel[tree.myRole]}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Users size={14}/> {tree.memberCount} thành viên
                    </span>
                    <span className={`flex items-center gap-1.5 ${tree.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tree.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}/>
                      {tree.status === 'active' ? 'Đang hoạt động' : 'Tạm đóng'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleSelectTree(tree)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                      Vào quản lý <ChevronRight size={16}/>
                    </button>
                    {tree.myRole === 'admin' && (
                      <button
                        onClick={() => confirm(`Xóa cây "${tree.name}"? Toàn bộ dữ liệu sẽ mất!`) && deleteMutation.mutate(tree.id)}
                        className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 size={16}/>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal tạo cây */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-5">🌱 Tạo cây gia phả mới</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên cây *</label>
                <input
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Ví dụ: Gia Phả Họ Nguyễn"
                  maxLength={200}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm h-24 resize-none"
                  placeholder="Dòng họ, quê quán..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition-colors">
                Hủy
              </button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.name.trim() || createMutation.isPending}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo cây'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}