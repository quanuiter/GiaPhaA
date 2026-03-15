import { Handle, Position } from '@xyflow/react'
import { NODE_W, NODE_H } from '../../utils/treeLayout'

let _setMenu = null
export function registerMenuSetter(fn) { _setMenu = fn }

export default function MemberNode({ data }) {
  const isMale = data.gender === 'male'
  const dead   = data.isDeceased

  const cardBg = dead ? '#dcc9b6' : isMale ? '#fed7aa' : '#fde68a'
  const border = dead ? '#b89968' : isMale ? '#a16207' : '#d97706'
  const gearBg = dead ? '#8b6d47' : isMale ? '#92400e' : '#b45309'
  const badgeBg= dead ? '#6b5744' : isMale ? '#78350f' : '#a16207'

  const birthStr = data.birthDate
    ? new Date(data.birthDate).toLocaleDateString('vi-VN')
    : ''
  const deathStr = data.deathDate
    ? new Date(data.deathDate).toLocaleDateString('vi-VN')
    : ''

  // Rút gọn tên: lấy 2-3 từ cuối
  const nameParts = data.fullName?.trim().split(' ') ?? []
  const shortName = nameParts.length > 3 ? nameParts.slice(-3).join(' ') : data.fullName

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
        border: `2.5px solid ${border}`,
        borderRadius: 10,
        boxShadow: '0 3px 12px rgba(0,0,0,.18)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'relative', fontFamily: 'sans-serif',
        userSelect: 'none', opacity: dead ? 0.88 : 1,
        transition: 'box-shadow .15s, transform .15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 6px 22px rgba(0,0,0,.28)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 3px 12px rgba(0,0,0,.18)'
        e.currentTarget.style.transform = 'none'
      }}
    >
      {/* ── Handles ────────────────────────────────────────── */}
      {/* Top/Bottom: parent-child edges */}
      <Handle type="target" position={Position.Top}
        style={{ opacity: 0, pointerEvents: 'none', left: '50%' }}/>
      <Handle type="source" position={Position.Bottom}
        style={{ opacity: 0, pointerEvents: 'none', left: '50%' }}/>

      {/* Left/Right: spouse edges */}
      <Handle type="target" id="left"  position={Position.Left}
        style={{ opacity: 0, pointerEvents: 'none', top: '50%' }}/>
      <Handle type="source" id="right" position={Position.Right}
        style={{ opacity: 0, pointerEvents: 'none', top: '50%' }}/>

      {/* ── Badge đời ──────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 5, left: 5,
        background: badgeBg, color: '#fff',
        fontSize: 9, fontWeight: 800,
        padding: '1px 5px', borderRadius: 8,
        minWidth: 16, textAlign: 'center', lineHeight: 1.6,
      }}>
        {data.generation}
      </div>

      {/* ── Gear ⚙ ─────────────────────────────────────────── */}
      <button
        onClick={openMenu}
        title="Tùy chọn"
        style={{
          position: 'absolute', top: 5, right: 5,
          width: 22, height: 22, borderRadius: 4,
          background: gearBg, border: 'none', cursor: 'pointer',
          color: '#fff', fontSize: 12, zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,.3)',
        }}
      >⚙</button>

      {/* ── Avatar ─────────────────────────────────────────── */}
      <div style={{
        width: 68, height: 68, borderRadius: '50%',
        background: dead ? '#e5dcc8' : 'rgba(255,255,255,0.6)',
        border: '3px solid rgba(255,255,255,.85)',
        marginTop: 28, overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,.12)', flexShrink: 0,
      }}>
        {data.avatarUrl ? (
          <img src={`http://localhost:3001${data.avatarUrl}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt=""/>
        ) : (
          <svg viewBox="0 0 80 80" width="62" height="62">
            <circle cx="40" cy="28" r="18"
              fill={dead ? '#a89968' : isMale ? '#b45309' : '#d97706'}/>
            <ellipse cx="40" cy="76" rx="30" ry="22"
              fill={dead ? '#a89968' : isMale ? '#b45309' : '#d97706'}/>
          </svg>
        )}
      </div>

      {/* ── Tên ────────────────────────────────────────────── */}
      <div style={{
        marginTop: 7, fontSize: 11.5, fontWeight: 700,
        color: dead ? '#78350f' : '#5a3a1f',
        textAlign: 'center', padding: '0 8px',
        lineHeight: 1.3, maxWidth: '100%',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {dead && <span style={{ fontSize: 10, marginRight: 2 }}>✝</span>}
        {shortName}
      </div>

      {/* ── Nickname ───────────────────────────────────────── */}
      {data.nickname && (
        <div style={{
          fontSize: 9.5, color: dead ? '#8b5a2b' : '#8b5a2b',
          fontStyle: 'italic', marginTop: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: '90%', textAlign: 'center',
        }}>
          ({data.nickname})
        </div>
      )}

      {/* ── Ngày ───────────────────────────────────────────── */}
      <div style={{
        fontSize: 9.5, color: dead ? '#8b5a2b' : '#a16207',
        marginTop: data.nickname ? 2 : 4, textAlign: 'center',
        lineHeight: 1.4, padding: '0 4px',
      }}>
        {birthStr}{deathStr ? ` - ${deathStr}` : ''}
      </div>
    </div>
  )
}
