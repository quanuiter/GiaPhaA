/**
 * treeLayout.js — Thuật toán layout cây gia phả
 *
 * Nguyên tắc:
 *  - KHÔNG có marriage node. Vợ/chồng ngồi cùng dòng, cách nhau SPOUSE_GAP.
 *  - Đường nối hôn nhân: nét ngang đơn giản, màu theo trạng thái.
 *  - Đường nối con cái: xuất phát từ NGƯỜI MANG HUYẾT THỐNG (fatherId ưu tiên, rồi motherId).
 *  - Mỗi thành viên chỉ được đặt 1 lần (tránh vòng lặp / trùng lặp).
 */

import { MarkerType } from '@xyflow/react'

// ── Kích thước node ─────────────────────────────────────────
export const NODE_W     = 152
export const NODE_H     = 180
const SPOUSE_GAP        = 28   // khoảng cách giữa chồng và vợ (không có node ở giữa)
const SIBLING_GAP       = 36   // khoảng cách ngang giữa các anh em
const GEN_GAP           = 130  // khoảng cách dọc giữa các đời
const ROOT_GAP          = 80   // khoảng cách giữa các cây gốc khác nhau

// ── Màu đường nối hôn nhân ──────────────────────────────────
export const MARRIAGE_COLORS = {
  living:   { stroke: '#d97706', strokeWidth: 2.5, dasharray: null },
  divorced: { stroke: '#dc2626', strokeWidth: 2,   dasharray: '8 5' },
  widowed:  { stroke: '#9ca3af', strokeWidth: 2,   dasharray: '6 4' },
}

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

/** Người neo con cái (anchor): cha nếu có, rồi mẹ */
function anchorOf(member) {
  return member.fatherId || member.motherId || null
}

/** Danh sách con cái được neo vào memberId này */
function anchoredChildren(memberId, members) {
  return members.filter(m => anchorOf(m) === memberId)
}

/** Chiều rộng subtree đệ quy (tính từ centerX) */
function subtreeWidth(memberId, members, marriages, visited = new Set()) {
  if (visited.has(memberId)) return NODE_W
  const v = new Set(visited); v.add(memberId)

  // Vợ/chồng ngồi bên phải (chỉ tính hôn nhân mà người này là chồng)
  const spouseCount = marriages.filter(
    m => m.husbandId === memberId && !v.has(m.wifeId)
  ).length
  const selfW = NODE_W + spouseCount * (SPOUSE_GAP + NODE_W)

  // Con cái neo vào memberId
  const kids = anchoredChildren(memberId, members).filter(c => !v.has(c.id))
  if (kids.length === 0) return selfW

  const kidsW = kids.reduce((sum, c, i) =>
    sum + subtreeWidth(c.id, members, marriages, v) + (i > 0 ? SIBLING_GAP : 0)
  , 0)

  return Math.max(selfW, kidsW)
}

// ─────────────────────────────────────────────────────────────
//  Đặt vị trí đệ quy
// ─────────────────────────────────────────────────────────────
function placeMember(memberId, cx, y, members, marriages, memberById, marriagesOf, positions, placed) {
  if (placed.has(memberId)) return
  placed.add(memberId)

  positions[`m-${memberId}`] = { x: cx - NODE_W / 2, y }

  // Đặt vợ sang phải (chỉ hôn nhân mà người này là chồng, vợ chưa được đặt)
  const myMarriages = (marriagesOf[memberId] || []).filter(
    m => m.husbandId === memberId && !placed.has(m.wifeId)
  )
  let rightX = cx + NODE_W / 2
  myMarriages.forEach(mar => {
    if (placed.has(mar.wifeId)) return
    placed.add(mar.wifeId)
    const wifeCx = rightX + SPOUSE_GAP + NODE_W / 2
    positions[`m-${mar.wifeId}`] = { x: wifeCx - NODE_W / 2, y }
    rightX = wifeCx + NODE_W / 2
  })

  // Đặt con cái
  const kids = anchoredChildren(memberId, members).filter(c => !placed.has(c.id))
  if (kids.length === 0) return

  const kidY = y + NODE_H + GEN_GAP
  const kidWidths = kids.map(c => subtreeWidth(c.id, members, marriages, new Set(placed)))
  const totalW    = kidWidths.reduce((s, w, i) => s + w + (i > 0 ? SIBLING_GAP : 0), 0)

  let kidX = cx - totalW / 2
  kids.forEach((kid, i) => {
    const w = kidWidths[i]
    placeMember(kid.id, kidX + w / 2, kidY, members, marriages, memberById, marriagesOf, positions, placed)
    kidX += w + SIBLING_GAP
  })
}

// ─────────────────────────────────────────────────────────────
//  Hàm chính: buildLayout → positions map
// ─────────────────────────────────────────────────────────────
function buildLayout(members, marriages) {
  const positions  = {}
  const placed     = new Set()
  const memberById = {}
  const marriagesOf = {}

  members.forEach(m => { memberById[m.id] = m })
  marriages.forEach(mar => {
    ;[mar.husbandId, mar.wifeId].forEach(id => {
      if (!marriagesOf[id]) marriagesOf[id] = []
      marriagesOf[id].push(mar)
    })
  })

  // Gốc: không có cha/mẹ trong hệ thống
  const roots = members.filter(m => !anchorOf(m))

  // Ưu tiên đặt chồng trước (vợ được đặt theo chồng)
  // roots mà là chồng trong ít nhất 1 hôn nhân
  const rootHusbands = roots.filter(m =>
    (marriagesOf[m.id] || []).some(mar => mar.husbandId === m.id)
  )
  // roots không có hôn nhân nào, hoặc chỉ là vợ không có chồng trong cây
  const rootOthers = roots.filter(m =>
    !(marriagesOf[m.id] || []).some(mar => mar.husbandId === m.id)
  )

  const startNodes = [...rootHusbands, ...rootOthers]

  let curX = 0
  startNodes.forEach(root => {
    if (placed.has(root.id)) return
    const w = subtreeWidth(root.id, members, marriages, new Set())
    placeMember(root.id, curX + w / 2, 0, members, marriages, memberById, marriagesOf, positions, placed)
    curX += w + ROOT_GAP
  })

  // Đặt các node còn lại (mồ côi / không kết nối)
  members.forEach(m => {
    if (placed.has(m.id)) return
    placeMember(m.id, curX + NODE_W / 2, 0, members, marriages, memberById, marriagesOf, positions, placed)
    curX += NODE_W + ROOT_GAP
  })

  return positions
}

// ─────────────────────────────────────────────────────────────
//  Build React Flow nodes + edges
// ─────────────────────────────────────────────────────────────
export function buildGraph(members, marriages, edgeType = 'smoothstep') {
  const positions = buildLayout(members, marriages)
  const nodes = []
  const edges = []

  // ── Member nodes ─────────────────────────────────────────
  members.forEach(m => {
    const pos = positions[`m-${m.id}`]
    if (!pos) return
    nodes.push({
      id:       `m-${m.id}`,
      type:     'member',
      position: pos,
      data: {
        id:         m.id,
        fullName:   m.fullName,
        nickname:   m.nickname,
        gender:     m.gender,
        generation: m.generation,
        isDeceased: m.isDeceased,
        avatarUrl:  m.avatarUrl,
        birthDate:  m.birthDate,
        deathDate:  m.death?.deathDate,
      },
    })
  })

  // ── Marriage edges (đường nối ngang, không có node) ──────
  marriages.forEach(mar => {
    const hPos = positions[`m-${mar.husbandId}`]
    const wPos = positions[`m-${mar.wifeId}`]
    if (!hPos || !wPos) return

    const c = MARRIAGE_COLORS[mar.status] ?? MARRIAGE_COLORS.living
    edges.push({
      id:           `esp-${mar.id}`,
      source:       `m-${mar.husbandId}`,
      sourceHandle: 'right',
      target:       `m-${mar.wifeId}`,
      targetHandle: 'left',
      type:         'straight',
      style: {
        stroke:          c.stroke,
        strokeWidth:     c.strokeWidth,
        strokeDasharray: c.dasharray ?? undefined,
      },
      // Nhãn trạng thái (chỉ hiện khi không còn sống chung)
      label: mar.status === 'divorced'
               ? '💔 Ly hôn'
               : mar.status === 'widowed'
               ? '🕯 Góa' : '',
      labelStyle:    { fontSize: 10, fill: '#9ca3af', fontFamily: 'sans-serif' },
      labelBgStyle:  { fill: 'transparent' },
    })
  })

  // ── Parent → child edges ──────────────────────────────────
  // Xuất phát từ người mang huyết thống (fatherId ưu tiên)
  members.forEach(m => {
    const anchor = anchorOf(m)
    if (!anchor || !positions[`m-${m.id}`] || !positions[`m-${anchor}`]) return
    edges.push({
      id:        `ec-${m.id}`,
      source:    `m-${anchor}`,
      target:    `m-${m.id}`,
      type:      edgeType,
      style:     { stroke: '#4b5563', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, width: 9, height: 9, color: '#4b5563' },
    })
  })

  return { nodes, edges }
}