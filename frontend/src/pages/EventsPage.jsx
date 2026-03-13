import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { cls } from '../components/ui'
export default function EventsPage() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => api.get('/events').then(r => r.data)
  })

  const typeLabel = { anniversary: '🕯️ Ngày giỗ', meeting: '📅 Họp họ', other: '📌 Sự kiện khác' }
  const typeColor = { anniversary: 'bg-gray-100', meeting: 'bg-blue-50', other: 'bg-green-50' }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold text-gray-800">Sự kiện dòng họ</h2>
      {isLoading
        ? <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"/></div>
        : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map(ev => (
              <div key={ev.id} className={`card ${typeColor[ev.type]} border-0`}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-medium text-gray-500">{typeLabel[ev.type]}</span>
                    <p className="font-semibold text-gray-800 mt-1">{ev.name}</p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-gray-600">
                  <p>📅 {new Date(ev.eventDate).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  {ev.location && <p>📍 {ev.location}</p>}
                  {ev.relatedMember && <p>👤 {ev.relatedMember.fullName}</p>}
                  {ev.note && <p className="text-xs text-gray-400 italic">{ev.note}</p>}
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="col-span-3 text-center py-16 text-gray-400">Chưa có sự kiện nào</div>
            )}
          </div>
        )
      }
    </div>
  )
}