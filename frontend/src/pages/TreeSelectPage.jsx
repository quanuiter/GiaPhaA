import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

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
    admin:  'bg-amber-200 text-amber-900',
    editor: 'bg-amber-100 text-amber-800',
    viewer: 'bg-amber-50 text-amber-700'
  }
  const roleLabel = { admin: 'Quản trị viên', editor: 'Biên tập viên', viewer: 'Khách' }

  return (
    <div className="min-h-screen bg-amber-50 p-6" style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d4a574\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'}}>
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-light text-amber-900 mb-1" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.15em'}}>
              GIA PHẢ
            </h1>
            <p className="text-amber-700 text-sm font-light" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>
              Xin chào, <span className="font-medium">{user?.username}</span>
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="px-6 py-2.5 bg-amber-900 text-amber-50 font-light transition hover:bg-amber-950"
            style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}
          >
            Đăng xuất
          </button>
        </div>

        {/* Decorative divider */}
        <div className="flex justify-center items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900 opacity-30"></div>
          <div className="text-amber-800 opacity-40" style={{fontSize: '0.8rem'}}>※</div>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900 opacity-30"></div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-light text-amber-900 mb-1" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>
              Các Cây Gia Phả Của Bạn
            </h2>
            <p className="text-amber-700 text-sm font-light" style={{fontFamily: 'Georgia, serif'}}>
              Chọn cây để quản lý hoặc tạo mới
            </p>
          </div>
          <button 
            onClick={() => setShowCreate(true)}
            className="px-8 py-3 bg-amber-900 text-amber-50 font-light transition hover:bg-amber-950"
            style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}
          >
            Tạo Cây Mới
          </button>
        </div>

        {/* Danh sách cây */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-900 opacity-40"/>
          </div>
        ) : trees.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-amber-900 text-2xl font-light mb-2" style={{fontFamily: 'Georgia, serif'}}>Bạn chưa có cây gia phả nào</p>
            <p className="text-amber-700 text-sm font-light mb-8" style={{fontFamily: 'Georgia, serif'}}>Hãy tạo cây đầu tiên để bắt đầu</p>
            <button 
              onClick={() => setShowCreate(true)}
              className="px-8 py-3 bg-amber-900 text-amber-50 font-light transition hover:bg-amber-950"
              style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}
            >
              Tạo Cây Gia Phả
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trees.map(tree => (
              <div key={tree.id} className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm shadow-xl p-8 border-2 border-amber-900 border-opacity-20" style={{boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
                {/* Corner decorations */}
                <div className="absolute top-2 left-2 w-6 h-6 border-t border-l border-amber-800 opacity-30"></div>
                <div className="absolute top-2 right-2 w-6 h-6 border-t border-r border-amber-800 opacity-30"></div>
                <div className="absolute bottom-2 left-2 w-6 h-6 border-b border-l border-amber-800 opacity-30"></div>
                <div className="absolute bottom-2 right-2 w-6 h-6 border-b border-r border-amber-800 opacity-30"></div>

                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-light text-amber-950 text-xl" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.08em'}}>{tree.name}</h3>
                    {tree.description && (
                      <p className="text-amber-700 text-sm mt-2 font-light line-clamp-2" style={{fontFamily: 'Georgia, serif'}}>{tree.description}</p>
                    )}
                  </div>
                  <span className={`text-xs font-light px-3 py-1.5 rounded-sm ml-3 flex-shrink-0 ${roleColor[tree.myRole]}`} style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
                    {roleLabel[tree.myRole]}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-amber-700 mb-6 font-light">
                  <div>
                    • <span style={{fontFamily: 'Georgia, serif'}}>{tree.memberCount} thành viên</span>
                  </div>
                  <div className={tree.status === 'active' ? 'text-amber-800' : 'text-amber-600'}>
                    • <span style={{fontFamily: 'Georgia, serif'}}>{tree.status === 'active' ? 'Đang hoạt động' : 'Tạm đóng'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleSelectTree(tree)}
                    className="flex-1 py-2.5 bg-amber-900 text-amber-50 font-light transition hover:bg-amber-950"
                    style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}
                  >
                    Vào quản lý
                  </button>
                  {tree.myRole === 'admin' && (
                    <button
                      onClick={() => confirm(`Xóa cây "${tree.name}"? Toàn bộ dữ liệu sẽ mất!`) && deleteMutation.mutate(tree.id)}
                      className="px-4 py-2.5 text-amber-900 hover:bg-amber-200 bg-amber-100 transition font-light"
                      style={{fontFamily: 'Georgia, serif'}}
                      title="Xóa"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal tạo cây */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm shadow-2xl w-full max-w-md p-10 border-3 border-amber-900 border-opacity-20" style={{boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
            {/* Corner decorations */}
            <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-amber-800 opacity-30"></div>
            <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-amber-800 opacity-30"></div>
            <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-amber-800 opacity-30"></div>
            <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-amber-800 opacity-30"></div>

            <h3 className="text-2xl font-light text-amber-900 mb-6" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>
              Tạo Cây Gia Phả Mới
            </h3>

            {/* Decorative divider */}
            <div className="flex justify-center items-center gap-2 mb-6">
              <div className="flex-1 h-px bg-amber-900 opacity-20"></div>
              <div className="text-amber-800 opacity-30" style={{fontSize: '0.7rem'}}>※</div>
              <div className="flex-1 h-px bg-amber-900 opacity-20"></div>
            </div>

            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-sm text-amber-900 font-light mb-2" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
                  Tên cây <span className="text-amber-800">*</span>
                </label>
                <input
                  className="w-full border-2 border-amber-900 border-opacity-30 bg-white bg-opacity-70 px-4 py-2.5 focus:outline-none focus:border-amber-800 text-amber-950 placeholder-amber-700 placeholder-opacity-50 transition"
                  style={{fontFamily: 'Georgia, serif'}}
                  placeholder="Ví dụ: Gia Phả Họ Nguyễn"
                  maxLength={200}
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm text-amber-900 font-light mb-2" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
                  Mô tả
                </label>
                <textarea
                  className="w-full border-2 border-amber-900 border-opacity-30 bg-white bg-opacity-70 px-4 py-2.5 focus:outline-none focus:border-amber-800 text-amber-950 placeholder-amber-700 placeholder-opacity-50 transition resize-none h-20"
                  style={{fontFamily: 'Georgia, serif'}}
                  placeholder="Dòng họ, quê quán..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>

            {/* Decorative divider */}
            <div className="flex justify-center items-center gap-2 mb-6">
              <div className="flex-1 h-px bg-amber-900 opacity-20"></div>
              <div className="text-amber-800 opacity-30" style={{fontSize: '0.7rem'}}>※</div>
              <div className="flex-1 h-px bg-amber-900 opacity-20"></div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 border-2 border-amber-900 border-opacity-30 text-amber-900 hover:bg-amber-100 font-light transition"
                style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}
              >
                Hủy
              </button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.name.trim() || createMutation.isPending}
                className="flex-1 py-2.5 bg-amber-900 text-amber-50 font-light transition hover:bg-amber-950 disabled:opacity-50"
                style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}
              >
                {createMutation.isPending ? 'Đang tạo...' : 'Tạo cây'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
