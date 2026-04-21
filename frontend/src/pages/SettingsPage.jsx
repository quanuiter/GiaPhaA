/**
 * SettingsPage.jsx — Trang Thay đổi quy định (YC12 / QĐ10)
 *
 * Tab 1: Danh mục dữ liệu (QĐ10.1) — CRUD quê quán, nghề nghiệp, loại thành tích, v.v.
 * Tab 2: Tham số hệ thống (QĐ10.2) — Số đời hiển thị, dung lượng upload, cấm cận huyết, v.v.
 */
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { treeApi } from '../services/api'
import toast from 'react-hot-toast'

// ── Label map cho loại danh mục ──
const TYPE_LABELS = {
  hometown:          'Quê quán',
  occupation:        'Nghề nghiệp',
  marital_status:    'Trạng thái hôn nhân',
  achievement_type:  'Loại thành tích',
  achievement_level: 'Cấp độ thành tích',
  death_cause:       'Nguyên nhân mất',
  burial_place:      'Địa điểm mai táng',
}



// ══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('categories')
  const { currentTree } = useAuthStore()

  // Chỉ Admin hoặc Editor (Biên tập viên) được truy cập
  const canAccess = ['admin', 'editor'].includes(currentTree?.myRole)
  if (!canAccess) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>Thay Đổi Quy Định</h2>
          <p className="text-amber-700 text-sm font-light mt-1" style={{fontFamily: 'Georgia, serif'}}>Quản lý danh mục và tham số hệ thống</p>
        </div>
        <Divider />
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mb-4 text-xl font-light" style={{fontFamily: 'Georgia, serif'}}>✕</div>
          <h3 className="text-xl text-amber-950 font-light mb-2" style={{fontFamily: 'Georgia, serif'}}>Quyền truy cập bị từ chối</h3>
          <p className="text-amber-800 font-light text-sm" style={{fontFamily: 'Georgia, serif'}}>Chỉ Quản trị viên hoặc Biên tập viên mới có thể thay đổi quy định.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>Thay Đổi Quy Định</h2>
        <p className="text-amber-700 text-sm font-light mt-1" style={{fontFamily: 'Georgia, serif'}}>
          Quản lý danh mục dữ liệu và tham số hệ thống cho: <strong>{currentTree?.name}</strong>
        </p>
      </div>

      <Divider />

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-amber-200">
        <TabBtn active={activeTab === 'categories'} onClick={() => setActiveTab('categories')}>
          Danh Mục Dữ Liệu
        </TabBtn>
        <TabBtn active={activeTab === 'configs'} onClick={() => setActiveTab('configs')}>
          Tham Số Hệ Thống
        </TabBtn>
      </div>

      {/* Tab Content */}
      {activeTab === 'categories' && <CategoriesTab />}
      {activeTab === 'configs' && <ConfigsTab />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  TAB 1: DANH MỤC DỮ LIỆU (QĐ10.1)
// ══════════════════════════════════════════════════════════════
function CategoriesTab() {
  const { currentTree } = useAuthStore()
  const api = treeApi(currentTree?.id)
  const qc = useQueryClient()

  const [selectedType, setSelectedType] = useState('hometown')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({ value: '', label: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ value: '', label: '' })
  const [submitting, setSubmitting] = useState(false)

  // Lấy danh sách loại danh mục
  const { data: types = [] } = useQuery({
    queryKey: ['categoryTypes', currentTree?.id],
    queryFn: () => api.categoryTypes().then(r => r.data),
    enabled: !!currentTree?.id,
  })

  // Lấy danh mục theo loại đã chọn
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', currentTree?.id, selectedType],
    queryFn: () => api.categories(`?type=${selectedType}`).then(r => r.data),
    enabled: !!currentTree?.id && !!selectedType,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['categories', currentTree?.id, selectedType] })
    qc.invalidateQueries({ queryKey: ['categoryTypes', currentTree?.id] })
  }

  // Thêm mục mới
  const handleAdd = async (e) => {
    e.preventDefault()
    if (!addForm.value.trim() || !addForm.label.trim()) return toast.error('Vui lòng điền đầy đủ thông tin')
    setSubmitting(true)
    try {
      await api.createCategory({ type: selectedType, value: addForm.value.trim(), label: addForm.label.trim() })
      toast.success('Đã thêm mục mới')
      invalidate()
      setAddForm({ value: '', label: '' })
      setShowAddForm(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi thêm danh mục')
    } finally { setSubmitting(false) }
  }

  // Cập nhật mục
  const handleUpdate = async (cat) => {
    if (!editForm.label.trim()) return toast.error('Nhãn không được để trống')
    setSubmitting(true)
    try {
      await api.updateCategory(cat.id, { label: editForm.label.trim(), value: editForm.value.trim() })
      toast.success('Đã cập nhật')
      invalidate()
      setEditingId(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật')
    } finally { setSubmitting(false) }
  }

  // Bật/tắt mục
  const handleToggleActive = async (cat) => {
    try {
      await api.updateCategory(cat.id, { isActive: !cat.isActive })
      toast.success(cat.isActive ? 'Đã vô hiệu hóa' : 'Đã kích hoạt lại')
      invalidate()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật')
    }
  }

  // Xóa mục
  const handleDelete = async (cat) => {
    if (!window.confirm(`Xác nhận xóa "${cat.label}"?`)) return
    try {
      await api.deleteCategory(cat.id)
      toast.success('Đã xóa')
      invalidate()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xóa')
    }
  }

  // Khởi tạo danh mục mặc định
  const handleInit = async () => {
    try {
      const res = await api.initCategories({ type: selectedType })
      toast.success(res.data.message)
      invalidate()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khởi tạo')
    }
  }

  const activeCount = categories.filter(c => c.isActive !== false).length
  const isDefault = categories.length > 0 && categories[0]?.isDefault

  return (
    <div className="space-y-6">
      {/* Type Selector */}
      <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-sm">
        <label className="block text-sm font-light text-amber-900 mb-3" style={{fontFamily: 'Georgia, serif'}}>
          Chọn loại danh mục cần quản lý:
        </label>
        <div className="flex flex-wrap gap-2">
          {Object.entries(TYPE_LABELS).map(([type, label]) => {
            const typeInfo = types.find(t => t.type === type)
            return (
              <button
                key={type}
                onClick={() => { setSelectedType(type); setShowAddForm(false); setEditingId(null) }}
                className={`px-4 py-2 text-sm font-light rounded-sm transition-all border ${
                  selectedType === type
                    ? 'bg-amber-900 text-amber-50 border-amber-900'
                    : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-100'
                }`}
                style={{fontFamily: 'Georgia, serif'}}
              >
                {label}
                {typeInfo && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                    selectedType === type ? 'bg-amber-800' : 'bg-amber-200'
                  }`}>
                    {typeInfo.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Category List */}
      <div className="bg-white border-2 border-amber-200 rounded-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-amber-50 border-b-2 border-amber-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-light text-amber-950" style={{fontFamily: 'Georgia, serif'}}>
              {TYPE_LABELS[selectedType]}
            </h3>
            <p className="text-xs text-amber-700 font-light mt-1" style={{fontFamily: 'Georgia, serif'}}>
              {isDefault ? 'Đang dùng danh mục mặc định. Nhấn "Tùy chỉnh" để tạo riêng cho cây này.' : `${activeCount} mục đang hoạt động · Tối thiểu 2 mục`}
            </p>
          </div>
          <div className="flex gap-2">
            {isDefault ? (
              <button onClick={handleInit}
                className="px-4 py-2 bg-amber-900 text-white text-sm font-light hover:bg-amber-800 transition-colors rounded-sm"
                style={{fontFamily: 'Georgia, serif'}}>
                ✎ Tùy chỉnh danh mục
              </button>
            ) : (
              <button onClick={() => { setShowAddForm(!showAddForm); setEditingId(null) }}
                className="px-4 py-2 bg-amber-900 text-white text-sm font-light hover:bg-amber-800 transition-colors rounded-sm"
                style={{fontFamily: 'Georgia, serif'}}>
                + Thêm mục mới
              </button>
            )}
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleAdd} className="p-5 bg-amber-50 border-b-2 border-amber-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-light text-amber-900 mb-1.5" style={{fontFamily: 'Georgia, serif'}}>Mã giá trị (value) *</label>
                <input
                  type="text" required
                  value={addForm.value}
                  onChange={e => setAddForm({...addForm, value: e.target.value})}
                  placeholder="vd: hanoi, teacher..."
                  className="w-full px-3 py-2 border border-amber-200 rounded-sm text-sm focus:outline-none focus:border-amber-900 bg-white"
                  style={{fontFamily: 'Georgia, serif'}}
                />
              </div>
              <div>
                <label className="block text-xs font-light text-amber-900 mb-1.5" style={{fontFamily: 'Georgia, serif'}}>Nhãn hiển thị (label) *</label>
                <input
                  type="text" required
                  value={addForm.label}
                  onChange={e => setAddForm({...addForm, label: e.target.value})}
                  placeholder="vd: Hà Nội, Giáo viên..."
                  className="w-full px-3 py-2 border border-amber-200 rounded-sm text-sm focus:outline-none focus:border-amber-900 bg-white"
                  style={{fontFamily: 'Georgia, serif'}}
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 bg-amber-900 text-white text-sm font-light hover:bg-amber-800 disabled:opacity-50 transition-colors rounded-sm"
                  style={{fontFamily: 'Georgia, serif'}}>
                  {submitting ? '...' : 'Thêm'}
                </button>
                <button type="button" onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-amber-900 text-amber-900 text-sm font-light hover:bg-amber-50 transition-colors rounded-sm"
                  style={{fontFamily: 'Georgia, serif'}}>
                  Hủy
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900 opacity-40" />
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-amber-100 border-b border-amber-200">
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-950 w-12" style={{fontFamily: 'Georgia, serif'}}>STT</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-950" style={{fontFamily: 'Georgia, serif'}}>Mã (value)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-950" style={{fontFamily: 'Georgia, serif'}}>Nhãn hiển thị</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-amber-950 w-24" style={{fontFamily: 'Georgia, serif'}}>Trạng thái</th>
                {!isDefault && <th className="px-4 py-3 text-left text-xs font-medium text-amber-950 w-36" style={{fontFamily: 'Georgia, serif'}}>Hành động</th>}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => (
                <tr key={cat.id ?? idx} className={`border-b border-amber-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'} ${cat.isActive === false ? 'opacity-50' : ''} hover:bg-amber-100/60 transition-colors`}>
                  <td className="px-4 py-3 text-sm text-amber-700" style={{fontFamily: 'Georgia, serif'}}>{idx + 1}</td>

                  {editingId === cat.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input value={editForm.value} onChange={e => setEditForm({...editForm, value: e.target.value})}
                          className="w-full px-2 py-1 border border-amber-300 rounded-sm text-sm focus:outline-none focus:border-amber-900"
                          style={{fontFamily: 'Georgia, serif'}} />
                      </td>
                      <td className="px-4 py-2">
                        <input value={editForm.label} onChange={e => setEditForm({...editForm, label: e.target.value})}
                          className="w-full px-2 py-1 border border-amber-300 rounded-sm text-sm focus:outline-none focus:border-amber-900"
                          style={{fontFamily: 'Georgia, serif'}} />
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 text-xs rounded ${cat.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                          {cat.isActive !== false ? 'Hoạt động' : 'Tắt'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => handleUpdate(cat)} disabled={submitting}
                            className="px-2 py-1 bg-green-700 text-white text-xs rounded-sm hover:bg-green-800 disabled:opacity-50"
                            style={{fontFamily: 'Georgia, serif'}}>Lưu</button>
                          <button onClick={() => setEditingId(null)}
                            className="px-2 py-1 border border-amber-300 text-amber-900 text-xs rounded-sm hover:bg-amber-50"
                            style={{fontFamily: 'Georgia, serif'}}>Hủy</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm text-amber-800 font-mono" style={{fontSize: '0.8rem'}}>{cat.value}</td>
                      <td className="px-4 py-3 text-sm text-amber-950 font-light" style={{fontFamily: 'Georgia, serif'}}>{cat.label}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 text-xs rounded ${cat.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                          {cat.isActive !== false ? 'Hoạt động' : 'Tắt'}
                        </span>
                      </td>
                      {!isDefault && (
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingId(cat.id); setEditForm({ value: cat.value, label: cat.label }); setShowAddForm(false) }}
                              className="px-2 py-1 text-amber-900 hover:bg-amber-200 text-xs border border-amber-300 rounded-sm transition-colors"
                              style={{fontFamily: 'Georgia, serif'}}>Sửa</button>
                            <button onClick={() => handleToggleActive(cat)}
                              className={`px-2 py-1 text-xs border rounded-sm transition-colors ${cat.isActive !== false ? 'text-orange-700 border-orange-300 hover:bg-orange-50' : 'text-green-700 border-green-300 hover:bg-green-50'}`}
                              style={{fontFamily: 'Georgia, serif'}}>
                              {cat.isActive !== false ? 'Tắt' : 'Bật'}
                            </button>
                            <button onClick={() => handleDelete(cat)}
                              className="px-2 py-1 text-red-600 hover:bg-red-100 text-xs border border-red-200 rounded-sm transition-colors"
                              style={{fontFamily: 'Georgia, serif'}}>Xóa</button>
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {categories.length === 0 && !isLoading && (
          <div className="text-center py-12 text-amber-700 font-light" style={{fontFamily: 'Georgia, serif'}}>
            Chưa có danh mục nào.
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-sm">
        <p className="text-sm font-light text-amber-900" style={{fontFamily: 'Georgia, serif'}}>
          <span className="font-medium">Lưu ý:</span>
          <br />• Mỗi danh mục yêu cầu <strong>tối thiểu 2 mục</strong> — không được xóa hoặc vô hiệu hóa nếu chỉ còn 2 mục hoạt động.
          <br />• Khi chưa tùy chỉnh, hệ thống sử dụng danh mục mặc định. Nhấn <strong>"Tùy chỉnh"</strong> để tạo danh mục riêng cho cây.
        </p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  TAB 2: THAM SỐ HỆ THỐNG (QĐ10.2)
// ══════════════════════════════════════════════════════════════
function ConfigsTab() {
  const { currentTree } = useAuthStore()
  const api = treeApi(currentTree?.id)
  const qc = useQueryClient()

  const [editValues, setEditValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['configs', currentTree?.id],
    queryFn: () => api.configs().then(r => r.data),
    enabled: !!currentTree?.id,
  })

  // Khởi tạo editValues mỗi khi data đổi
  const getEditValue = (key) => {
    if (editValues[key] !== undefined) return editValues[key]
    const cfg = configs.find(c => c.key === key)
    return cfg?.value ?? ''
  }

  const handleChange = (key, val) => {
    setEditValues(prev => ({ ...prev, [key]: val }))
  }

  const hasChanges = () => {
    return configs.some(cfg => {
      const editVal = editValues[cfg.key]
      return editVal !== undefined && String(editVal) !== String(cfg.value)
    })
  }

  // Lưu tất cả thay đổi
  const handleSaveAll = async () => {
    const updates = {}
    configs.forEach(cfg => {
      const editVal = editValues[cfg.key]
      if (editVal !== undefined && String(editVal) !== String(cfg.value)) {
        updates[cfg.key] = editVal
      }
    })

    if (Object.keys(updates).length === 0) return toast('Không có thay đổi nào')

    setSaving(true)
    try {
      const res = await api.updateConfigs(updates)
      toast.success(res.data.message)
      if (res.data.warnings?.length) {
        res.data.warnings.forEach(w => toast.error(w))
      }
      qc.invalidateQueries({ queryKey: ['configs', currentTree?.id] })
      setEditValues({})
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi lưu tham số')
    } finally { setSaving(false) }
  }

  // Reset về mặc định
  const handleResetAll = async () => {
    if (!window.confirm('Xác nhận đặt lại TẤT CẢ tham số về mặc định?')) return
    setResetting(true)
    try {
      const res = await api.resetConfigs()
      toast.success(res.data.message)
      qc.invalidateQueries({ queryKey: ['configs', currentTree?.id] })
      setEditValues({})
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi reset')
    } finally { setResetting(false) }
  }

  // Reset 1 tham số
  const handleResetOne = async (key) => {
    try {
      const res = await api.resetConfigs({ key })
      toast.success(res.data.message)
      qc.invalidateQueries({ queryKey: ['configs', currentTree?.id] })
      setEditValues(prev => { const n = {...prev}; delete n[key]; return n })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi reset')
    }
  }

  // Nhóm configs
  const treeConfigs = configs.filter(c => ['maxGenDisplay', 'maxBloodGen', 'reminderDays'].includes(c.key))
  const uploadConfigs = configs.filter(c => ['maxAvatarSize', 'maxLogoSize', 'maxBannerSize'].includes(c.key))

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900 opacity-40" />
        </div>
      ) : (
        <>
          {/* Nhóm 1: Tham số cây gia phả */}
          <div className="bg-white border-2 border-amber-200 rounded-sm overflow-hidden">
            <div className="px-5 py-4 bg-amber-50 border-b-2 border-amber-200">
              <h3 className="text-lg font-light text-amber-950" style={{fontFamily: 'Georgia, serif'}}>Tham số cây gia phả</h3>
              <p className="text-xs text-amber-700 font-light mt-1" style={{fontFamily: 'Georgia, serif'}}>Cấu hình hiển thị phả đồ, sự kiện và hôn nhân</p>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-amber-100 border-b border-amber-200">
                  <th className="px-5 py-3 text-left text-xs font-medium text-amber-950" style={{fontFamily: 'Georgia, serif'}}>Tham số</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-amber-950 w-40" style={{fontFamily: 'Georgia, serif'}}>Phạm vi</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-amber-950 w-28" style={{fontFamily: 'Georgia, serif'}}>Mặc định</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-amber-950 w-36" style={{fontFamily: 'Georgia, serif'}}>Giá trị</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-amber-950 w-28" style={{fontFamily: 'Georgia, serif'}}></th>
                </tr>
              </thead>
              <tbody>
                {treeConfigs.map((cfg, idx) => (
                  <ConfigRow key={cfg.key} cfg={cfg} idx={idx} value={getEditValue(cfg.key)}
                    onChange={val => handleChange(cfg.key, val)}
                    onReset={() => handleResetOne(cfg.key)} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Nhóm 2: Tham số dung lượng upload */}
          <div className="bg-white border-2 border-amber-200 rounded-sm overflow-hidden">
            <div className="px-5 py-4 bg-amber-50 border-b-2 border-amber-200">
              <h3 className="text-lg font-light text-amber-950" style={{fontFamily: 'Georgia, serif'}}>Dung lượng tối đa upload</h3>
              <p className="text-xs text-amber-700 font-light mt-1" style={{fontFamily: 'Georgia, serif'}}>Giới hạn kích thước file ảnh tải lên</p>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-amber-100 border-b border-amber-200">
                  <th className="px-5 py-3 text-left text-xs font-medium text-amber-950" style={{fontFamily: 'Georgia, serif'}}>Tham số</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-amber-950 w-40" style={{fontFamily: 'Georgia, serif'}}>Phạm vi</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-amber-950 w-28" style={{fontFamily: 'Georgia, serif'}}>Mặc định</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-amber-950 w-36" style={{fontFamily: 'Georgia, serif'}}>Giá trị</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-amber-950 w-28" style={{fontFamily: 'Georgia, serif'}}></th>
                </tr>
              </thead>
              <tbody>
                {uploadConfigs.map((cfg, idx) => (
                  <ConfigRow key={cfg.key} cfg={cfg} idx={idx} value={getEditValue(cfg.key)}
                    onChange={val => handleChange(cfg.key, val)}
                    onReset={() => handleResetOne(cfg.key)} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button onClick={handleSaveAll} disabled={saving || !hasChanges()}
              className="flex-1 py-3 bg-amber-900 text-white font-light hover:bg-amber-950 disabled:opacity-40 transition-colors rounded-sm"
              style={{fontFamily: 'Georgia, serif'}}>
              {saving ? 'Đang lưu...' : 'Lưu Tất Cả Thay Đổi'}
            </button>
            <button onClick={handleResetAll} disabled={resetting}
              className="px-6 py-3 border-2 border-amber-900 border-opacity-30 text-amber-900 font-light hover:bg-amber-100 disabled:opacity-40 transition-colors rounded-sm"
              style={{fontFamily: 'Georgia, serif'}}>
              {resetting ? '...' : 'Đặt Lại Mặc Định'}
            </button>
          </div>
        </>
      )}

      {/* Info box */}
      <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-sm">
        <p className="text-sm font-light text-amber-900" style={{fontFamily: 'Georgia, serif'}}>
          <span className="font-medium">Lưu ý:</span> Giá trị phải nằm trong phạm vi cho phép. Các tham số này ảnh hưởng đến hiển thị phả đồ, kiểm tra hôn nhân và nhắc nhở sự kiện cho toàn bộ cây gia phả.
        </p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  Config Row Component — Table row style, amber theme
// ══════════════════════════════════════════════════════════════
function ConfigRow({ cfg, idx, value, onChange, onReset }) {
  const isChanged = String(value) !== String(cfg.value)
  const numVal = parseInt(value)
  const isInvalid = isNaN(numVal) || numVal < cfg.min || numVal > cfg.max

  return (
    <tr className={`border-b border-amber-100 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'} ${isChanged ? '!bg-amber-50' : ''} hover:bg-amber-100/60`}>
      {/* Tham số */}
      <td className="px-5 py-4">
        <p className="text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif'}}>
          {cfg.label}
        </p>
        {cfg.isCustomized && <span className="text-xs text-amber-700 font-light" style={{fontFamily: 'Georgia, serif'}}>Đã tùy chỉnh</span>}
      </td>
      {/* Phạm vi */}
      <td className="px-5 py-4 text-sm text-amber-700 font-light" style={{fontFamily: 'Georgia, serif'}}>
        {cfg.min} – {cfg.max} {cfg.unit}
      </td>
      {/* Mặc định */}
      <td className="px-5 py-4 text-sm text-amber-700 font-light" style={{fontFamily: 'Georgia, serif'}}>
        {cfg.default} {cfg.unit}
      </td>
      {/* Input */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={cfg.min}
            max={cfg.max}
            value={value}
            onChange={e => onChange(e.target.value)}
            className={`w-20 px-3 py-2 border rounded-sm text-sm text-center focus:outline-none focus:border-amber-900 ${
              isInvalid && isChanged ? 'border-red-400 bg-red-50' : 'border-amber-200 bg-white'
            }`}
            style={{fontFamily: 'Georgia, serif'}}
          />
          <span className="text-xs text-amber-700 font-light" style={{fontFamily: 'Georgia, serif'}}>{cfg.unit}</span>
        </div>
      </td>
      {/* Trạng thái / hành động */}
      <td className="px-5 py-4">
        {isChanged ? (
          <span className={`text-xs px-2 py-1 rounded ${isInvalid ? 'bg-red-100 text-red-700' : 'bg-amber-200 text-amber-800'}`}>
            {isInvalid ? 'Ngoài phạm vi' : 'Đã thay đổi'}
          </span>
        ) : cfg.isCustomized ? (
          <button onClick={onReset}
            className="px-2 py-1 text-xs text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-sm transition-colors"
            style={{fontFamily: 'Georgia, serif'}}>
            Đặt lại
          </button>
        ) : null}
      </td>
    </tr>
  )
}

// ══════════════════════════════════════════════════════════════
//  Reusable UI Components
// ══════════════════════════════════════════════════════════════
function Divider() {
  return (
    <div className="flex justify-center items-center gap-3">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900 opacity-30" />
      <div className="text-amber-800 opacity-40" style={{ fontSize: '0.8rem' }}>※</div>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900 opacity-30" />
    </div>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 font-light text-sm border-b-2 transition-colors ${active
        ? 'border-amber-900 text-amber-950'
        : 'border-transparent text-amber-700 hover:text-amber-900'
      }`}
      style={{ fontFamily: 'Georgia, serif' }}
    >
      {children}
    </button>
  )
}
