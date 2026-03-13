import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

export default function EventsPage() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(r => r.data)
  })

  const typeLabel = { anniversary: 'Ngày giỗ', meeting: 'Họp họ', other: 'Sự kiện khác' }

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

      {isLoading
        ? <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900 opacity-40"/></div>
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(ev => (
              <div key={ev.id} className="relative bg-gradient-to-b from-amber-100 to-amber-50 rounded-sm border-2 border-amber-900 border-opacity-20 p-6 shadow-lg" style={{boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'}}>
                <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-amber-800 opacity-30"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-amber-800 opacity-30"></div>
                <div>
                  <span className="text-xs font-light text-amber-800" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.05em'}}>• {typeLabel[ev.type]}</span>
                  <p className="font-light text-amber-950 mt-2 text-lg" style={{fontFamily: 'Georgia, serif'}}>{ev.name}</p>
                </div>
                <div className="mt-4 space-y-2 text-sm text-amber-800 font-light" style={{fontFamily: 'Georgia, serif'}}>
                  <p>{new Date(ev.eventDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  {ev.location && <p>• {ev.location}</p>}
                  {ev.relatedMember && <p>• {ev.relatedMember.fullName}</p>}
                  {ev.note && <p className="text-xs text-amber-700 italic mt-2">{ev.note}</p>}
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="col-span-3 text-center py-16 text-amber-700 font-light">Chưa có sự kiện nào</div>
            )}
          </div>
        )
      }
    </div>
  )
}
