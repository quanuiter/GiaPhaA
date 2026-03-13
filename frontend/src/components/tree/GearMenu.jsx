import { useEffect } from 'react'

const ITEMS = [
  { key: 'view',   icon: '👁',  label: 'Xem chi tiết'         },
  { key: 'edit',   icon: '✏️',  label: 'Chỉnh sửa thông tin'  },
  { key: 'child',  icon: '👶',  label: 'Thêm con'              },
  { key: 'spouse', icon: '💍',  label: 'Thêm hôn thê'          },
  { key: 'copy',   icon: '📋',  label: 'Sao chép thông tin'    },
  { key: 'sep' },
  { key: 'delete', icon: '🗑',  label: 'Xóa thành viên', danger: true },
]

export default function GearMenu({ menu, onAction, onClose, canEdit, isAdmin }) {
  useEffect(() => {
    const fn = (e) => { if (!e.target.closest('[data-gear-menu]')) onClose() }
    document.addEventListener('click', fn)
    return () => document.removeEventListener('click', fn)
  }, [onClose])

  if (!menu) return null
  const { member, x, y } = menu
  const safeX = Math.min(x, window.innerWidth  - 230)
  const safeY = Math.min(y, window.innerHeight - 300)

  return (
    <div
      data-gear-menu
      style={{
        position: 'fixed', left: safeX, top: safeY, zIndex: 9998,
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,.18)', minWidth: 215, overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 1 }}>
          {member.fullName}
        </div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>
          Đời {member.generation} · {member.gender === 'male' ? '♂ Nam' : '♀ Nữ'}
          {member.isDeceased ? ' · ✝ Đã mất' : ''}
        </div>
      </div>

      {ITEMS.map((item, idx) => {
        if (item.key === 'sep') return (
          <div key={idx} style={{ height: 1, background: '#f3f4f6', margin: '2px 0' }}/>
        )
        if (['edit','child','spouse'].includes(item.key) && !canEdit) return null
        if (item.key === 'delete' && !isAdmin) return null
        return (
          <button
            key={item.key}
            onClick={() => { onClose(); onAction(item.key, member) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '9px 14px',
              border: 'none', background: 'none', cursor: 'pointer',
              fontSize: 13, textAlign: 'left',
              color: item.danger ? '#dc2626' : '#374151',
            }}
            onMouseEnter={e => e.currentTarget.style.background = item.danger ? '#fef2f2' : '#f9fafb'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <span style={{ width: 20, textAlign: 'center', fontSize: 14 }}>{item.icon}</span>
            {item.label}
          </button>
        )
      })}
    </div>
  )
}