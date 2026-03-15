// ─── Modal nổi ────────────────────────────────────────────────
export function FloatModal({ title, subtitle, onClose, children, width = 480 }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#fff', borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,.25)',
        width, maxHeight: '92vh', overflowY: 'auto',
        padding: '22px 26px', boxSizing: 'border-box',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#78350f' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12, color: '#a16207', marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{
            border: 'none', background: '#fef3c7', borderRadius: 8,
            width: 30, height: 30, cursor: 'pointer', fontSize: 15, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#8b5a2b', flexShrink: 0, marginLeft: 12,
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Section header trong form ────────────────────────────────
export function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color: '#8b5a2b',
        textTransform: 'uppercase', letterSpacing: 0.8,
        borderBottom: '1px solid #fef3c7', paddingBottom: 5, marginBottom: 12,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

// ─── Grid 2 cột ───────────────────────────────────────────────
export function Grid2({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
      {children}
    </div>
  )
}

// ─── Field ───────────────────────────────────────────────────
export function Field({ label, required, span, children }) {
  return (
    <div style={{ marginBottom: 12, gridColumn: span ? `span ${span}` : undefined }}>
      <label style={{
        display: 'block', fontSize: 11.5, fontWeight: 600,
        color: '#8b5a2b', marginBottom: 5,
      }}>
        {label}{required && <span style={{ color: '#b45309', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

// ─── Base style ────────────────────────────────────────────────
const base = {
  width: '100%', border: '1px solid #d4c9b8', borderRadius: 8,
  padding: '7px 10px', fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', color: '#5a3a1f',
  background: '#fffbf5', transition: 'border-color .15s',
}
const focus = e => { e.target.style.borderColor = '#b45309'; e.target.style.boxShadow = '0 0 0 3px #fed7aa' }
const blur  = e => { e.target.style.borderColor = '#d4c9b8'; e.target.style.boxShadow = 'none' }

export function Input({ type = 'text', value, onChange, placeholder, maxLength, min, max, disabled }) {
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder}
    maxLength={maxLength} min={min} max={max} disabled={disabled}
    style={{ ...base, background: disabled ? '#f5f1e8' : '#fffbf5', cursor: disabled ? 'not-allowed' : undefined }}
    onFocus={focus} onBlur={blur}/>
}

export function Select({ value, onChange, children, disabled }) {
  return (
    <select value={value} onChange={onChange} disabled={disabled}
      style={{ ...base, cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? '#f5f1e8' : '#fffbf5', appearance: 'auto' }}
      onFocus={focus} onBlur={blur}>
      {children}
    </select>
  )
}

export function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
    style={{ ...base, resize: 'vertical', lineHeight: 1.5 }}
    onFocus={focus} onBlur={blur}/>
}

// ─── Banner thông tin ─────────────────────────────────────────
export function InfoBanner({ color = '#1d4ed8', bg = '#eff6ff', border, children }) {
  return (
    <div style={{
      padding: '9px 13px', marginBottom: 14,
      background: bg, border: `1px solid ${border ?? color + '33'}`,
      borderRadius: 8, fontSize: 12, color, lineHeight: 1.6,
    }}>
      {children}
    </div>
  )
}

// ─── Nút hành động ────────────────────────────────────────────
export function ModalButtons({ onCancel, onOk, okLabel = 'Lưu', okColor = '#b45309', loading, danger }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end', borderTop: '1px solid #fef3c7', paddingTop: 16 }}>
      <button onClick={onCancel} style={{
        padding: '8px 18px', border: '1px solid #d4c9b8',
        borderRadius: 8, background: '#fffbf5', cursor: 'pointer',
        fontSize: 13, color: '#8b5a2b', fontWeight: 500,
      }}>Hủy</button>
      <button onClick={onOk} disabled={loading} style={{
        padding: '8px 22px', border: 'none', borderRadius: 8,
        background: danger ? '#b45309' : okColor,
        color: '#fff', cursor: loading ? 'wait' : 'pointer',
        fontSize: 13, fontWeight: 700, opacity: loading ? 0.6 : 1,
        transition: 'opacity .15s',
      }}>
        {loading ? 'Đang lưu...' : okLabel}
      </button>
    </div>
  )
}
