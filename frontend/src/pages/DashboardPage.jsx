import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { treeApi } from '../services/api'
import { Users, CalendarDays, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const { currentTree } = useAuthStore()
  const api = treeApi(currentTree?.id)

  const { data: members = [] } = useQuery({
    queryKey: ['members', currentTree?.id],
    queryFn:  () => api.members().then(r => r.data),
    enabled:  !!currentTree
  })
  const { data: events = [] } = useQuery({
    queryKey: ['events-upcoming', currentTree?.id],
    queryFn:  () => api.events('?upcoming=true').then(r => r.data),
    enabled:  !!currentTree
  })

  const alive  = members.filter(m => !m.isDeceased).length
  const dead   = members.filter(m =>  m.isDeceased).length
  const maxGen = members.length ? Math.max(...members.map(m => m.generation)) : 0

  const stats = [
    { label: 'Tổng thành viên', value: members.length, icon: Users,        color: 'blue',   sub: `${alive} còn sống · ${dead} đã mất` },
    { label: 'Số thế hệ',       value: maxGen,          icon: TrendingUp,   color: 'green',  sub: 'thế hệ trong gia phả' },
    { label: 'Sự kiện sắp tới', value: events.length,   icon: CalendarDays, color: 'orange', sub: 'trong thời gian tới' },
  ]

  const colorMap = {
    blue:   'bg-blue-50 text-blue-700 border-blue-100',
    green:  'bg-green-50 text-green-700 border-green-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{currentTree?.name}</h2>
        <p className="text-gray-400 text-sm">Tổng quan cây gia phả</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className={`bg-white rounded-xl border p-5 flex items-center gap-4 shadow-sm ${colorMap[color]}`}>
            <div className={`p-3 rounded-xl ${colorMap[color]}`}><Icon size={22}/></div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{value}</p>
              <p className="font-medium text-sm text-gray-700">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-700">Thành viên gần đây</h3>
            <Link to="/members" className="text-blue-600 text-sm hover:underline">Xem tất cả →</Link>
          </div>
          <div className="space-y-2">
            {members.slice(-5).reverse().map(m => (
              <Link to={`/members/${m.id}`} key={m.id}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
                  ${m.gender === 'male' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                  {m.fullName.split(' ').pop()[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800 truncate">{m.fullName}</p>
                  <p className="text-xs text-gray-400">Đời {m.generation}</p>
                </div>
                {m.isDeceased && <span className="text-xs text-gray-400">✞</span>}
              </Link>
            ))}
            {!members.length && <p className="text-center text-gray-400 py-6 text-sm">Chưa có thành viên</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-700">Sự kiện sắp tới</h3>
            <Link to="/events" className="text-blue-600 text-sm hover:underline">Xem tất cả →</Link>
          </div>
          <div className="space-y-2">
            {events.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
                <span className="text-xl">{ev.type === 'anniversary' ? '🕯️' : '📅'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800 truncate">{ev.name}</p>
                  <p className="text-xs text-gray-500">{new Date(ev.eventDate).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>
            ))}
            {!events.length && <p className="text-center text-gray-400 py-6 text-sm">Không có sự kiện sắp tới</p>}
          </div>
        </div>
      </div>
    </div>
  )
}