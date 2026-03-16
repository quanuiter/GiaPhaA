// file: frontend/src/pages/ReportsPage.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { treeApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

export default function ReportsPage() {
  const { currentTree } = useAuthStore()
  const api = treeApi(currentTree?.id)
  
  const currentYear = new Date().getFullYear()
  
  // State quản lý tab đang mở
  const [activeTab, setActiveTab] = useState('tang-giam')

  // Bộ lọc riêng biệt cho từng tab
  const [filtersMember, setFiltersMember] = useState({ fromYear: currentYear - 5, toYear: currentYear })
  const [filtersAchievement, setFiltersAchievement] = useState({ fromYear: currentYear - 5, toYear: currentYear })

  const role = currentTree?.myRole;
  if (role !== 'admin' && role !== 'editor') {
    return <div className="p-8 text-center text-red-600">Bạn không có quyền xem báo cáo (Chỉ dành cho Admin/Editor).</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>Báo Cáo Năm</h2>
        <p className="text-amber-700 text-sm font-light mt-1" style={{fontFamily: 'Georgia, serif'}}>Thống kê tăng giảm và thành tích dòng họ</p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-amber-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('tang-giam')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'tang-giam'
                ? 'border-amber-900 text-amber-900'
                : 'border-transparent text-amber-600 hover:text-amber-800 hover:border-amber-300'
            }`}
          >
            Tăng giảm thành viên
          </button>
          <button
            onClick={() => setActiveTab('thanh-tich')}
            className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'thanh-tich'
                ? 'border-amber-900 text-amber-900'
                : 'border-transparent text-amber-600 hover:text-amber-800 hover:border-amber-300'
            }`}
          >
            Thành tích
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'tang-giam' && (
          <MemberReportTab 
            api={api} 
            treeId={currentTree?.id} 
            filters={filtersMember} 
            setFilters={setFiltersMember} 
          />
        )}
        {activeTab === 'thanh-tich' && (
          <AchievementReportTab 
            api={api} 
            treeId={currentTree?.id} 
            filters={filtersAchievement} 
            setFilters={setFiltersAchievement} 
          />
        )}
      </div>
    </div>
  )
}

// -------------------------------------------------------------
// COMPONENT TAB 1: Tăng giảm thành viên
// -------------------------------------------------------------
function MemberReportTab({ api, treeId, filters, setFilters }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reports', 'members', treeId, filters],
    queryFn: () => {
      const p = new URLSearchParams()
      p.set('type', 'members') // Gọi type = members
      if (filters.fromYear) p.set('fromYear', filters.fromYear)
      if (filters.toYear)   p.set('toYear', filters.toYear)
      return api.reports(`?${p.toString()}`).then(r => r.data)
    },
    enabled: !!treeId
  })

  const handleFilter = () => {
    if (filters.fromYear > filters.toYear) return toast.error('Năm bắt đầu không được lớn hơn năm kết thúc')
    refetch()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex gap-4 items-end bg-amber-50 p-4 rounded border border-amber-900 border-opacity-20 shadow-sm">
        <div>
          <label className="block text-xs font-light text-amber-900 mb-2">Từ năm</label>
          <input type="number" className="border border-amber-200 px-3 py-2 w-32 outline-none rounded bg-white" 
            value={filters.fromYear} onChange={e => setFilters({...filters, fromYear: e.target.value})}/>
        </div>
        <div>
          <label className="block text-xs font-light text-amber-900 mb-2">Đến năm</label>
          <input type="number" className="border border-amber-200 px-3 py-2 w-32 outline-none rounded bg-white" 
            value={filters.toYear} onChange={e => setFilters({...filters, toYear: e.target.value})}/>
        </div>
        <button onClick={handleFilter} className="px-5 py-2 bg-amber-900 text-amber-50 hover:bg-amber-950 transition rounded">
          Lập Báo Cáo
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-amber-700">Đang tải dữ liệu báo cáo...</div>
      ) : data?.memberStats && (
        <div className="bg-white border border-amber-900 border-opacity-20 shadow-sm overflow-hidden rounded">
          <table className="w-full text-sm text-center">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="p-3 font-medium text-amber-900">STT</th>
                <th className="p-3 font-medium text-amber-900">Năm</th>
                <th className="p-3 font-medium text-amber-900">Số lượng sinh</th>
                <th className="p-3 font-medium text-amber-900">Số lượng kết hôn</th>
                <th className="p-3 font-medium text-amber-900">Số lượng mất</th>
                <th className="p-3 font-medium text-amber-900">Tổng cuối năm (còn sống)</th>
                <th className="p-3 font-medium text-amber-900">Tổng số (sống & mất)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {data.memberStats.rows?.map((r, idx) => (
                <tr key={r.year} className="hover:bg-amber-50">
                  <td className="p-3">{idx + 1}</td>
                  <td className="p-3 font-semibold">{r.year}</td>
                  <td className="p-3 text-green-600">+{r.sinh}</td>
                  <td className="p-3 text-blue-600">{r.ketHon}</td>
                  <td className="p-3 text-red-600">-{r.mat}</td>
                  <td className="p-3 font-semibold">{r.tongConSong}</td>
                  <td className="p-3">{r.tongThanhVien}</td>
                </tr>
              ))}
              <tr className="bg-amber-100 font-bold text-amber-900">
                <td className="p-3" colSpan="2">Tổng cộng</td>
                <td className="p-3 text-green-700">+{data.memberStats.totals.totalSinh}</td>
                <td className="p-3 text-blue-700">{data.memberStats.totals.totalKetHon}</td>
                <td className="p-3 text-red-700">-{data.memberStats.totals.totalMat}</td>
                <td className="p-3" colSpan="2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// -------------------------------------------------------------
// COMPONENT TAB 2: Thành tích
// -------------------------------------------------------------
function AchievementReportTab({ api, treeId, filters, setFilters }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reports', 'achievements', treeId, filters],
    queryFn: () => {
      const p = new URLSearchParams()
      p.set('type', 'achievements') // Gọi type = achievements
      if (filters.fromYear) p.set('fromYear', filters.fromYear)
      if (filters.toYear)   p.set('toYear', filters.toYear)
      return api.reports(`?${p.toString()}`).then(r => r.data)
    },
    enabled: !!treeId
  })

  const handleFilter = () => {
    if (filters.fromYear > filters.toYear) return toast.error('Năm bắt đầu không được lớn hơn năm kết thúc')
    refetch()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex gap-4 items-end bg-amber-50 p-4 rounded border border-amber-900 border-opacity-20 shadow-sm">
        <div>
          <label className="block text-xs font-light text-amber-900 mb-2">Từ năm</label>
          <input type="number" className="border border-amber-200 px-3 py-2 w-32 outline-none rounded bg-white" 
            value={filters.fromYear} onChange={e => setFilters({...filters, fromYear: e.target.value})}/>
        </div>
        <div>
          <label className="block text-xs font-light text-amber-900 mb-2">Đến năm</label>
          <input type="number" className="border border-amber-200 px-3 py-2 w-32 outline-none rounded bg-white" 
            value={filters.toYear} onChange={e => setFilters({...filters, toYear: e.target.value})}/>
        </div>
        <button onClick={handleFilter} className="px-5 py-2 bg-amber-900 text-amber-50 hover:bg-amber-950 transition rounded">
          Lập Báo Cáo
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-amber-700">Đang tải dữ liệu báo cáo...</div>
      ) : data?.achievementStats && (
        <div className="bg-white border border-amber-900 border-opacity-20 shadow-sm overflow-hidden rounded">
          <table className="w-full text-sm text-center">
            <thead className="bg-amber-50 border-b border-amber-200">
              <tr>
                <th className="p-3 font-medium text-amber-900">STT</th>
                <th className="p-3 font-medium text-amber-900">Loại thành tích</th>
                <th className="p-3 font-medium text-amber-900">Số lượng</th>
                <th className="p-3 font-medium text-amber-900">Cấp độ phổ biến</th>
                <th className="p-3 font-medium text-amber-900">Thành viên tiêu biểu</th>
                <th className="p-3 font-medium text-amber-900">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {data.achievementStats.length === 0 ? (
                <tr><td colSpan="6" className="p-5 text-gray-500">Không có thành tích nào trong khoảng thời gian này.</td></tr>
              ) : (
                data.achievementStats.map((a, idx) => (
                  <tr key={a.type} className="hover:bg-amber-50">
                    <td className="p-3">{idx + 1}</td>
                    <td className="p-3 font-semibold">{a.type}</td>
                    <td className="p-3">{a.count}</td>
                    <td className="p-3">{a.commonLevel}</td>
                    <td className="p-3 font-medium text-amber-800">{a.topMember}</td>
                    <td className="p-3 italic text-gray-500">—</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}