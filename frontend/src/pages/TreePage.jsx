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
  ReactFlow, Background, Controls, MiniMap,
  useNodesState, useEdgesState,
  useReactFlow, ReactFlowProvider,
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

const nodeTypes = { member: MemberNode }

const EDGE_OPTIONS = [
  { value: 'smoothstep', label: '↪ Smoothstep' },
  { value: 'step',       label: '┐ Gấp khúc'   },
  { value: 'straight',   label: '— Thẳng'       },
  { value: 'default',    label: '〜 Cong bezier' },
]

// ══════════════════════════════════════════════════════════════
//  FamilyFlow — bên trong ReactFlowProvider
// ══════════════════════════════════════════════════════════════
function FamilyFlow({ data, edgeType }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const { fitView } = useReactFlow()

  useEffect(() => {
    if (!data?.members?.length) return
    const g = buildGraph(data.members, data.marriages ?? [], edgeType)
    setNodes(g.nodes)
    setEdges(g.edges)
    setTimeout(() => fitView({ padding: 0.12, duration: 500 }), 120)
  }, [data, edgeType])

  return (
    <ReactFlow
      nodes={nodes} edges={edges}
      onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView fitViewOptions={{ padding: 0.12 }}
      minZoom={0.04} maxZoom={5}
      nodesDraggable nodesConnectable={false} deleteKeyCode={null}
      style={{ background: '#f5f0e4' }}
      attributionPosition="bottom-right"
    >
      <Background variant="dots" gap={22} size={1.2} color="#c8bc9f"/>
      <Controls showInteractive={false}/>
      <MiniMap
        nodeColor={n =>
          n.data?.isDeceased ? '#9ca3af'
          : n.data?.gender === 'male' ? '#3b82f6' : '#ec4899'
        }
        maskColor="rgba(175,163,135,.5)"
        style={{ borderRadius: 10, border: '1px solid #c8bc9f' }}
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

  const [edgeType, setEdgeType] = useState('smoothstep')
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
        padding: '8px 16px', background: '#fff',
        borderBottom: '1px solid #e5e7eb', flexShrink: 0, zIndex: 10,
      }}>
        <span style={{ fontSize: 20 }}>🌳</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Phả đồ</span>
        <span style={{
          fontSize: 12, color: '#6b7280', background: '#f3f4f6',
          padding: '2px 10px', borderRadius: 20, fontWeight: 500,
        }}>{currentTree?.name}</span>
        {!isLoading && (
          <span style={{ fontSize: 11, color: '#9ca3af' }}>
            {memberCount} thành viên · {marriageCount} hôn nhân
          </span>
        )}

        {/* Combobox đường nối con cái */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <label style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>
            Đường nối:
          </label>
          <select value={edgeType} onChange={e => setEdgeType(e.target.value)} style={{
            border: '1px solid #d1d5db', borderRadius: 8, padding: '5px 10px',
            fontSize: 12, color: '#374151', background: '#fff',
            cursor: 'pointer', outline: 'none',
          }}>
            {EDGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { shape: 'rect', color: '#3b82f6', bg: '#93c5fd', label: 'Nam' },
            { shape: 'rect', color: '#ec4899', bg: '#f9a8d4', label: 'Nữ' },
            { shape: 'rect', color: '#9ca3af', bg: '#d1d5db', label: 'Đã mất' },
            { shape: 'line', color: MARRIAGE_COLORS.living.stroke,   dash: false, label: 'Sống chung' },
            { shape: 'line', color: MARRIAGE_COLORS.divorced.stroke, dash: true,  label: 'Ly hôn' },
            { shape: 'line', color: MARRIAGE_COLORS.widowed.stroke,  dash: true,  label: 'Góa' },
          ].map(({ shape, color, bg, label, dash }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 10.5, color: '#6b7280' }}>
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
            background: 'rgba(245,240,228,.85)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 44, height: 44, border: '4px solid #d4c9a8',
              borderTopColor: '#3b82f6', borderRadius: '50%',
              animation: 'spin .8s linear infinite' }}/>
            <p style={{ marginTop: 14, color: '#6b7280', fontSize: 14 }}>Đang tải phả đồ...</p>
          </div>
        )}
        {!isLoading && error && (
          <div style={{ position: 'absolute', inset: 0, background: '#f5f0e4',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 10 }}>
            <span style={{ fontSize: 48 }}>⚠️</span>
            <p style={{ color: '#dc2626', fontSize: 14 }}>Lỗi tải phả đồ</p>
          </div>
        )}
        {!isLoading && !error && memberCount === 0 && (
          <div style={{ position: 'absolute', inset: 0, background: '#f5f0e4',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 12 }}>
            <span style={{ fontSize: 54 }}>🌱</span>
            <p style={{ color: '#6b7280', fontSize: 16, fontWeight: 600 }}>Chưa có thành viên</p>
          </div>
        )}
        {!isLoading && memberCount > 0 && (
          <ReactFlowProvider>
            <FamilyFlow data={data} edgeType={edgeType}/>
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

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}