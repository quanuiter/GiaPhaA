import { useState, useMemo } from 'react'
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
  const [filters, setFilters] = useState({ 
    keyword: '', 
    gender: '', 
    isDeceased: '',
    generation: '',
    birthYearFrom: '',
    birthYearTo: '',
    sortBy: 'name'
  })
  const [viewMode, setViewMode] = useState('grid')

  const { data: allMembers = [], isLoading } = useQuery({
    queryKey: ['members', currentTree?.id],
    queryFn: () => api.members().then(r => r.data),
    enabled: !!currentTree
  })

  const members = useMemo(() => {
    let result = [...allMembers]
    
    // Apply filters
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      result = result.filter(m => 
        m.fullName?.toLowerCase().includes(kw) || 
        m.nickname?.toLowerCase().includes(kw) ||
        m.occupation?.toLowerCase().includes(kw) ||
        m.hometown?.toLowerCase().includes(kw)
      )
    }
    if (filters.gender) result = result.filter(m => m.gender === filters.gender)
    if (filters.isDeceased !== '') result = result.filter(m => m.isDeceased === (filters.isDeceased === 'true'))
    if (filters.generation) result = result.filter(m => m.generation === parseInt(filters.generation))
    if (filters.birthYearFrom) {
      const year = parseInt(filters.birthYearFrom)
      result = result.filter(m => m.birthDate && new Date(m.birthDate).getFullYear() >= year)
    }
    if (filters.birthYearTo) {
      const year = parseInt(filters.birthYearTo)
      result = result.filter(m => m.birthDate && new Date(m.birthDate).getFullYear() <= year)
    }

    // Sort
    if (filters.sortBy === 'name') result.sort((a, b) => a.fullName.localeCompare(b.fullName))
    if (filters.sortBy === 'generation') result.sort((a, b) => a.generation - b.generation)
    if (filters.sortBy === 'birthDate') result.sort((a, b) => new Date(b.birthDate || 0) - new Date(a.birthDate || 0))
    
    return result
  }, [allMembers, filters])

  const deleteMutation = useMutation({
    mutationFn: id => api.deleteMember(id),
    onSuccess:  () => { qc.invalidateQueries(['members', currentTree?.id]); toast.success('Đã xóa') },
    onError:    err => toast.error(err.response?.data?.message || 'Xóa thất bại')
  })

  const generations = useMemo(() => {
    const gens = new Set(allMembers.map(m => m.generation))
    return Array.from(gens).sort((a, b) => a - b)
  }, [allMembers])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>Thành Viên Gia Phả</h2>
          <p className="text-amber-700 text-sm font-light mt-2" style={{fontFamily: 'Georgia, serif'}}>
            {members.length} / {allMembers.length} thành viên {members.length < allMembers.length && '(có bộ lọc)'}
          </p>
        </div>
        <div className="flex gap-2">
          {(myRole === 'admin' || myRole === 'editor') && (
            <Link to="/members/new" className="px-6 py-2.5 bg-amber-900 text-amber-50 font-light transition hover:bg-amber-950 rounded-lg" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>
              + Thêm Thành Viên
            </Link>
          )}
          <div className="flex gap-1 bg-amber-200 bg-opacity-30 rounded-lg p-1">
            <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded transition ${viewMode === 'grid' ? 'bg-amber-900 text-amber-50' : 'text-amber-900 hover:bg-amber-200'}`} title="Grid view">⊞</button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded transition ${viewMode === 'list' ? 'bg-amber-900 text-amber-50' : 'text-amber-900 hover:bg-amber-200'}`} title="List view">☰</button>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-gradient-to-b from-amber-50 to-white rounded-xl border border-amber-900 border-opacity-20 p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Tìm kiếm */}
          <div>
            <label className="block text-xs font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>Tìm Kiếm</label>
            <input 
              type="text"
              placeholder="Tên, tên gọi, nghề..."
              className="w-full border border-amber-900 border-opacity-20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-900 focus:ring-opacity-20 text-amber-950 placeholder-amber-700 placeholder-opacity-50 transition text-sm"
              style={{fontFamily: 'Georgia, serif'}}
              value={filters.keyword}
              onChange={e => setFilters(f => ({ ...f, keyword: e.target.value }))}
            />
          </div>

          {/* Giới tính */}
          <div>
            <label className="block text-xs font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>Giới Tính</label>
            <select 
              className="w-full border border-amber-900 border-opacity-20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-900 focus:ring-opacity-20 text-amber-950 transition text-sm bg-white"
              style={{fontFamily: 'Georgia, serif'}}
              value={filters.gender}
              onChange={e => setFilters(f => ({ ...f, gender: e.target.value }))}
            >
              <option value="">Tất cả</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </div>

          {/* Trạng thái */}
          <div>
            <label className="block text-xs font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>Trạng Thái</label>
            <select 
              className="w-full border border-amber-900 border-opacity-20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-900 focus:ring-opacity-20 text-amber-950 transition text-sm bg-white"
              style={{fontFamily: 'Georgia, serif'}}
              value={filters.isDeceased}
              onChange={e => setFilters(f => ({ ...f, isDeceased: e.target.value }))}
            >
              <option value="">Tất cả</option>
              <option value="false">Còn sống</option>
              <option value="true">Đã mất</option>
            </select>
          </div>

          {/* Đời */}
          <div>
            <label className="block text-xs font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>Thế Hệ</label>
            <select 
              className="w-full border border-amber-900 border-opacity-20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-900 focus:ring-opacity-20 text-amber-950 transition text-sm bg-white"
              style={{fontFamily: 'Georgia, serif'}}
              value={filters.generation}
              onChange={e => setFilters(f => ({ ...f, generation: e.target.value }))}
            >
              <option value="">Tất cả</option>
              {generations.map(gen => <option key={gen} value={gen}>Đời {gen}</option>)}
            </select>
          </div>

          {/* Sắp xếp */}
          <div>
            <label className="block text-xs font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>Sắp Xếp</label>
            <select 
              className="w-full border border-amber-900 border-opacity-20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-900 focus:ring-opacity-20 text-amber-950 transition text-sm bg-white"
              style={{fontFamily: 'Georgia, serif'}}
              value={filters.sortBy}
              onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}
            >
              <option value="name">Theo tên</option>
              <option value="generation">Theo đời</option>
              <option value="birthDate">Theo năm sinh</option>
            </select>
          </div>
        </div>

        {/* More filters row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {/* Năm sinh từ */}
          <div>
            <label className="block text-xs font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>Năm Sinh Từ</label>
            <input 
              type="number"
              placeholder="VD: 1950"
              className="w-full border border-amber-900 border-opacity-20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-900 focus:ring-opacity-20 text-amber-950 placeholder-amber-700 placeholder-opacity-50 transition text-sm"
              style={{fontFamily: 'Georgia, serif'}}
              value={filters.birthYearFrom}
              onChange={e => setFilters(f => ({ ...f, birthYearFrom: e.target.value }))}
            />
          </div>

          {/* Năm sinh đến */}
          <div>
            <label className="block text-xs font-light text-amber-900 mb-2" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>Năm Sinh Đến</label>
            <input 
              type="number"
              placeholder="VD: 2000"
              className="w-full border border-amber-900 border-opacity-20 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-900 focus:ring-opacity-20 text-amber-950 placeholder-amber-700 placeholder-opacity-50 transition text-sm"
              style={{fontFamily: 'Georgia, serif'}}
              value={filters.birthYearTo}
              onChange={e => setFilters(f => ({ ...f, birthYearTo: e.target.value }))}
            />
          </div>

          {/* Xóa lọc */}
          <div className="flex items-end">
            <button 
              onClick={() => setFilters({ keyword: '', gender: '', isDeceased: '', generation: '', birthYearFrom: '', birthYearTo: '', sortBy: 'name' })}
              className="w-full px-4 py-2 text-sm text-amber-900 border border-amber-900 border-opacity-30 hover:bg-amber-100 transition-colors font-light rounded-lg"
              style={{fontFamily: 'Georgia, serif'}}
            >
              Xóa Tất Cả Lọc
            </button>
          </div>
        </div>
      </div>

      {/* Members Grid or List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-900 opacity-40"/>
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-20 bg-amber-50 rounded-xl border border-amber-900 border-opacity-20">
          <p className="text-amber-700 font-light text-lg" style={{fontFamily: 'Georgia, serif'}}>Chưa tìm thấy thành viên nào</p>
          <p className="text-amber-600 text-sm font-light mt-2">Hãy thử thay đổi bộ lọc</p>
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => (
            <Link key={m.id} to={`/members/${m.id}`}>
              <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-900 border-opacity-20 p-5 hover:shadow-lg transition-all hover:border-amber-900 hover:border-opacity-40 group cursor-pointer">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-light flex-shrink-0 ${m.gender === 'male' ? 'bg-amber-300 text-amber-900' : 'bg-amber-200 text-amber-800'}`}>
                    {m.avatarUrl ? (
                      <img src={`http://localhost:3001${m.avatarUrl}`} className="w-full h-full object-cover rounded-full" alt="" />
                    ) : m.fullName.split(' ').pop()[0]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-light text-amber-950 group-hover:text-amber-900 transition" style={{fontFamily: 'Georgia, serif', fontSize: '1.05rem'}}>{m.fullName}</h3>
                    {m.nickname && <p className="text-xs text-amber-700 italic font-light mt-1">{m.nickname}</p>}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-amber-700 font-light">Giới tính</span>
                    <span className="font-light text-amber-900">{m.gender === 'male' ? 'Nam' : 'Nữ'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-amber-700 font-light">Đời</span>
                    <span className="font-light text-amber-900">Đời {m.generation}</span>
                  </div>
                  {m.birthDate && (
                    <div className="flex justify-between">
                      <span className="text-amber-700 font-light">Sinh</span>
                      <span className="font-light text-amber-900">{new Date(m.birthDate).getFullYear()}</span>
                    </div>
                  )}
                  {m.occupation && (
                    <div className="flex justify-between">
                      <span className="text-amber-700 font-light">Nghề</span>
                      <span className="font-light text-amber-900 text-right">{m.occupation}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-amber-900 border-opacity-20">
                    <span className="text-amber-700 font-light">Trạng thái</span>
                    <span className={`text-xs px-2 py-1 rounded font-light ${m.isDeceased ? 'bg-amber-200 text-amber-900' : 'bg-amber-300 text-amber-900'}`}>
                      {m.isDeceased ? 'Đã mất' : 'Còn sống'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        // List View
        <div className="space-y-2">
          {members.map((m, i) => (
            <Link key={m.id} to={`/members/${m.id}`} className="group">
              <div className="bg-gradient-to-r from-amber-50 to-white rounded-lg border border-amber-900 border-opacity-20 p-4 hover:shadow-md transition-all hover:border-amber-900 hover:border-opacity-40 flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-amber-700 font-light text-sm w-8">{i + 1}</span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-light flex-shrink-0 ${m.gender === 'male' ? 'bg-amber-300 text-amber-900' : 'bg-amber-200 text-amber-800'}`}>
                    {m.avatarUrl ? (
                      <img src={`http://localhost:3001${m.avatarUrl}`} className="w-full h-full object-cover rounded-full" alt="" />
                    ) : m.fullName.split(' ').pop()[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-light text-amber-950 group-hover:text-amber-900" style={{fontFamily: 'Georgia, serif'}}>{m.fullName}</p>
                    {m.nickname && <p className="text-xs text-amber-700 font-light">{m.nickname}</p>}
                  </div>
                  <div className="flex gap-6 text-sm ml-4">
                    <span className="text-amber-700 font-light">{m.gender === 'male' ? 'Nam' : 'Nữ'}</span>
                    <span className="text-amber-700 font-light">Đời {m.generation}</span>
                    {m.birthDate && <span className="text-amber-700 font-light">{new Date(m.birthDate).getFullYear()}</span>}
                    {m.occupation && <span className="text-amber-700 font-light">{m.occupation}</span>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded font-light ${m.isDeceased ? 'bg-amber-200 text-amber-900' : 'bg-amber-300 text-amber-900'}`}>
                    {m.isDeceased ? 'Đã mất' : 'Còn sống'}
                  </span>
                </div>
                <div className="flex gap-2 ml-4">
                  {(myRole === 'admin' || myRole === 'editor') && (
                    <Link to={`/members/${m.id}/edit`} className="px-2 py-1 text-xs text-amber-900 hover:bg-amber-200 rounded transition" onClick={e => e.preventDefault()}>Sửa</Link>
                  )}
                  {myRole === 'admin' && (
                    <button onClick={(e) => { e.preventDefault(); confirm(`Xóa "${m.fullName}"?`) && deleteMutation.mutate(m.id) }} className="px-2 py-1 text-xs text-amber-900 hover:bg-amber-200 rounded transition">Xóa</button>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
