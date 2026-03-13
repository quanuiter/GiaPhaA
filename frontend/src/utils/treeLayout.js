/**
 * treeLayout.js — Thuật toán layout cây gia phả
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

/** Xác định xem một thành viên có phải là huyết thống chính không */
function isBloodline(m, memberById) {
  if (!m) return false;
  return !!(m.fatherId || m.motherId || m.generation === 1);
}

/** Người neo con cái (anchor): Chọn người mang huyết thống chính */
function anchorOf(member, memberById) {
  if (!memberById) return member.fatherId || member.motherId || null;
  
  const father = memberById[member.fatherId];
  const mother = memberById[member.motherId];

  if (father && isBloodline(father, memberById)) return father.id;
  if (mother && isBloodline(mother, memberById)) return mother.id;
  
  return member.fatherId || member.motherId || null;
}

/** Danh sách con cái được neo vào memberId này */
function anchoredChildren(memberId, members, memberById) {
  return members.filter(m => anchorOf(m, memberById) === memberId)
}

/** Chiều rộng subtree đệ quy (tính từ centerX) */
function subtreeWidth(memberId, members, marriages, memberById, visited = new Set()) {
  if (visited.has(memberId)) return NODE_W
  const v = new Set(visited); v.add(memberId)

  // Vợ/chồng ngồi bên cạnh (tính cả 2 trường hợp huyết thống là nam hoặc nữ)
  const spouseCount = marriages.filter(
    m => (m.husbandId === memberId && !v.has(m.wifeId)) ||
         (m.wifeId === memberId && !v.has(m.husbandId))
  ).length
  const selfW = NODE_W + spouseCount * (SPOUSE_GAP + NODE_W)

  const kids = anchoredChildren(memberId, members, memberById).filter(c => !v.has(c.id))
  if (kids.length === 0) return selfW

  const kidsW = kids.reduce((sum, c, i) =>
    sum + subtreeWidth(c.id, members, marriages, memberById, v) + (i > 0 ? SIBLING_GAP : 0)
  , 0)

  return Math.max(selfW, kidsW)
}

// ─────────────────────────────────────────────────────────────
//  Đặt vị trí đệ quy
// ─────────────────────────────────────────────────────────────
function placeMember(memberId, cx, y, members, marriages, memberById, marriagesOf, positions, placed) {
  if (placed.has(memberId)) return
  placed.add(memberId)

  // ÉP CỨNG TỌA ĐỘ Y DỰA VÀO ĐỜI (Generation)
  const currentMember = memberById[memberId];
  const absoluteY = currentMember && currentMember.generation 
      ? (currentMember.generation - 1) * (NODE_H + GEN_GAP) 
      : y;

  const myMarriages = (marriagesOf[memberId] || []).filter(
    m => (m.husbandId === memberId && !placed.has(m.wifeId)) ||
         (m.wifeId === memberId && !placed.has(m.husbandId))
  )

  // Căn giữa toàn bộ cụm người mang huyết thống và các vợ/chồng
  const totalSpouses = myMarriages.length
  const groupWidth = NODE_W + totalSpouses * (SPOUSE_GAP + NODE_W)
  let startX = cx - groupWidth / 2 + NODE_W / 2 

  positions[`m-${memberId}`] = { x: startX - NODE_W / 2, y: absoluteY }
  startX += NODE_W + SPOUSE_GAP

  // Xếp các vợ/chồng
  myMarriages.forEach(mar => {
    const spouseId = mar.husbandId === memberId ? mar.wifeId : mar.husbandId
    if (placed.has(spouseId)) return
    placed.add(spouseId)
    positions[`m-${spouseId}`] = { x: startX - NODE_W / 2, y: absoluteY }
    startX += NODE_W + SPOUSE_GAP
  })

  // Đặt con cái
  const kids = anchoredChildren(memberId, members, memberById).filter(c => !placed.has(c.id))
  if (kids.length === 0) return

  const kidY = absoluteY + NODE_H + GEN_GAP
  const kidWidths = kids.map(c => subtreeWidth(c.id, members, marriages, memberById, new Set(placed)))
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

  // Gốc: không có cha/mẹ neo
  const roots = members.filter(m => !anchorOf(m, memberById))

  const rootHusbands = roots.filter(m =>
    (marriagesOf[m.id] || []).some(mar => mar.husbandId === m.id)
  )
  const rootOthers = roots.filter(m =>
    !(marriagesOf[m.id] || []).some(mar => mar.husbandId === m.id)
  )

  const startNodes = [...rootHusbands, ...rootOthers]

  let curX = 0
  startNodes.forEach(root => {
    if (placed.has(root.id)) return
    const w = subtreeWidth(root.id, members, marriages, memberById, new Set())
    placeMember(root.id, curX + w / 2, 0, members, marriages, memberById, marriagesOf, positions, placed)
    curX += w + ROOT_GAP
  })

  // Đặt các node mồ côi còn lại
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
  
  const memberById = {}
  members.forEach(m => { memberById[m.id] = m })

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
        isAdopted:  m.isAdopted,
        avatarUrl:  m.avatarUrl,
        birthDate:  m.birthDate,
        deathDate:  m.death?.deathDate,
      },
    })
  })

  // ── Marriage edges ───────────────────────────────────────
  marriages.forEach(mar => {
    const hPos = positions[`m-${mar.husbandId}`]
    const wPos = positions[`m-${mar.wifeId}`]
    if (!hPos || !wPos) return

    // Tự động tìm ai đang đứng bên trái/phải để nối Handle cho chuẩn
    const isHusbandLeft = hPos.x < wPos.x
    const leftId = isHusbandLeft ? mar.husbandId : mar.wifeId
    const rightId = isHusbandLeft ? mar.wifeId : mar.husbandId

    const c = MARRIAGE_COLORS[mar.status] ?? MARRIAGE_COLORS.living
    edges.push({
      id:           `esp-${mar.id}`,
      source:       `m-${leftId}`,
      sourceHandle: 'right',
      target:       `m-${rightId}`,
      targetHandle: 'left',
      type:         'straight',
      style: {
        stroke:          c.stroke,
        strokeWidth:     c.strokeWidth,
        strokeDasharray: c.dasharray ?? undefined,
      },
      label: mar.status === 'divorced'
               ? '💔 Ly hôn'
               : mar.status === 'widowed'
               ? '🕯 Góa' : '',
      labelStyle:    { fontSize: 10, fill: '#9ca3af', fontFamily: 'sans-serif' },
      labelBgStyle:  { fill: 'transparent' },
    })
  })

  // ── Parent → child edges ──────────────────────────────────
  members.forEach(m => {
    const anchor = anchorOf(m, memberById)
    if (!anchor || !positions[`m-${m.id}`] || !positions[`m-${anchor}`]) return
    
    // Nếu là con nuôi (isAdopted = true), vẽ nét đứt
    const edgeStyle = m.isAdopted 
        ? { stroke: '#4b5563', strokeWidth: 2, strokeDasharray: '5 5' } 
        : { stroke: '#4b5563', strokeWidth: 2 };

    edges.push({
      id:        `ec-${m.id}`,
      source:    `m-${anchor}`,
      target:    `m-${m.id}`,
      type:      edgeType,
      style:     edgeStyle,
      markerEnd: { type: MarkerType.ArrowClosed, width: 9, height: 9, color: '#4b5563' },
    })
  })

  return { nodes, edges }
}