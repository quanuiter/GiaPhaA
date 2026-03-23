/**
 * TreePage — Phả đồ React Flow
 *
 * Thay đổi vs phiên bản cũ:
 *  - KHÔNG dùng marriage node. Vợ chồng nối nhau bằng đường ngang đơn giản.
 *  - Layout thuật toán riêng (treeLayout.js): không chồng chéo, không dagre.
 *  - Đường nối con cái từ người mang huyết thống (fatherId ưu tiên).
 *  - Nhiều hôn nhân được hiển thị đầy đủ, ly hôn/góa dùng nét đứt.
 *  - Form đầy đủ BM1 + BM2.
 */
import { useEffect, useState, useCallback } from 'react'
import {
  ReactFlow, Controls, MiniMap,
  useNodesState, useEdgesState,
  useReactFlow, ReactFlowProvider, useViewport, useNodes
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { useAuthStore } from '../store/authStore'
import { treeApi } from '../services/api'
import { buildGraph, MARRIAGE_COLORS } from '../utils/treeLayout'

import MemberNode, { registerMenuSetter } from '../components/tree/MemberNode'
import GearMenu from '../components/tree/GearMenu'
import EditMemberModal   from '../components/tree/modals/EditMemberModal'
import AddChildModal     from '../components/tree/modals/AddChildModal'
import AddSpouseModal    from '../components/tree/modals/AddSpouseModal'
import DeleteMemberModal from '../components/tree/modals/DeleteMemberModal'
import KinshipModal      from '../components/tree/modals/KinshipModal'

const nodeTypes = { member: MemberNode }

const EDGE_OPTIONS = [
  { value: 'default',    label: '〜 Cong nhánh cây' },
  { value: 'smoothstep', label: '↪ Mềm mại (Smoothstep)' },
  { value: 'straight',   label: '— Thẳng' },
  { value: 'step',       label: '┐ Gấp khúc' },
]

// ══════════════════════════════════════════════════════════════
//  GenerationOverlay — Lớp lưới đường cắt thế hệ
// ══════════════════════════════════════════════════════════════
function GenerationOverlay() {
  const { x, y, zoom } = useViewport()
  const nodes = useNodes()
  
  if (!nodes.length) return null
  const maxGen = Math.max(...nodes.map(n => n.data.generation || 1))
  if (maxGen <= 0) return null

  const xs = nodes.map(n => n.position.x)
  const minX = Math.min(...xs) - 1000
  const maxX = Math.max(...xs) + 1000
  const NODE_H = 180
  const GEN_GAP = 100

  const lines = []
  for (let i = 1; i <= maxGen; i++) {
    const lineY = (i - 1) * (NODE_H + GEN_GAP) + NODE_H / 2
    lines.push(
      <g key={i}>
        <line x1={minX} y1={lineY} x2={maxX} y2={lineY} stroke="#b45309" strokeWidth="2" strokeDasharray="6 6" opacity="0.15" />
        <text x={minX + 200} y={lineY - 15} fill="#b45309" fontSize="40" fontFamily="Georgia, serif" opacity="0.25" fontWeight="bold">
          {i}
        </text>
      </g>
    )
  }
  return (
    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
      <g transform={`translate(${x}, ${y}) scale(${zoom})`}>{lines}</g>
    </svg>
  )
}

// ══════════════════════════════════════════════════════════════
//  FamilyFlow — bên trong ReactFlowProvider
// ══════════════════════════════════════════════════════════════
export function FamilyFlow({ data, edgeType, hideSpouses }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const { fitView } = useReactFlow()

  useEffect(() => {
    if (!data?.members?.length) return
    const g = buildGraph(data.members, data.marriages ?? [], edgeType, hideSpouses)
    setNodes(g.nodes)
    setEdges(g.edges)
    setTimeout(() => fitView({ padding: 0.12, duration: 500 }), 120)
  }, [data, edgeType, hideSpouses])

  return (
    <ReactFlow
      nodes={nodes} edges={edges}
      onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView fitViewOptions={{ padding: 0.12 }}
      minZoom={0.04} maxZoom={5}
      nodesDraggable={false} nodesConnectable={false} deleteKeyCode={null}
      style={{ 
        backgroundColor: '#e9e5d3', // Nền giấy cổ
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`
      }}
      attributionPosition="bottom-right"
    >
      <GenerationOverlay />
      <Controls showInteractive={false}/>
      <MiniMap
        nodeColor={n =>
          n.data?.isBloodline !== false ? '#fcd34d' : '#fef3c7'
        }
        maskColor="rgba(233,229,211,.5)"
        style={{ borderRadius: 10, border: '1px solid #b45309' }}
      />
    </ReactFlow>
  )
}

// ══════════════════════════════════════════════════════════════
//  TreePage
// ══════════════════════════════════════════════════════════════
export default function TreePage() {
  const { currentTree } = useAuthStore()
  const navigate        = useNavigate()
  const api             = treeApi(currentTree?.id)
  const myRole          = currentTree?.myRole
  const canEdit         = ['admin', 'editor'].includes(myRole)
  const isAdmin         = myRole === 'admin'

  const [edgeType, setEdgeType] = useState('default')
  const [hideSpouses, setHideSpouses] = useState(false)
  const [menu,     setMenu]     = useState(null)
  const [modal,    setModal]    = useState(null)

  useEffect(() => { registerMenuSetter(setMenu) }, [])

  const { data, isLoading, error } = useQuery({
    queryKey: ['treeData', currentTree?.id],
    queryFn:  () => api.treeData().then(r => r.data),
    enabled:  !!currentTree?.id,
  })

  const handleMenuAction = useCallback(async (key, member) => {
    switch (key) {
      case 'view':   navigate(`/members/${member.id}`); break
      case 'edit':   setModal({ type: 'edit',   member }); break
      case 'child':  setModal({ type: 'child',  member }); break
      case 'spouse': setModal({ type: 'spouse', member }); break
      case 'delete': setModal({ type: 'delete', member }); break
      case 'copy': {
        const lines = [
          `Họ tên: ${member.fullName}`,
          member.nickname ? `Tên gọi khác: ${member.nickname}` : '',
          `Giới tính: ${member.gender === 'male' ? 'Nam' : 'Nữ'}`,
          `Đời thứ: ${member.generation}`,
          member.birthDate
            ? `Ngày sinh: ${new Date(member.birthDate).toLocaleDateString('vi-VN')}` : '',
        ].filter(Boolean).join('\n')
        await navigator.clipboard.writeText(lines)
        toast.success('Đã sao chép thông tin')
        break
      }
    }
  }, [navigate])

  const closeModal = () => setModal(null)

  if (!currentTree) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: 300, color: '#9ca3af', fontSize: 15 }}>
      Chưa chọn cây gia phả
    </div>
  )

  const memberCount  = data?.members?.length  ?? 0
  const marriageCount = data?.marriages?.length ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 64px)', fontFamily: 'sans-serif' }}>

      {/* ── Toolbar ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        padding: '10px 16px', background: '#faf8f3',
        borderBottom: '1px solid #e5dcc8', flexShrink: 0, zIndex: 10,
      }}>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#78350f' }}>Phả đồ</span>
        <span style={{
          fontSize: 12, color: '#8b5a2b', background: '#fef3c7',
          padding: '2px 10px', borderRadius: 20, fontWeight: 500,
        }}>{currentTree?.name}</span>
        {!isLoading && (
          <span style={{ fontSize: 11, color: '#a16207' }}>
            {memberCount} thành viên · {marriageCount} hôn nhân
          </span>
        )}

        {/* Combobox đường nối con cái */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto' }}>
          <button 
            onClick={() => setModal({ type: 'kinship' })} 
            style={{
              border: '1px solid #d4c9b8', borderRadius: 8, padding: '5px 12px',
              fontSize: 12, color: '#b45309', background: '#fef3c7',
              cursor: 'pointer', outline: 'none', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05.02.01.03.03.04.04 1.14.83 1.93 1.94 1.93 3.41V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
            Tra cứu xưng hô
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b5a2b', cursor: 'pointer' }}>
            <input type="checkbox" checked={hideSpouses} onChange={e => setHideSpouses(e.target.checked)} />
            Ẩn hôn phối
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, color: '#8b5a2b', whiteSpace: 'nowrap' }}>
            Đường nối:
          </label>
          <select value={edgeType} onChange={e => setEdgeType(e.target.value)} style={{
            border: '1px solid #d4c9b8', borderRadius: 8, padding: '5px 10px',
            fontSize: 12, color: '#78350f', background: '#fef3c7',
            cursor: 'pointer', outline: 'none',
          }}>
            {EDGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { shape: 'rect', color: '#0099FF', bg: '#0099FF', label: 'Nam' },
            { shape: 'rect', color: '#FFC0CB', bg: '#FFC0CB', label: 'Nữ' },
            { shape: 'rect', color: '#b89968', bg: '#dcc9b6', label: 'Đã mất' },
            { shape: 'line', color: MARRIAGE_COLORS.living.stroke,   dash: false, label: 'Sống chung' },
            { shape: 'line', color: MARRIAGE_COLORS.divorced.stroke, dash: true,  label: 'Ly hôn' },
            { shape: 'line', color: MARRIAGE_COLORS.widowed.stroke,  dash: true,  label: 'Góa' },
            { shape: 'line', color: '#c8b5a0', dash: true, label: 'Mẹ → Con' },
          ].map(({ shape, color, bg, label, dash }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 10.5, color: '#8b5a2b' }}>
              {shape === 'rect'
                ? <div style={{ width: 11, height: 11, borderRadius: 2, background: bg,
                    border: `2px solid ${color}` }}/>
                : <svg width="22" height="8">
                    <line x1="1" y1="4" x2="21" y2="4"
                      stroke={color} strokeWidth="2"
                      strokeDasharray={dash ? '5 3' : undefined}/>
                  </svg>
              }
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Canvas ──────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative' }}>
        {isLoading && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 20,
            background: 'rgba(250,246,240,.9)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 44, height: 44, border: '4px solid #e5dcc8',
              borderTopColor: '#d97706', borderRadius: '50%',
              animation: 'spin .8s linear infinite' }}/>
            <p style={{ marginTop: 14, color: '#8b5a2b', fontSize: 14 }}>Đang tải phả đồ...</p>
          </div>
        )}
        {!isLoading && error && (
          <div style={{ position: 'absolute', inset: 0, background: '#faf6f0',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 10 }}>
            <span style={{ fontSize: 48 }}>⚠️</span>
            <p style={{ color: '#b45309', fontSize: 14 }}>Lỗi tải phả đồ</p>
          </div>
        )}
        {!isLoading && !error && memberCount === 0 && (
          <div style={{ position: 'absolute', inset: 0, background: '#faf6f0',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 12 }}>
            <span style={{ fontSize: 54 }}>🌱</span>
            <p style={{ color: '#8b5a2b', fontSize: 16, fontWeight: 600 }}>Chưa có thành viên</p>
          </div>
        )}
        {!isLoading && memberCount > 0 && (
          <ReactFlowProvider>
            <FamilyFlow data={data} edgeType={edgeType} hideSpouses={hideSpouses}/>
          </ReactFlowProvider>
        )}
      </div>

      {/* ── Gear Menu ───────────────────────────────────── */}
      <GearMenu menu={menu} onAction={handleMenuAction}
        onClose={() => setMenu(null)} canEdit={canEdit} isAdmin={isAdmin}/>

      {/* ── Modals ──────────────────────────────────────── */}
      {modal?.type === 'edit'   && <EditMemberModal   member={modal.member} onClose={closeModal}/>}
      {modal?.type === 'child'  && <AddChildModal     member={modal.member} onClose={closeModal}/>}
      {modal?.type === 'spouse' && <AddSpouseModal    member={modal.member} onClose={closeModal}/>}
      {modal?.type === 'delete' && <DeleteMemberModal member={modal.member} onClose={closeModal}/>}
      {modal?.type === 'kinship' && <KinshipModal     data={data} onClose={closeModal}/>}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
