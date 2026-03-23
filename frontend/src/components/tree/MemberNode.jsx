import { Handle, Position } from '@xyflow/react'
import { NODE_W, NODE_H } from '../../utils/treeLayout'

let _setMenu = null
export function registerMenuSetter(fn) { _setMenu = fn }

export default function MemberNode({ data }) {
  const isBloodline = data.isBloodline !== false;
  const isDeceased = data.isDeceased;

  // Phân biệt màu nền và viền (Vàng tươi, Vàng be hoặc Xám tro nếu đã khuất)
  const cardBg = isDeceased ? '#d1d5db' : (isBloodline ? '#fcd34d' : '#fef3c7');
  const border = isDeceased ? '#6b7280' : '#b45309'; 

  // Tên rút gọn
  const nameParts = data.fullName?.trim().split(' ') ?? []
  const shortName = nameParts.length > 3 ? nameParts.slice(-3).join(' ') : data.fullName

  // Ngày sinh
  const birthStr = data.birthDate 
    ? `ns: ${new Date(data.birthDate).getFullYear()}` 
    : 'ns: Không rõ'

  const openMenu = (e) => {
    e.stopPropagation()
    const r = e.currentTarget.getBoundingClientRect()
    _setMenu?.({ member: data, x: r.left + r.width / 2, y: r.bottom + 8 })
  }

  return (
    <div
      style={{
        width: NODE_W, height: NODE_H,
        background: cardBg,
        border: `4px solid ${border}`,
        borderRadius: 12,
        boxShadow: `inset 0 0 6px rgba(0,0,0,0.3), 3px 5px 12px rgba(0,0,0,0.2)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'relative', fontFamily: '"Georgia", serif',
        userSelect: 'none', opacity: isDeceased ? 0.9 : 1,
        transition: 'transform .15s, box-shadow .15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = `inset 0 0 8px rgba(0,0,0,0.4), 4px 8px 16px rgba(0,0,0,0.3)`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = `inset 0 0 6px rgba(0,0,0,0.3), 3px 5px 12px rgba(0,0,0,0.2)`
      }}
    >
      {/* ── Handles ────────────────────────────────────────── */}
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }}/>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }}/>
      <Handle type="target" id="left"  position={Position.Left} style={{ opacity: 0 }}/>
      <Handle type="source" id="right" position={Position.Right} style={{ opacity: 0 }}/>

      {/* ── Badge đời ──────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: -10, left: -10,
        width: 26, height: 26, borderRadius: '50%',
        background: border, color: '#fff',
        fontSize: 11, fontWeight: 'bold',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '2px solid #fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}>
        {data.generation}
      </div>

      {/* ── Icon Mắt 👁 ─────────────────────────────────────────── */}
      <button
        onClick={openMenu}
        title="Tùy chọn"
        style={{
          position: 'absolute', top: 4, right: 4,
          width: 28, height: 28, borderRadius: '50%',
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: border, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.08)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
      </button>

      {/* ── Avatar ─────────────────────────────────────────── */}
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: '#e5e7eb', // xám đơn giản
        border: `3px solid ${border}`,
        marginTop: 24, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
      }}>
        {data.avatarUrl ? (
          <img src={`http://localhost:3001${data.avatarUrl}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt=""/>
        ) : (
          <svg viewBox="0 0 24 24" fill="#9ca3af" width="36" height="36">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        )}
      </div>

      {/* ── Tên ────────────────────────────────────────────── */}
      <div style={{
        marginTop: 14, fontSize: 14, fontWeight: 'bold',
        color: isDeceased ? '#374151' : '#5a3a1f',
        textAlign: 'center', padding: '0 8px',
        lineHeight: 1.2, width: '100%',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
      }}>
        {shortName}
      </div>

      <div style={{
        fontSize: 12, color: isDeceased ? '#4b5563' : '#78350f',
        marginTop: 8, textAlign: 'center',
      }}>
        {birthStr}
      </div>

      {isDeceased && (
        <div style={{ position: 'absolute', bottom: 6, right: 8, fontSize: 14, color: '#4b5563', fontWeight: 'bold' }}>✝</div>
      )}
    </div>
  )
}
