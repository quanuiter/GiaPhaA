import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { treeApi } from '../services/api'
import { useAuthStore } from '../store/authStore'

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState('upcoming')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({ type: 'meeting', name: '', eventDate: '', location: '', note: '' })
  const [submitting, setSubmitting] = useState(false)
  const currentTree = useAuthStore(s => s.currentTree)
  const queryClient = useQueryClient()
  const treeId = currentTree?.id

  const { data: allEvents = [], isLoading } = useQuery({
    queryKey: ['events', treeId],
    queryFn: () => treeApi(treeId).events().then(r => r.data),
    enabled: !!treeId
  })

  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['upcomingEvents', treeId],
    queryFn: () => treeApi(treeId).events('?upcoming=true').then(r => r.data),
    enabled: !!treeId
  })

  const typeLabel = { anniversary: 'Ngày giỗ', meeting: 'Họp họ', other: 'Sự kiện khác' }

  const handleAddEvent = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.eventDate) {
      alert('Vui lòng điền tên sự kiện và ngày')
      return
    }

    setSubmitting(true)
    try {
      await treeApi(treeId).createEvent({
        ...formData,
        eventDate: new Date(formData.eventDate).toISOString()
      })
      queryClient.invalidateQueries({ queryKey: ['events', treeId] })
      queryClient.invalidateQueries({ queryKey: ['upcomingEvents', treeId] })
      setFormData({ type: 'meeting', name: '', eventDate: '', location: '', note: '' })
      setShowAddForm(false)
    } catch (err) {
      alert('Lỗi: ' + err.response?.data?.message || err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const displayEvents = activeTab === 'upcoming' ? upcomingEvents : allEvents

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Xác nhận xóa sự kiện này?')) return
    try {
      await treeApi(treeId).deleteEvent(eventId)
      queryClient.invalidateQueries({ queryKey: ['events', treeId] })
      queryClient.invalidateQueries({ queryKey: ['upcomingEvents', treeId] })
    } catch (err) {
      alert('Lỗi: ' + err.response?.data?.message || err.message)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>Sự Kiện Dòng Họ</h2>
        <p className="text-amber-700 text-sm font-light mt-1" style={{fontFamily: 'Georgia, serif'}}>Các sự kiện của gia tộc</p>
      </div>

      {/* Decorative divider */}
      <div className="flex justify-center items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900 opacity-30"></div>
        <div className="text-amber-800 opacity-40" style={{fontSize: '0.8rem'}}>※</div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900 opacity-30"></div>
      </div>

      {/* Tab Navigation and Add Button */}
      <div className="flex items-center justify-between border-b border-amber-200">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-3 font-light text-sm border-b-2 transition-colors ${
              activeTab === 'upcoming'
                ? 'border-amber-900 text-amber-950'
                : 'border-transparent text-amber-700 hover:text-amber-900'
            }`}
            style={{fontFamily: 'Georgia, serif'}}
          >
            Sắp tới (30 ngày)
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-3 font-light text-sm border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-amber-900 text-amber-950'
                : 'border-transparent text-amber-700 hover:text-amber-900'
            }`}
            style={{fontFamily: 'Georgia, serif'}}
          >
            Tất cả sự kiện
          </button>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-amber-900 text-white text-sm font-light hover:bg-amber-800 transition-colors rounded-sm"
          style={{fontFamily: 'Georgia, serif'}}
        >
          + Thêm sự kiện
        </button>
      </div>

      {/* Add Event Form */}
      {showAddForm && (
        <form onSubmit={handleAddEvent} className="bg-amber-50 border-2 border-amber-200 p-6 rounded-sm space-y-4">
          <h3 className="text-lg font-light text-amber-950" style={{fontFamily: 'Georgia, serif'}}>Thêm sự kiện mới</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif'}}>Loại sự kiện</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border border-amber-200 rounded-sm text-sm focus:outline-none focus:border-amber-900 bg-white"
                style={{fontFamily: 'Georgia, serif'}}
              >
                <option value="meeting">Họp họ</option>
                <option value="other">Sự kiện khác</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif'}}>Tên sự kiện *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Nhập tên sự kiện"
                className="w-full px-3 py-2 border border-amber-200 rounded-sm text-sm focus:outline-none focus:border-amber-900"
                style={{fontFamily: 'Georgia, serif'}}
              />
            </div>

            <div>
              <label className="block text-sm font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif'}}>Ngày *</label>
              <input
                type="date"
                required
                value={formData.eventDate}
                onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                className="w-full px-3 py-2 border border-amber-200 rounded-sm text-sm focus:outline-none focus:border-amber-900"
              />
            </div>

            <div>
              <label className="block text-sm font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif'}}>Địa điểm</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Địa điểm sự kiện"
                className="w-full px-3 py-2 border border-amber-200 rounded-sm text-sm focus:outline-none focus:border-amber-900"
                style={{fontFamily: 'Georgia, serif'}}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif'}}>Ghi chú</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({...formData, note: e.target.value})}
                placeholder="Ghi chú thêm..."
                rows="3"
                className="w-full px-3 py-2 border border-amber-200 rounded-sm text-sm focus:outline-none focus:border-amber-900 resize-none"
                style={{fontFamily: 'Georgia, serif'}}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-amber-900 text-white text-sm font-light hover:bg-amber-800 disabled:opacity-50 transition-colors rounded-sm"
              style={{fontFamily: 'Georgia, serif'}}
            >
              {submitting ? 'Đang lưu...' : 'Lưu sự kiện'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setFormData({ type: 'meeting', name: '', eventDate: '', location: '', note: '' })
              }}
              className="px-4 py-2 border border-amber-900 text-amber-900 text-sm font-light hover:bg-amber-50 transition-colors rounded-sm"
              style={{fontFamily: 'Georgia, serif'}}
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Events Table */}
      {isLoading
        ? <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900 opacity-40"/></div>
        : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-amber-100 border-b-2 border-amber-900 border-opacity-20">
                  <th className="px-4 py-3 text-left text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>Ngày</th>
                  <th className="px-4 py-3 text-left text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>Sự kiện</th>
                  <th className="px-4 py-3 text-left text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>Loại</th>
                  <th className="px-4 py-3 text-left text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>Địa điểm</th>
                  <th className="px-4 py-3 text-left text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>Liên quan</th>
                  <th className="px-4 py-3 text-left text-sm font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {displayEvents.map((ev, idx) => (
                  <tr key={ev.id} className={`border-b border-amber-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-amber-50'} hover:bg-amber-100 transition-colors`}>
                    <td className="px-4 py-3 text-sm text-amber-900 font-light" style={{fontFamily: 'Georgia, serif'}}>
                      {new Date(ev.eventDate).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-sm text-amber-950 font-light" style={{fontFamily: 'Georgia, serif'}}>
                      <span className="font-medium">{ev.name}</span>
                      {ev.note && <p className="text-xs text-amber-700 italic mt-1">{ev.note}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-amber-800 font-light" style={{fontFamily: 'Georgia, serif'}}>
                      {typeLabel[ev.type]}
                    </td>
                    <td className="px-4 py-3 text-sm text-amber-800 font-light" style={{fontFamily: 'Georgia, serif'}}>
                      {ev.location || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-amber-800 font-light" style={{fontFamily: 'Georgia, serif'}}>
                      {ev.relatedMember?.fullName || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <button
                        onClick={() => handleDeleteEvent(ev.id)}
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
            {displayEvents.length === 0 && (
              <div className="text-center py-16 text-amber-700 font-light" style={{fontFamily: 'Georgia, serif'}}>
                {activeTab === 'upcoming' ? 'Không có sự kiện sắp tới' : 'Chưa có sự kiện nào'}
              </div>
            )}
          </div>
        )
      }
    </div>
  )
}
