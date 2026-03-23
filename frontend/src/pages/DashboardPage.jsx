import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { treeApi } from '../services/api'
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
    { label: 'Tổng thành viên', value: members.length, sub: `${alive} còn sống · ${dead} đã mất` },
    { label: 'Số thế hệ', value: maxGen, sub: 'thế hệ trong gia phả' },
    { label: 'Sự kiện sắp tới', value: events.length, sub: 'trong thời gian tới' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-light text-amber-950 mb-1" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>{currentTree?.name}</h2>
        <p className="text-amber-700 text-sm font-light" style={{fontFamily: 'Georgia, serif'}}>Tổng quan cây gia phả</p>
      </div>

      {/* Decorative divider */}
      <div className="flex justify-center items-center gap-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900 opacity-30"></div>
        <div className="text-amber-800 opacity-40" style={{fontSize: '0.8rem'}}>※</div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900 opacity-30"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map(({ label, value, sub }) => (
          <div key={label} className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 p-8 shadow-lg" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
            <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-amber-800 opacity-30"></div>
            <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-amber-800 opacity-30"></div>
            <div className="text-center">
              <p className="text-4xl font-light text-amber-950 mb-2" style={{fontFamily: 'Georgia, serif'}}>{value}</p>
              <p className="font-light text-amber-900 text-sm" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>{label}</p>
              <p className="text-xs text-amber-700 font-light mt-2" style={{fontFamily: 'Georgia, serif'}}>{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 p-8 shadow-lg" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
          <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-amber-800 opacity-30"></div>
          <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-amber-800 opacity-30"></div>
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-amber-800 opacity-30"></div>
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-amber-800 opacity-30"></div>
          
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-light text-amber-950 text-lg" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.08em'}}>Thành Viên Gần Đây</h3>
            <Link to="/members" className="text-amber-900 hover:text-amber-800 text-sm font-light transition" style={{fontFamily: 'Georgia, serif'}}>Xem tất cả →</Link>
          </div>
          
          {/* Divider */}
          <div className="h-px bg-amber-900 opacity-20 mb-4"></div>
          
          <div className="space-y-3">
            {members.slice(-5).reverse().map(m => (
              <Link to={`/members/${m.id}`} key={m.id}
                className="flex items-center gap-3 p-2 hover:bg-amber-200 hover:bg-opacity-40 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${m.gender === 'male' ? 'bg-amber-200 text-amber-800' : 'bg-amber-100 text-amber-700'}`}>
                  {m.fullName.split(' ').pop()[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-light text-sm text-amber-950 truncate" style={{fontFamily: 'Georgia, serif'}}>{m.fullName}</p>
                  <p className="text-xs text-amber-700 font-light">Đời {m.generation}</p>
                </div>
                {m.isDeceased && <span className="text-xs text-amber-800 font-light">✞</span>}
              </Link>
            ))}
            {!members.length && <p className="text-center text-amber-700 py-6 text-sm font-light">Chưa có thành viên</p>}
          </div>
        </div>

        <div className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 p-8 shadow-lg" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
          <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-amber-800 opacity-30"></div>
          <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-amber-800 opacity-30"></div>
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-amber-800 opacity-30"></div>
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-amber-800 opacity-30"></div>
          
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-light text-amber-950 text-lg" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.08em'}}>Sự Kiện Sắp Tới</h3>
            <Link to="/events" className="text-amber-900 hover:text-amber-800 text-sm font-light transition" style={{fontFamily: 'Georgia, serif'}}>Xem tất cả →</Link>
          </div>
          
          {/* Divider */}
          <div className="h-px bg-amber-900 opacity-20 mb-4"></div>
          
          <div className="space-y-3">
            {events.map(ev => (
              <div key={ev.id} className="p-3 bg-amber-200 bg-opacity-20 rounded-sm border border-amber-900 border-opacity-20">
                <p className="font-light text-sm text-amber-950 truncate" style={{fontFamily: 'Georgia, serif'}}>{ev.name}</p>
                <p className="text-xs text-amber-700 font-light mt-1">
                  {new Date(ev.eventDate).toLocaleDateString('vi-VN')}
                  {ev.lunarDate && ` (${ev.lunarDate} Âm lịch)`}
                </p>
                {ev.location && <p className="text-xs text-amber-700 font-light">• {ev.location}</p>}
              </div>
            ))}
            {!events.length && <p className="text-center text-amber-700 py-6 text-sm font-light">Không có sự kiện sắp tới</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
