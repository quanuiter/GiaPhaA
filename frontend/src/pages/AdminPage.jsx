import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({ username: '', role: 'editor' })
  const [submitting, setSubmitting] = useState(false)
  
  // State cho phần Phê duyệt yêu cầu
  const [selectedUserForApproval, setSelectedUserForApproval] = useState(null)
  const [approvalRole, setApprovalRole] = useState('viewer')
  
  const { currentTree, user } = useAuthStore()
  const queryClient = useQueryClient()
  const treeId = currentTree?.id

  // 1. Lấy danh sách thành viên hiện tại của cây
  const { data: allUsers = [], isLoading, refetch } = useQuery({
    queryKey: ['treeUsers', treeId],
    queryFn: async () => {
      // Gọi trực tiếp API lấy chi tiết cây, sau đó trích xuất mảng userAccess
      const res = await api.get(`/trees/${treeId}`);
      return res.data.userAccess || [];
    },
    enabled: !!treeId
  })
  
  // Lọc bỏ những người đang chờ duyệt (pending) ra khỏi tab Quản lý người dùng
  const treeUsers = Array.isArray(allUsers) ? allUsers.filter(u => u.role !== 'pending') : [];

  // 2. Lấy danh sách yêu cầu xin gia nhập
  const { data: pendingUsers = [], isLoading: pendingLoading, refetch: refetchPending } = useQuery({
    queryKey: ['pendingRequests', treeId],
    queryFn: async () => {
      const res = await api.get(`/trees/${treeId}/pending-requests`);
      return res.data || [];
    },
    enabled: !!treeId,
    refetchInterval: 5000 // Tự động làm mới mỗi 5 giây
  })

  const roleLabel = { admin: 'Quản trị viên', editor: 'Biên tập viên', viewer: 'Khách' }
  const roleOptions = ['admin', 'editor', 'viewer']

  const filteredUsers = treeUsers.filter(u => 
    u.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // ==========================================
  // CÁC HÀM XỬ LÝ API (Sử dụng api.post/delete trực tiếp để tránh lỗi)
  // ==========================================

  const handleRoleChange = async (username, newRole) => {
    try {
      // Backend yêu cầu { username, role }
      await api.post(`/trees/${treeId}/users`, { username, role: newRole });
      refetch()
      toast.success('Cập nhật quyền thành công')
    } catch (err) {
      toast.error('Lỗi cập nhật quyền: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleRemoveUser = async (userId) => {
    if (!window.confirm('Xác nhận xóa người dùng này khỏi cây gia phả?')) return
    try {
      await api.delete(`/trees/${treeId}/users/${userId}`);
      refetch()
      toast.success('Đã xóa người dùng khỏi cây')
    } catch (err) {
      toast.error('Lỗi xóa người dùng: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    if (!formData.username.trim()) return toast.error('Vui lòng nhập tên đăng nhập')

    setSubmitting(true)
    try {
      await api.post(`/trees/${treeId}/users`, { username: formData.username.trim(), role: formData.role });
      refetch()
      setFormData({ username: '', role: 'editor' })
      setShowAddForm(false)
      toast.success('Thêm người dùng thành công')
    } catch (err) {
      toast.error('Lỗi thêm người dùng: ' + (err.response?.data?.message || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  const handleApproveUser = async (userId) => {
    try {
      await api.put(`/trees/${treeId}/requests/${userId}/approve`, { role: approvalRole });
      toast.success('Đã phê duyệt thành viên vào gia phả!')
      
      // Xóa cache ép tải lại cả 2 danh sách
      queryClient.invalidateQueries({ queryKey: ['treeUsers', treeId] })
      queryClient.invalidateQueries({ queryKey: ['pendingRequests', treeId] })
      
      setSelectedUserForApproval(null)
      setApprovalRole('viewer')
    } catch (err) {
      toast.error('Lỗi: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleRejectUser = async (userId) => {
    if (!window.confirm('Xác nhận từ chối yêu cầu tham gia này?')) return
    try {
      await api.delete(`/trees/${treeId}/requests/${userId}/reject`);
      toast.success('Đã từ chối yêu cầu')
      queryClient.invalidateQueries({ queryKey: ['pendingRequests', treeId] })
    } catch (err) {
      toast.error('Lỗi: ' + (err.response?.data?.message || err.message))
    }
  }

  // ==========================================
  // BẢO MẬT: CHẶN TRUY CẬP NẾU KHÔNG PHẢI ADMIN
  // ==========================================
  if (currentTree?.myRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
          <i className="fa-solid fa-lock text-2xl"></i>
        </div>
        <h2 className="text-3xl text-amber-950 font-light mb-2" style={{fontFamily: 'Georgia, serif'}}>Quyền truy cập bị từ chối</h2>
        <p className="text-amber-800">Chỉ Quản trị viên (Admin) của gia phả này mới có thể xem trang Quản lý quyền hạn.</p>
      </div>
    );
  }

  // ==========================================
  // GIAO DIỆN CHÍNH (Dành cho Admin)
  // ==========================================
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>Quản Lý Quyền Hạn</h2>
        <p className="text-amber-700 text-sm font-light mt-1" style={{fontFamily: 'Georgia, serif'}}>Cấp quyền truy cập cho thành viên trong gia phả: <strong>{currentTree?.name}</strong></p>
      </div>

      {/* Decorative divider */}
      <div className="flex justify-center items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900 opacity-30"></div>
        <div className="text-amber-800 opacity-40" style={{fontSize: '0.8rem'}}>※</div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900 opacity-30"></div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-amber-200">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 font-light text-sm border-b-2 transition-colors ${
            activeTab === 'users' ? 'border-amber-900 text-amber-950' : 'border-transparent text-amber-700 hover:text-amber-900'
          }`}
          style={{fontFamily: 'Georgia, serif'}}
        >
          Người dùng trong cây ({treeUsers.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-3 font-light text-sm border-b-2 transition-colors relative ${
            activeTab === 'pending' ? 'border-amber-900 text-amber-950' : 'border-transparent text-amber-700 hover:text-amber-900'
          }`}
          style={{fontFamily: 'Georgia, serif'}}
        >
          Yêu cầu tham gia ({pendingUsers.length})
          {pendingUsers.length > 0 && (
            <span className="absolute top-2 right-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
              {pendingUsers.length}
            </span>
          )}
        </button>
      </div>

      {/* Content Tab Users */}
      {activeTab === 'users' && (
        <>
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
                  <p className="text-xs text-amber-600 mt-1 font-light" style={{fontFamily: 'Georgia, serif'}}>Người dùng phải có tài khoản trong hệ thống</p>
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
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-amber-900 text-white text-sm font-light hover:bg-amber-800 disabled:opacity-50 transition-colors rounded-sm" style={{fontFamily: 'Georgia, serif'}}>
                  {submitting ? 'Đang thêm...' : 'Thêm người dùng'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 border border-amber-900 text-amber-900 text-sm font-light hover:bg-amber-50 transition-colors rounded-sm" style={{fontFamily: 'Georgia, serif'}}>
                  Hủy
                </button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900 opacity-40" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-amber-100 border-b-2 border-amber-900 border-opacity-20">
                    <th className="px-4 py-3 text-left text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif'}}>Tên đăng nhập</th>
                    <th className="px-4 py-3 text-left text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif'}}>Email</th>
                    <th className="px-4 py-3 text-left text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif'}}>Quyền hạn hiện tại</th>
                    <th className="px-4 py-3 text-left text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif'}}>Thay đổi quyền hạn</th>
                    <th className="px-4 py-3 text-left text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif'}}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((tu, idx) => (
                    <tr key={tu.id || tu.userId} className={`border-b border-amber-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-amber-50'} hover:bg-amber-100 transition-colors`}>
                      <td className="px-4 py-3 text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif'}}>{tu.user?.username}</td>
                      <td className="px-4 py-3 text-sm font-light text-amber-800" style={{fontFamily: 'Georgia, serif'}}>{tu.user?.email || 'Chưa cập nhật'}</td>
                      <td className="px-4 py-3 text-sm font-light text-amber-900" style={{fontFamily: 'Georgia, serif'}}>
                        <span className="inline-block px-3 py-1 bg-amber-200 text-amber-900 text-xs rounded-sm">{roleLabel[tu.role]}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <select
                          value={tu.role}
                          onChange={(e) => handleRoleChange(tu.user.username, e.target.value)}
                          className="px-3 py-1.5 border border-amber-200 rounded-sm text-sm focus:outline-none focus:border-amber-900 bg-white font-light"
                          style={{fontFamily: 'Georgia, serif'}}
                        >
                          {roleOptions.map(role => (<option key={role} value={role}>{roleLabel[role]}</option>))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {tu.userId !== user?.id && (
                          <button onClick={() => handleRemoveUser(tu.userId)} className="px-2 py-1 text-red-600 hover:bg-red-100 transition-colors text-xs border border-red-200 rounded-sm" style={{fontFamily: 'Georgia, serif'}}>Xóa</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-16 text-amber-700 font-light" style={{fontFamily: 'Georgia, serif'}}>
                  Không tìm thấy người dùng phù hợp.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Content Tab Pending */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          {pendingLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900 opacity-40" />
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-16 text-amber-700 font-light" style={{fontFamily: 'Georgia, serif'}}>
              Không có yêu cầu đăng ký nào đang chờ xét duyệt
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map(u => (
                <div key={u.userId || u.id} className="bg-amber-50 border-2 border-amber-200 p-4 rounded-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-amber-950" style={{fontFamily: 'Georgia, serif'}}>Tài khoản: {u.username}</h3>
                      <p className="text-xs text-amber-600 mt-1">Gửi yêu cầu lúc: {new Date(u.createdAt).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="flex gap-2">
                      {selectedUserForApproval === (u.userId || u.id) ? (
                        <button onClick={() => setSelectedUserForApproval(null)} className="px-3 py-1 text-gray-600 hover:bg-gray-200 transition-colors text-sm border border-gray-300 rounded-sm" style={{fontFamily: 'Georgia, serif'}}>Đóng</button>
                      ) : (
                        <>
                          <button onClick={() => setSelectedUserForApproval(u.userId || u.id)} className="px-3 py-1 bg-green-600 text-white hover:bg-green-700 transition-colors text-sm border border-green-700 rounded-sm" style={{fontFamily: 'Georgia, serif'}}>Phê duyệt</button>
                          <button onClick={() => handleRejectUser(u.userId || u.id)} className="px-3 py-1 bg-red-600 text-white hover:bg-red-700 transition-colors text-sm border border-red-700 rounded-sm" style={{fontFamily: 'Georgia, serif'}}>Từ chối</button>
                        </>
                      )}
                    </div>
                  </div>

                  {selectedUserForApproval === (u.userId || u.id) && (
                    <div className="bg-white p-4 rounded-sm border border-amber-200 mt-4 space-y-3">
                      <h4 className="font-light text-amber-950" style={{fontFamily: 'Georgia, serif'}}>Cấp quyền cho người dùng</h4>
                      <div className="max-w-xs">
                        <label className="block text-sm font-light text-amber-900 mb-1" style={{fontFamily: 'Georgia, serif'}}>Quyền hạn *</label>
                        <select
                          value={approvalRole}
                          onChange={(e) => setApprovalRole(e.target.value)}
                          className="w-full px-3 py-2 border border-amber-200 rounded-sm text-sm focus:outline-none focus:border-amber-900 bg-white"
                          style={{fontFamily: 'Georgia, serif'}}
                        >
                          <option value="viewer">Khách (chỉ xem)</option>
                          <option value="editor">Biên tập viên (chỉnh sửa)</option>
                          <option value="admin">Quản trị viên</option>
                        </select>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => handleApproveUser(u.userId || u.id)} className="px-4 py-2 bg-green-600 text-white text-sm font-light hover:bg-green-700 transition-colors rounded-sm" style={{fontFamily: 'Georgia, serif'}}>Xác nhận phê duyệt</button>
                        <button onClick={() => setSelectedUserForApproval(null)} className="px-4 py-2 border border-amber-900 text-amber-900 text-sm font-light hover:bg-amber-50 transition-colors rounded-sm" style={{fontFamily: 'Georgia, serif'}}>Hủy</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      {activeTab === 'users' && (
        <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-sm">
          <p className="text-sm font-light text-amber-900" style={{fontFamily: 'Georgia, serif'}}>
            <span className="font-medium">Hướng dẫn quyền hạn:</span> 
            <br/>• <span className="font-medium">Quản trị viên:</span> Có toàn bộ quyền truy cập và quản lý
            <br/>• <span className="font-medium">Biên tập viên:</span> Có thể thêm, sửa, xóa dữ liệu
            <br/>• <span className="font-medium">Khách:</span> Chỉ có thể xem dữ liệu
          </p>
        </div>
      )}
    </div>
  )
}