import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { treeApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Plus, Search, Pencil, Trash2, Eye, Filter } from 'lucide-react'

export default function MembersPage() {
  const { user, currentTree } = useAuthStore()
  const api = treeApi(currentTree?.id)
  const myRole = currentTree?.myRole
  const qc = useQueryClient()
  const [filters, setFilters] = useState({ keyword: '', gender: '', isDeceased: '' })

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['members', currentTree?.id, filters],
    queryFn: () => {
      const p = new URLSearchParams()
      if (filters.keyword)              p.set('keyword',    filters.keyword)
      if (filters.gender)               p.set('gender',     filters.gender)
      if (filters.isDeceased !== '')    p.set('isDeceased', filters.isDeceased)
      return api.members(p.toString() ? `?${p}` : '').then(r => r.data)
    },
    enabled: !!currentTree
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.deleteMember(id),
    onSuccess:  () => { qc.invalidateQueries(['members', currentTree?.id]); toast.success('Đã xóa') },
    onError:    err => toast.error(err.response?.data?.message || 'Xóa thất bại')
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Thành viên</h2>
          <p className="text-gray-400 text-sm">{members.length} thành viên</p>
        </div>
        {(myRole === 'admin' || myRole === 'editor') && (
          <Link to="/members/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors">
            <Plus size={16}/> Thêm thành viên
          </Link>
        )}
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-48">
          <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1"><Search size={12}/> Tìm kiếm</label>
          <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Họ tên, tên gọi khác..."
            value={filters.keyword}
            onChange={e => setFilters(f => ({ ...f, keyword: e.target.value }))}/>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Giới tính</label>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
            value={filters.gender} onChange={e => setFilters(f => ({ ...f, gender: e.target.value }))}>
            <option value="">Tất cả</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Trạng thái</label>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-36"
            value={filters.isDeceased} onChange={e => setFilters(f => ({ ...f, isDeceased: e.target.value }))}>
            <option value="">Tất cả</option>
            <option value="false">Còn sống</option>
            <option value="true">Đã mất</option>
          </select>
        </div>
        <button onClick={() => setFilters({ keyword: '', gender: '', isDeceased: '' })}
          className="px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Xóa lọc
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['STT','Họ và tên','Giới tính','Năm sinh','Đời','Cha','Mẹ','Trạng thái',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {members.map((m, i) => (
                <tr key={m.id} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                        ${m.gender === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                        {m.fullName.split(' ').pop()[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{m.fullName}</p>
                        {m.nickname && <p className="text-xs text-gray-400 italic">{m.nickname}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.gender === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                      {m.gender === 'male' ? 'Nam' : 'Nữ'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{m.birthDate ? new Date(m.birthDate).getFullYear() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">Đời {m.generation}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{m.father?.fullName || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{m.mother?.fullName || '—'}</td>
                  <td className="px-4 py-3">
                    {m.isDeceased
                      ? <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">✞ Đã mất</span>
                      : <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">● Còn sống</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/members/${m.id}`} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors"><Eye size={14}/></Link>
                      {(myRole === 'admin' || myRole === 'editor') && (
                        <Link to={`/members/${m.id}/edit`} className="p-1.5 text-amber-500 hover:bg-amber-100 rounded-lg transition-colors"><Pencil size={14}/></Link>
                      )}
                      {myRole === 'admin' && (
                        <button onClick={() => confirm(`Xóa "${m.fullName}"?`) && deleteMutation.mutate(m.id)}
                          className="p-1.5 text-red-400 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={14}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && !members.length && (
          <div className="text-center py-16 text-gray-400">
            <Users className="mx-auto mb-2 opacity-20" size={40}/>
            <p className="text-sm">Chưa có thành viên</p>
          </div>
        )}
      </div>
    </div>
  )
}