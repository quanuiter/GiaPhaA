import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { treeApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>Thành Viên</h2>
          <p className="text-amber-700 text-sm font-light mt-1" style={{fontFamily: 'Georgia, serif'}}>{members.length} thành viên</p>
        </div>
        {(myRole === 'admin' || myRole === 'editor') && (
          <Link to="/members/new" className="px-6 py-2.5 bg-amber-900 text-amber-50 font-light transition hover:bg-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
            + Thêm Thành Viên
          </Link>
        )}
      </div>

      {/* Decorative divider */}
      <div className="flex justify-center items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900 opacity-30"></div>
        <div className="text-amber-800 opacity-40" style={{fontSize: '0.8rem'}}>※</div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900 opacity-30"></div>
      </div>

      {/* Filter */}
      <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 p-6 shadow-lg" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
        <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-amber-800 opacity-30"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-amber-800 opacity-30"></div>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>Tìm Kiếm</label>
            <input className="w-full border-2 border-amber-900 border-opacity-30 bg-white bg-opacity-70 px-4 py-2.5 focus:outline-none focus:border-amber-800 text-amber-950 placeholder-amber-700 placeholder-opacity-50 transition"
              style={{fontFamily: 'Georgia, serif'}}
              placeholder="Họ tên, tên gọi khác..."
              value={filters.keyword}
              onChange={e => setFilters(f => ({ ...f, keyword: e.target.value }))}/>
          </div>
          <div>
            <label className="block text-xs font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>Giới Tính</label>
            <select className="border-2 border-amber-900 border-opacity-30 bg-white bg-opacity-70 px-4 py-2.5 focus:outline-none focus:border-amber-800 text-amber-950 transition w-32" style={{fontFamily: 'Georgia, serif'}}
              value={filters.gender} onChange={e => setFilters(f => ({ ...f, gender: e.target.value }))}>
              <option value="">Tất cả</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>Trạng Thái</label>
            <select className="border-2 border-amber-900 border-opacity-30 bg-white bg-opacity-70 px-4 py-2.5 focus:outline-none focus:border-amber-800 text-amber-950 transition w-36" style={{fontFamily: 'Georgia, serif'}}
              value={filters.isDeceased} onChange={e => setFilters(f => ({ ...f, isDeceased: e.target.value }))}>
              <option value="">Tất cả</option>
              <option value="false">Còn sống</option>
              <option value="true">Đã mất</option>
            </select>
          </div>
          <button onClick={() => setFilters({ keyword: '', gender: '', isDeceased: '' })}
            className="px-4 py-2.5 text-sm text-amber-900 border-2 border-amber-900 border-opacity-30 hover:bg-amber-200 transition-colors font-light" style={{fontFamily: 'Georgia, serif'}}>
            Xóa Lọc
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 shadow-lg overflow-hidden" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
        <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-amber-800 opacity-30"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-amber-800 opacity-30"></div>
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900 opacity-40"/></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-amber-200 bg-opacity-40 border-b-2 border-amber-900 border-opacity-20">
              <tr>
                {['STT','Họ và tên','Giới tính','Năm sinh','Đời','Cha','Mẹ','Trạng thái',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-light text-amber-900 text-xs whitespace-nowrap" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-900 divide-opacity-20">
              {members.map((m, i) => (
                <tr key={m.id} className="hover:bg-amber-200 hover:bg-opacity-30 transition-colors">
                  <td className="px-4 py-3 text-amber-700 text-xs font-light">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-light flex-shrink-0 ${m.gender === 'male' ? 'bg-amber-300 text-amber-900' : 'bg-amber-200 text-amber-800'}`}>
                        {m.fullName.split(' ').pop()[0]}
                      </div>
                      <div>
                        <p className="font-light text-amber-950" style={{fontFamily: 'Georgia, serif'}}>{m.fullName}</p>
                        {m.nickname && <p className="text-xs text-amber-700 italic font-light">{m.nickname}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 ${m.gender === 'male' ? 'bg-amber-300 text-amber-900' : 'bg-amber-200 text-amber-800'} font-light`}>
                      {m.gender === 'male' ? 'Nam' : 'Nữ'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-amber-800 font-light">{m.birthDate ? new Date(m.birthDate).getFullYear() : '—'}</td>
                  <td className="px-4 py-3">
                    <span className="bg-amber-300 text-amber-900 text-xs px-2 py-0.5 font-light">Đời {m.generation}</span>
                  </td>
                  <td className="px-4 py-3 text-amber-800 text-xs font-light">{m.father?.fullName || '—'}</td>
                  <td className="px-4 py-3 text-amber-800 text-xs font-light">{m.mother?.fullName || '—'}</td>
                  <td className="px-4 py-3">
                    {m.isDeceased
                      ? <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 font-light">✞ Đã mất</span>
                      : <span className="text-xs bg-amber-300 text-amber-900 px-2 py-0.5 font-light">• Còn sống</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link to={`/members/${m.id}`} className="p-1.5 text-amber-900 hover:bg-amber-200 transition-colors" title="Xem">Xem</Link>
                      {(myRole === 'admin' || myRole === 'editor') && (
                        <Link to={`/members/${m.id}/edit`} className="p-1.5 text-amber-900 hover:bg-amber-200 transition-colors" title="Sửa">Sửa</Link>
                      )}
                      {myRole === 'admin' && (
                        <button onClick={() => confirm(`Xóa "${m.fullName}"?`) && deleteMutation.mutate(m.id)}
                          className="p-1.5 text-amber-900 hover:bg-amber-200 transition-colors" title="Xóa">Xóa</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && !members.length && (
          <div className="text-center py-16 text-amber-700 font-light">
            <p className="text-sm" style={{fontFamily: 'Georgia, serif'}}>Chưa có thành viên</p>
          </div>
        )}
      </div>
    </div>
  )
}
