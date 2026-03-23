import { useState, useMemo, useEffect } from 'react'
import { FloatModal, Section, Field } from '../FloatModal'

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

  // Biến mảng dữ liệu thành Đồ thị vô hướng để tìm đường
  const graph = useMemo(() => {
    const g = {}
    members.forEach(m => g[m.id] = [])
    members.forEach(m => {
      if (m.fatherId && g[m.fatherId]) {
        g[m.id].push({ to: m.fatherId, relType: 'parent' }) // Đi lên cha
        g[m.fatherId].push({ to: m.id, relType: 'child' })  // Đi xuống con
      }
      if (m.motherId && g[m.motherId]) {
        g[m.id].push({ to: m.motherId, relType: 'parent' }) // Đi lên mẹ
        g[m.motherId].push({ to: m.id, relType: 'child' })  // Đi xuống con
      }
    })
    marriages.forEach(mar => {
      if (g[mar.husbandId] && g[mar.wifeId]) {
        g[mar.husbandId].push({ to: mar.wifeId, relType: 'spouse' })
        g[mar.wifeId].push({ to: mar.husbandId, relType: 'spouse' })
      }
    })
    return g
  }, [members, marriages])

  const handleCalculate = () => {
    if (!personA || !personB) return
    if (personA === personB) {
      setResult({ path: [], message: 'Hai người được chọn là cùng một người!' })
      return
    }

    // Thuật toán BFS (Breadth-First Search) tìm đường đi ngắn nhất
    const queue = [{ id: +personA, path: [] }]
    const visited = new Set([+personA])
    let foundPath = null

    while (queue.length > 0) {
      const curr = queue.shift()
      if (curr.id === +personB) {
        foundPath = curr.path
        break
      }
      const neighbors = graph[curr.id] || []
      for (const edge of neighbors) {
        if (!visited.has(edge.to)) {
          visited.add(edge.to)
          queue.push({
            id: edge.to,
            path: [...curr.path, { from: curr.id, to: edge.to, relType: edge.relType }]
          })
        }
      }
    }

    if (foundPath) {
      setResult({ path: foundPath, message: '' })
    } else {
      setResult({ path: null, message: 'Không tìm thấy mối liên kết nào giữa 2 người này trong phả đồ.' })
    }
  }

  const handleSwap = () => {
    const temp = personA;
    setPersonA(personB);
    setPersonB(temp);
    setResult(null);
  }

  const guessTitle = (path) => {
    if (!path || path.length === 0) return "Bản thân";
    const up = path.filter(p => p.relType === 'parent').length;
    const down = path.filter(p => p.relType === 'child').length;
    const sp = path.filter(p => p.relType === 'spouse').length;
    
    if (up > 4 || down > 4) return "Khó xác định (Quá 5 đời)";
    if (sp > 1) return "Khó xác định (Thông qua nhiều hôn nhân)";

    const a = memberById[personA];
    const b = memberById[personB];
    const genderB = b?.gender;

    // Tiện ích lấy năm sinh so sánh lớn/nhỏ
    const getYear = (m) => m?.birthDate ? new Date(m.birthDate).getFullYear() : 0;
    
    // 1. Trực hệ đi lên (Tổ tiên)
    if (up > 0 && down === 0 && sp === 0) {
       if (up === 1) return genderB === 'male' ? 'Cha' : 'Mẹ';
       if (up === 2) {
         const parentOfA = memberById[path[0].to];
         if (parentOfA.gender === 'male') return genderB === 'male' ? 'Ông nội' : 'Bà nội';
         return genderB === 'male' ? 'Ông ngoại' : 'Bà ngoại';
       }
       if (up === 3) {
         const parentOfA = memberById[path[0].to];
         if (parentOfA.gender === 'male') return genderB === 'male' ? 'Ông cố nội (Cụ nội)' : 'Bà cố nội (Cụ nội)';
         return genderB === 'male' ? 'Ông cố ngoại (Cụ ngoại)' : 'Bà cố ngoại (Cụ ngoại)';
       }
       if (up === 4) return genderB === 'male' ? 'Kỵ ông' : 'Kỵ bà';
    }

    // 2. Trực hệ đi xuống (Hậu duệ)
    if (down > 0 && up === 0 && sp === 0) {
       if (down === 1) return genderB === 'male' ? 'Con trai' : 'Con gái';
       if (down === 2) {
         const childOfA = memberById[path[0].to];
         if (childOfA.gender === 'male') return genderB === 'male' ? 'Cháu nội (Nam / Đích tôn)' : 'Cháu nội (Nữ)';
         return genderB === 'male' ? 'Cháu ngoại (Nam)' : 'Cháu ngoại (Nữ)';
       }
       if (down === 3) return 'Chắt';
       if (down === 4) return 'Chút';
    }
    
    // 3. Vợ chồng
    if (sp === 1 && up === 0 && down === 0) return genderB === 'male' ? 'Chồng' : 'Vợ';

    // 4. Các mối quan hệ thông qua 1 lần Hôn nhân (sp=1)
    if (sp === 1) {
      if (up === 1 && down === 0) {
        if (path[0].relType === 'spouse') return genderB === 'male' ? 'Cha vợ/chồng' : 'Mẹ vợ/chồng';
        if (path[0].relType === 'parent') return genderB === 'male' ? 'Dượng (Cha dượng)' : 'Mẹ kế';
      }
      if (up === 0 && down === 1) {
        if (path[0].relType === 'spouse') return genderB === 'male' ? 'Con riêng của vợ/chồng (Nam)' : 'Con riêng của vợ/chồng (Nữ)';
        if (path[0].relType === 'child') return genderB === 'male' ? 'Con rể' : 'Con dâu';
      }
      if (up === 1 && down === 1) {
        if (path[0].relType === 'spouse') {
          const aSpouse = memberById[path[0].to];
          const ySp = getYear(aSpouse), yB = getYear(b);
          if (ySp && yB && yB < ySp) return genderB === 'male' ? 'Anh vợ/chồng' : 'Chị vợ/chồng';
          return genderB === 'male' ? 'Em vợ/chồng (Nam)' : 'Em vợ/chồng (Nữ)';
        }
        if (path[path.length - 1].relType === 'spouse') {
          const sibling = memberById[path[1].to];
          const yA = getYear(a), ySib = getYear(sibling);
          if (yA && ySib && ySib < yA) return genderB === 'male' ? 'Anh rể' : 'Chị dâu';
          return genderB === 'male' ? 'Em rể' : 'Em dâu';
        }
      }

      // Vợ/chồng của cô dì chú bác (Bác dâu/Thím/Dượng/Mợ)
      if (up === 2 && down === 1 && path[path.length - 1].relType === 'spouse') {
        const parentA = memberById[path[0].to];
        const parentB = memberById[path[2].to];
        const isPaternal = parentA.gender === 'male';
        const isParentBOlder = (getYear(parentB) && getYear(parentA)) ? getYear(parentB) < getYear(parentA) : false;
        
        if (isPaternal) {
          if (parentB.gender === 'male') {
            return isParentBOlder ? 'Bác gái (vợ bác trai)' : 'Thím (vợ chú)';
          } else {
            return isParentBOlder ? 'Bác trai (chồng bác gái)' : 'Dượng (chồng cô)';
          }
        } else {
          if (parentB.gender === 'male') return 'Mợ (vợ cậu)';
          return 'Dượng (chồng dì)';
        }
      }
    }
    
    // 5. Anh chị em ruột
    if (up === 1 && down === 1 && sp === 0) {
       const yA = getYear(a), yB = getYear(b);
       if (yA && yB && yA !== yB) return yB < yA ? (genderB === 'male' ? 'Anh ruột' : 'Chị ruột') : (genderB === 'male' ? 'Em trai ruột' : 'Em gái ruột');
       return genderB === 'male' ? 'Anh/Em trai ruột' : 'Chị/Em gái ruột';
    }
    
    // 6. Bác, Chú, Cô, Cậu, Dì
    if (up === 2 && down === 1 && sp === 0) {
       const pA = memberById[path[0].to];
       const isPaternal = pA.gender === 'male';
       const isBOlder = (getYear(pA) && getYear(b)) ? (getYear(b) < getYear(pA)) : false;
       if (isPaternal) {
         if (b.gender === 'male') return isBOlder ? 'Bác (bác trai)' : 'Chú';
         return isBOlder ? 'Bác gái' : 'Cô';
       } else {
         if (b.gender === 'male') return 'Cậu';
         return 'Dì';
       }
    }
    
    if (up === 1 && down === 2 && sp === 0) return 'Cháu';
    
    // 7. Anh chị em họ
    if (up === 2 && down === 2 && sp === 0) {
       const pA = memberById[path[0].to], pB = memberById[path[path.length - 2].to];
       let isParentBOlder = null;
       if (getYear(pA) && getYear(pB)) isParentBOlder = getYear(pB) < getYear(pA);
       else if (getYear(a) && getYear(b)) isParentBOlder = getYear(b) < getYear(a);

       if (isParentBOlder !== null) return isParentBOlder ? (genderB === 'male' ? 'Anh họ' : 'Chị họ') : (genderB === 'male' ? 'Em họ (nam)' : 'Em họ (nữ)');
       return genderB === 'male' ? 'Anh/Em họ' : 'Chị/Em họ';
    }

    // 8. Ông/bà họ (Anh chị em của ông bà)
    if (up === 3 && down === 1 && sp === 0) {
      const pA = memberById[path[0].to], gp = memberById[path[1].to];
      const isBOlder = (getYear(b) && getYear(gp)) ? getYear(b) < getYear(gp) : false;
      if (b.gender === 'male') return isBOlder ? 'Ông bác' : 'Ông chú';
      return isBOlder ? 'Bà bác' : (gp.gender === 'male' ? 'Bà cô' : 'Bà dì');
    }

    if (up === 1 && down === 3 && sp === 0) return 'Cháu (gọi bằng ông/bà)';

    // 9. Quan hệ xa hơn
    if (up > 0 && down > 0 && sp === 0) {
       if (up === down) return 'Anh/Chị/Em họ xa (cùng đời)';
       if (up > down) return genderB === 'male' ? `Bề trên nam (cách ${up - down} đời)` : `Bề trên nữ (cách ${up - down} đời)`;
       return 'Cháu';
    }

    // 10. Fallback chung cho tất cả các trường hợp vai vế nhỏ hơn (bề dưới)
    const genA = a?.generation || 1;
    const genB = b?.generation || 1;
    if (genB > genA) return 'Cháu';

    return "Khó xác định (Quá phức tạp)";
  }

  const renderPath = () => {
    if (!result) return null;
    if (result.message) return <div style={{ color: '#b45309', padding: 10, textAlign: 'center', background: '#fef3c7', borderRadius: 8, marginTop: 16 }}>{result.message}</div>;

    const genA = memberById[personA]?.generation || 1;
    const genB = memberById[personB]?.generation || 1;
    const title = guessTitle(result.path);

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
            if (step.relType === 'parent') label = toMember?.gender === 'male' ? 'Cha' : 'Mẹ';
            else if (step.relType === 'child') label = toMember?.gender === 'male' ? 'Con trai' : 'Con gái';
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
                <path d={pathD} fill="none" stroke="#d4c9b8" strokeWidth="2" strokeDasharray={step.relType === 'spouse' ? '5 5' : 'none'} />
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
            <SearchSelect value={personA} onChange={v => {setPersonA(v); setResult(null)}} options={memberOptions} placeholder="Nhập để tìm kiếm..." />
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
            <SearchSelect value={personB} onChange={v => {setPersonB(v); setResult(null)}} options={memberOptions} placeholder="Nhập để tìm kiếm..." />
          </Field>
          <button onClick={handleCalculate} disabled={!personA || !personB} style={{ background: '#b45309', color: '#fff', border: 'none', padding: '10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, marginTop: 8, opacity: (!personA || !personB) ? 0.5 : 1 }}>Tra Cứu</button>
        </div>
      </Section>
      {renderPath()}
    </FloatModal>
  )
}