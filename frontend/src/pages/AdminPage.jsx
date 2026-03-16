import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { treeApi } from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function AdminPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({ username: '', role: 'editor' })
  const [submitting, setSubmitting] = useState(false)
  const currentTree = useAuthStore(s => s.currentTree)
  const queryClient = useQueryClient()
  const treeId = currentTree?.id

  const { data: treeUsers = [], isLoading, refetch } = useQuery({
    queryKey: ['treeUsers', treeId],
    queryFn: () => treeApi(treeId).treeUsers().then(r => r.data),
    enabled: !!treeId
  })

  const roleLabel = { admin: 'Quản trị viên', editor: 'Biên tập viên', viewer: 'Khách' }
  const roleOptions = ['admin', 'editor', 'viewer']

  const filteredUsers = treeUsers.filter(u => 
    u.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRoleChange = async (userId, newRole) => {
    try {
      await treeApi(treeId).updateUserRole(userId, newRole)
      refetch()
      queryClient.invalidateQueries({ queryKey: ['treeUsers', treeId] })
    } catch (err) {
      alert('Lỗi cập nhật quyền: ' + err.response?.data?.message || err.message)
    }
  }

  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Xác nhận xóa người dùng này khỏi cây gia phả?')) return
    try {
      await treeApi(treeId).removeTreeUser(userId)
      refetch()
      queryClient.invalidateQueries({ queryKey: ['treeUsers', treeId] })
    } catch (err) {
      alert('Lỗi xóa người dùng: ' + err.response?.data?.message || err.message)
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    if (!formData.username.trim()) {
      alert('Vui lòng nhập tên đăng nhập')
      return
    }

    setSubmitting(true)
    try {
      await treeApi(treeId).addTreeUser({ username: formData.username.trim(), role: formData.role })
      refetch()
      queryClient.invalidateQueries({ queryKey: ['treeUsers', treeId] })
      setFormData({ username: '', role: 'editor' })
      setShowAddForm(false)
    } catch (err) {
      alert('Lỗi thêm người dùng: ' + err.response?.data?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>Quản Lý Quyền Hạn</h2>
        <p className="text-amber-700 text-sm font-light mt-1" style={{fontFamily: 'Georgia, serif'}}>Cấp quyền truy cập cho thành viên dòng họ</p>
      </div>

      {/* Decorative divider */}
      <div className="flex justify-center items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900 opacity-30"></div>
        <div className="text-amber-800 opacity-40" style={{fontSize: '0.8rem'}}>※</div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900 opacity-30"></div>
      </div>

      {/* Search Bar and Add Button */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border-2 border-amber-200 rounded-sm text-sm focus:outline-none focus:border-amber-900 font-light"
          style={{fontFamily: 'Georgia, serif'}}
        />
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-amber-900 text-white text-sm font-light hover:bg-amber-800 transition-colors rounded-sm"
          style={{fontFamily: 'Georgia, serif'}}
        >
          + Thêm người dùng
        </button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <form onSubmit={handleAddUser} className="bg-amber-50 border-2 border-amber-200 p-6 rounded-sm space-y-4">
          <h3 className="text-lg font-light text-amber-950" style={{fontFamily: 'Georgia, serif'}}>Thêm người dùng mới</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif'}}>Tên đăng nhập *</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Nhập tên đăng nhập"
                className="w-full px-3 py-2 border border-amber-200 rounded-sm text-sm focus:outline-none focus:border-amber-900"
                style={{fontFamily: 'Georgia, serif'}}
              />
              <p className="text-xs text-amber-600 mt-1 font-light" style={{fontFamily: 'Georgia, serif'}}>Người dùng phải tồn tại trong hệ thống</p>
            </div>

            <div>
              <label className="block text-sm font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif'}}>Quyền hạn *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-3 py-2 border border-amber-200 rounded-sm text-sm focus:outline-none focus:border-amber-900 bg-white"
                style={{fontFamily: 'Georgia, serif'}}
              >
                <option value="admin">Quản trị viên</option>
                <option value="editor">Biên tập viên</option>
                <option value="viewer">Khách</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-amber-900 text-white text-sm font-light hover:bg-amber-800 disabled:opacity-50 transition-colors rounded-sm"
              style={{fontFamily: 'Georgia, serif'}}
            >
              {submitting ? 'Đang thêm...' : 'Thêm người dùng'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setFormData({ username: '', role: 'editor' })
              }}
              className="px-4 py-2 border border-amber-900 text-amber-900 text-sm font-light hover:bg-amber-50 transition-colors rounded-sm"
              style={{fontFamily: 'Georgia, serif'}}
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Users Table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900 opacity-40" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-amber-100 border-b-2 border-amber-900 border-opacity-20">
                <th className="px-4 py-3 text-left text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
                  Tên đăng nhập
                </th>
                <th className="px-4 py-3 text-left text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
                  Email
                </th>
                <th className="px-4 py-3 text-left text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
                  Quyền hạn hiện tại
                </th>
                <th className="px-4 py-3 text-left text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
                  Thay đổi quyền hạn
                </th>
                <th className="px-4 py-3 text-left text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((tu, idx) => (
                <tr key={tu.id} className={`border-b border-amber-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-amber-50'} hover:bg-amber-100 transition-colors`}>
                  <td className="px-4 py-3 text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif'}}>
                    {tu.user?.username}
                  </td>
                  <td className="px-4 py-3 text-sm font-light text-amber-800" style={{fontFamily: 'Georgia, serif'}}>
                    {tu.user?.email}
                  </td>
                  <td className="px-4 py-3 text-sm font-light text-amber-900" style={{fontFamily: 'Georgia, serif'}}>
                    <span className="inline-block px-3 py-1 bg-amber-200 text-amber-900 text-xs rounded-sm">
                      {roleLabel[tu.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <select
                      value={tu.role}
                      onChange={(e) => handleRoleChange(tu.userId, e.target.value)}
                      className="px-3 py-1.5 border border-amber-200 rounded-sm text-sm focus:outline-none focus:border-amber-900 bg-white font-light"
                      style={{fontFamily: 'Georgia, serif'}}
                    >
                      {roleOptions.map(role => (
                        <option key={role} value={role}>
                          {roleLabel[role]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleRemoveUser(tu.userId)}
                      className="px-2 py-1 text-red-600 hover:bg-red-100 transition-colors text-xs border border-red-200 rounded-sm"
                      style={{fontFamily: 'Georgia, serif'}}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-16 text-amber-700 font-light" style={{fontFamily: 'Georgia, serif'}}>
              {treeUsers.length === 0 ? 'Chưa có người dùng nào' : 'Không tìm thấy người dùng phù hợp'}
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-sm">
        <p className="text-sm font-light text-amber-900" style={{fontFamily: 'Georgia, serif'}}>
          <span className="font-medium">Hướng dẫn quyền hạn:</span> 
          <br/>• <span className="font-medium">Quản trị viên:</span> Có toàn bộ quyền truy cập và quản lý
          <br/>• <span className="font-medium">Biên tập viên:</span> Có thể thêm, sửa, xóa dữ liệu
          <br/>• <span className="font-medium">Khách:</span> Chỉ có th�� xem dữ liệu
        </p>
      </div>
    </div>
  )
}
