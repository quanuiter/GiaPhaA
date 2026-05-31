import { useState, useMemo, useEffect } from 'react'
import { FloatModal, Section, Field } from '../FloatModal'
import { processKinship, buildAncestorTable } from '../../../utils/kinshipEngine'

// ── Component Ô chọn tích hợp Tìm kiếm ────────────────────────
function SearchSelect({ value, onChange, options, placeholder }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  // Đồng bộ text khi value thay đổi
  useEffect(() => {
    if (value) {
      const opt = options.find(o => String(o.value) === String(value))
      if (opt) setQuery(opt.label)
    } else {
      setQuery('')
    }
  }, [value, options])

  const normalize = str => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const filtered = options.filter(o => normalize(o.label).includes(normalize(query)))

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text" value={query}
        onChange={e => {
          setQuery(e.target.value); setOpen(true);
          if (value) onChange(''); // Xóa value đang chọn nếu người dùng gõ sửa lại
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #d4c9b8', outline: 'none', background: '#fff', color: '#5a3a1f' }}
      />
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #d4c9b8', zIndex: 10, maxHeight: 200, overflowY: 'auto', borderRadius: 6, marginTop: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 10, color: '#999', fontSize: 13 }}>Không tìm thấy</div>
          ) : (
            filtered.map(o => (
              <div key={o.value} onClick={() => { onChange(o.value); setQuery(o.label); setOpen(false); }} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', fontSize: 13, color: '#5a3a1f' }} onMouseEnter={e => e.currentTarget.style.background = '#fef3c7'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                {o.label}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function KinshipModal({ data, onClose }) {
  const { members = [], marriages = [] } = data || {}
  const [personA, setPersonA] = useState('')
  const [personB, setPersonB] = useState('')
  const [result, setResult] = useState(null)

  const memberById = useMemo(() => {
    const map = {}
    members.forEach(m => map[m.id] = m)
    return map
  }, [members])

  // Cache Ancestor Table để tránh tính toán lại mỗi lần bấm Tra cứu
  const ancestorTable = useMemo(() => buildAncestorTable(members), [members])

  const handleCalculate = () => {
    if (!personA || !personB) return
    if (personA === personB) {
      setResult({ path: [], message: 'Hai người được chọn là cùng một người!' })
      return
    }

    const kinshipData = processKinship(+personA, +personB, memberById, ancestorTable, marriages)
    
    if (kinshipData.error) {
      setResult({ path: null, message: kinshipData.error })
    } else {
      setResult({ path: kinshipData.path, title: kinshipData.title, message: '' })
    }
  }

  const handleSwap = () => {
    const temp = personA;
    setPersonA(personB);
    setPersonB(temp);
    setResult(null);
  }

  const renderPath = () => {
    if (!result) return null;
    if (result.message) return <div style={{ color: '#b45309', padding: 10, textAlign: 'center', background: '#fef3c7', borderRadius: 8, marginTop: 16 }}>{result.message}</div>;

    const genA = memberById[personA]?.generation || 1;
    const genB = memberById[personB]?.generation || 1;
    const title = result.title;

    return (
      <div style={{ marginTop: 20, borderTop: '1px solid #d4c9b8', paddingTop: 20 }}>
        <h4 style={{ fontSize: 15, color: '#78350f', marginBottom: 10, fontFamily: 'Georgia, serif' }}>Kết quả tra cứu:</h4>
        <div style={{ background: '#fef3c7', padding: 16, borderRadius: 8, border: '1px solid #fde68a', marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: '#5a3a1f' }}>
            <strong style={{ color: '#b45309' }}>{memberById[personA]?.fullName}</strong> gọi <strong style={{ color: '#b45309' }}>{memberById[personB]?.fullName}</strong> là:
          </div>
          <div style={{ fontSize: 24, fontWeight: 'bold', color: '#92400e', marginTop: 8, fontFamily: 'Georgia, serif' }}>{title}</div>
          <div style={{ fontSize: 13, color: '#8b5a2b', marginTop: 8 }}>Cách nhau: <strong>{Math.abs(genA - genB)} đời</strong> {genA === genB ? ' (Cùng thế hệ)' : genA > genB ? ' (Bề trên)' : ' (Bề dưới)'}</div>
        </div>

        <h5 style={{ fontSize: 13, color: '#8b5a2b', marginBottom: 10, fontWeight: 600 }}>Sơ đồ kết nối:</h5>
        <div style={{ background: '#faf8f3', padding: '30px 20px', borderRadius: 8, border: '1px solid #e5dcc8', overflowX: 'auto' }}>
          {renderTree()}
        </div>
      </div>
    )
  }

  const renderTree = () => {
    if (!result || !result.path) return null;

    const sequence = [+personA, ...result.path.map(p => p.to)];
    const gens = sequence.map(id => memberById[id]?.generation || 1);
    const minGen = Math.min(...gens);
    const maxGen = Math.max(...gens);

    const NODE_W = 130;
    const NODE_H = 64;
    const GAP_X = 60;
    const GAP_Y = 50;

    const width = sequence.length * NODE_W + (sequence.length - 1) * GAP_X;
    const height = (maxGen - minGen + 1) * NODE_H + (maxGen - minGen) * GAP_Y + 30; // +30 để lấy không gian cho nhãn

    const points = sequence.map((id, i) => {
      const gen = memberById[id]?.generation || 1;
      return {
        id,
        cx: i * (NODE_W + GAP_X) + NODE_W / 2,
        cy: (gen - minGen) * (NODE_H + GAP_Y) + NODE_H / 2 + 15,
        gen
      };
    });

    return (
      <div style={{ position: 'relative', width, height, margin: '0 auto' }}>
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          {result.path.map((step, i) => {
            const p1 = points[i];
            const p2 = points[i + 1];

            const toMember = memberById[step.to];
            let label = '';
            if (step.type === 'parent') label = toMember?.gender === 'male' ? 'Cha' : 'Mẹ';
            else if (step.type === 'child') label = toMember?.gender === 'male' ? 'Con trai' : 'Con gái';
            else label = toMember?.gender === 'male' ? 'Chồng' : 'Vợ';

            let pathD = '';
            if (p1.cy === p2.cy) {
              pathD = `M ${p1.cx},${p1.cy} L ${p2.cx},${p2.cy}`; // Đường thẳng nếu cùng đời (Hôn nhân)
            } else {
              const midY = (p1.cy + p2.cy) / 2;
              pathD = `M ${p1.cx},${p1.cy} C ${p1.cx},${midY} ${p2.cx},${midY} ${p2.cx},${p2.cy}`; // Cong mềm mại
            }

            const midX = (p1.cx + p2.cx) / 2;
            const midY = (p1.cy + p2.cy) / 2;

            return (
              <g key={i}>
                <path d={pathD} fill="none" stroke="#d4c9b8" strokeWidth="2" strokeDasharray={step.type === 'spouse' ? '5 5' : 'none'} />
                <rect x={midX - 30} y={midY - 10} width="60" height="20" rx="10" fill="#fff" stroke="#d4c9b8" />
                <text x={midX} y={midY + 4} textAnchor="middle" fill="#92400e" fontSize="10" fontWeight="600">{label}</text>
              </g>
            );
          })}
        </svg>

        {points.map((p, i) => {
          const m = memberById[p.id];
          const isCaller = i === 0;
          const isTarget = i === sequence.length - 1;
          const isHighlight = isCaller || isTarget;

          return (
            <div key={i} style={{
              position: 'absolute', left: p.cx - NODE_W / 2, top: p.cy - NODE_H / 2,
              width: NODE_W, height: NODE_H,
              background: isHighlight ? '#fef3c7' : '#fff',
              border: `2px solid ${isHighlight ? '#b45309' : '#d4c9b8'}`,
              borderRadius: 8,
              boxShadow: isHighlight ? '0 4px 12px rgba(180, 83, 9, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              zIndex: 2, padding: '4px'
            }}>
              {isHighlight && (
                <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#b45309', color: '#fff', fontSize: 10, padding: '2px 8px', borderRadius: 10, whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                  {isCaller ? 'Người gọi' : 'Được gọi'}
                </div>
              )}
              <div style={{ fontWeight: isHighlight ? 'bold' : 'normal', color: isHighlight ? '#92400e' : '#5a3a1f', fontSize: 13, lineHeight: 1.2, textAlign: 'center', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {m?.fullName}
              </div>
              <div style={{ fontSize: 11, color: '#8b5a2b', marginTop: 4 }}>Đời {m?.generation}</div>
            </div>
          )
        })}
      </div>
    )
  }

  const memberOptions = useMemo(() => {
    return members.map(m => ({ value: m.id, label: `${m.fullName} (Đời ${m.generation})` }))
  }, [members])

  return (
    <FloatModal title="Tra Cứu Quan Hệ Xưng Hô" subtitle="Xác định mối quan hệ giữa 2 người trong họ" onClose={onClose} width={800}>
      <Section>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Field label="Người thứ 1 (Người gọi)" required>
            <SearchSelect value={personA} onChange={v => { setPersonA(v); setResult(null) }} options={memberOptions} placeholder="Nhập để tìm kiếm..." />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0' }}>
            <button
              onClick={handleSwap}
              style={{ padding: '6px 12px', background: '#fef3c7', border: '1px solid #d4c9b8', borderRadius: 20, cursor: 'pointer', color: '#b45309', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, zIndex: 2 }}
              title="Hoán đổi"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
              Hoán đổi
            </button>
          </div>

          <Field label="Người thứ 2 (Người được gọi)" required>
            <SearchSelect value={personB} onChange={v => { setPersonB(v); setResult(null) }} options={memberOptions} placeholder="Nhập để tìm kiếm..." />
          </Field>
          <button onClick={handleCalculate} disabled={!personA || !personB} style={{ background: '#b45309', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, marginTop: 8, opacity: (!personA || !personB) ? 0.5 : 1 }}>Tra Cứu</button>
        </div>
      </Section>
      {renderPath()}
    </FloatModal>
  )
}