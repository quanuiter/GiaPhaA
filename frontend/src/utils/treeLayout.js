/**
 * treeLayout.js — Thuật toán layout cây gia phả (Đã fix lỗi lệch trọng tâm)
 */

import { MarkerType } from '@xyflow/react'

// ── Kích thước node ─────────────────────────────────────────
export const NODE_W = 140
export const NODE_H = 180
const SPOUSE_GAP = 25   // khoảng cách giữa chồng và vợ
const SIBLING_GAP = 30   // khoảng cách ngang giữa các anh em
export const GEN_GAP = 100  // khoảng cách dọc giữa các đời
const ROOT_GAP = 60   // khoảng cách giữa các cây gốc khác nhau

// ── Màu đường nối hôn nhân ──────────────────────────────────
export const MARRIAGE_COLORS = {
  living: { stroke: '#d97706', strokeWidth: 2.5 },                    // vàng đậm, nét liền
  divorced: { stroke: '#ef4444', strokeWidth: 2, dasharray: '6 4' },    // đỏ, nét đứt
  widowed: { stroke: '#6b7280', strokeWidth: 2, dasharray: '8 4' },    // xám đậm, nét đứt
}

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

/** Xác định xem một thành viên có phải là huyết thống chính không */
function isBloodline(m, memberById, marriages = []) {
  if (!m) return false;
  // Có cha mẹ thì chắc chắn là huyết thống
  if (m.fatherId || m.motherId) return true;

  // Với đời 1 (không có cha mẹ): kiểm tra xem có phải là người dâu/rể được thêm vào sau không.
  if (m.generation === 1) {
    if (!marriages || marriages.length === 0) return true;
    const isSpouse = marriages.some(mar => {
      const spouseId = mar.husbandId === m.id ? mar.wifeId : (mar.wifeId === m.id ? mar.husbandId : null);
      if (!spouseId) return false;
      const spouse = memberById[spouseId];
      if (spouse && !spouse.fatherId && !spouse.motherId && spouse.generation === 1) {
        return spouse.id < m.id;
      }
      return false;
    });
    return !isSpouse;
  }
  return false;
}

/** Người neo con cái (anchor): Chọn người mang huyết thống chính */
function anchorOf(member, memberById, marriages = []) {
  if (!memberById) return member.fatherId || member.motherId || null;

  const father = memberById[member.fatherId];
  const mother = memberById[member.motherId];

  if (father && isBloodline(father, memberById, marriages)) return father.id;
  if (mother && isBloodline(mother, memberById, marriages)) return mother.id;

  // Chỉ trả parent ID khi parent THỰC SỰ tồn tại trong dữ liệu hiện tại
  if (father) return father.id;
  if (mother) return mother.id;
  return null;
}

/** Danh sách con cái được neo vào memberId này */
function anchoredChildren(memberId, members, memberById, marriages = []) {
  return members.filter(m => anchorOf(m, memberById, marriages) === memberId)
}

// ─────────────────────────────────────────────────────────────
//  BƯỚC 1 (Bottom-up): Tính toán Box và Tọa độ tương đối
// ─────────────────────────────────────────────────────────────
function computeSubtreeLayout(memberId, members, marriages, memberById, marriagesOf, visited = new Set()) {
  if (visited.has(memberId)) {
    return { memberId, width: NODE_W, nodeX: NODE_W / 2, leftBound: 0, rightBound: NODE_W, kidsLayouts: [] };
  }
  const v = new Set(visited); v.add(memberId);

  // Tính độ rộng cụm Vợ/Chồng
  const myMarriages = (marriagesOf[memberId] || []).filter(
    m => (m.husbandId === memberId && !v.has(m.wifeId)) ||
      (m.wifeId === memberId && !v.has(m.husbandId))
  );
  const spouseCount = myMarriages.length;
  const groupWidth = NODE_W + spouseCount * (SPOUSE_GAP + NODE_W);

  const kids = anchoredChildren(memberId, members, memberById, marriages).filter(c => !v.has(c.id));

  // Nếu không có con, node này tự là trung tâm của chính nó
  if (kids.length === 0) {
    return {
      memberId, groupWidth,
      nodeX: groupWidth / 2,
      leftBound: 0,
      rightBound: groupWidth,
      kidsLayouts: []
    };
  }

  // Nếu có con: Duyệt xếp các con nằm ngang (siblings)
  const kidsLayouts = [];
  let currentX = 0;

  for (const kid of kids) {
    const kl = computeSubtreeLayout(kid.id, members, marriages, memberById, marriagesOf, v);
    // Dịch box của đứa con này để không đè lên đứa trước
    const shiftX = currentX - kl.leftBound;
    kidsLayouts.push({ ...kl, shiftX });
    currentX = shiftX + kl.rightBound + SIBLING_GAP;
  }

  const kidsRightBound = currentX - SIBLING_GAP;

  // TỌA ĐỘ CHA MẸ: Nằm chính giữa trung tâm của ĐỨA CON ĐẦU và ĐỨA CON ÚT
  const firstKidCenter = kidsLayouts[0].shiftX + kidsLayouts[0].nodeX;
  const lastKidCenter = kidsLayouts[kidsLayouts.length - 1].shiftX + kidsLayouts[kidsLayouts.length - 1].nodeX;
  let parentNodeX = (firstKidCenter + lastKidCenter) / 2;

  // Tính lại Bounding box của toàn bộ cụm gia đình này
  let leftBound = Math.min(0, parentNodeX - groupWidth / 2);
  let rightBound = Math.max(kidsRightBound, parentNodeX + groupWidth / 2);

  // Đảm bảo không có tọa độ âm (Normalize)
  if (leftBound < 0) {
    const correction = -leftBound;
    parentNodeX += correction;
    kidsLayouts.forEach(kl => kl.shiftX += correction);
    leftBound = 0;
    rightBound += correction;
  }

  return { memberId, groupWidth, nodeX: parentNodeX, leftBound, rightBound, kidsLayouts };
}

// ─────────────────────────────────────────────────────────────
//  BƯỚC 2 (Top-down): Áp tọa độ tuyệt đối
// ─────────────────────────────────────────────────────────────
function applySubtreePositions(layout, absoluteX, baseY, members, marriages, memberById, marriagesOf, positions, placed) {
  if (placed.has(layout.memberId)) return;
  placed.add(layout.memberId);

  const memberId = layout.memberId;
  const currentMember = memberById[memberId];
  // ÉP CỨNG TỌA ĐỘ Y DỰA VÀO ĐỜI (Generation)
  const y = currentMember && currentMember.generation
    ? (currentMember.generation - 1) * (NODE_H + GEN_GAP)
    : baseY;

  const myMarriages = (marriagesOf[memberId] || []).filter(
    m => (m.husbandId === memberId && !placed.has(m.wifeId)) ||
      (m.wifeId === memberId && !placed.has(m.husbandId))
  );

  // Tính vị trí bắt đầu vẽ của người gốc để toàn bộ cụm vợ chồng nằm ở đúng nodeX
  let startX = absoluteX + layout.nodeX - layout.groupWidth / 2 + NODE_W / 2;

  positions[`m-${memberId}`] = { x: startX - NODE_W / 2, y };
  startX += NODE_W + SPOUSE_GAP;

  myMarriages.forEach(mar => {
    const spouseId = mar.husbandId === memberId ? mar.wifeId : mar.husbandId;
    if (placed.has(spouseId)) return;
    placed.add(spouseId);
    positions[`m-${spouseId}`] = { x: startX - NODE_W / 2, y };
    startX += NODE_W + SPOUSE_GAP;
  });

  // Đệ quy áp tọa độ cho con cái
  const nextY = y + NODE_H + GEN_GAP;
  for (const kl of layout.kidsLayouts) {
    applySubtreePositions(kl, absoluteX + kl.shiftX, nextY, members, marriages, memberById, marriagesOf, positions, placed);
  }
}

// ─────────────────────────────────────────────────────────────
//  Hàm chính: buildLayout → positions map
// ─────────────────────────────────────────────────────────────
function buildLayout(members, marriages) {
  const positions = {}
  const placed = new Set()
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
  const roots = members.filter(m => !anchorOf(m, memberById, marriages))

  // ── Nhóm gốc theo cha/mẹ chung (anh em ruột ở cùng đời) ──
  const sibGroupMap = new Map()
  roots.forEach(r => {
    const pkey = (r.fatherId || r.motherId)
      ? `${r.fatherId || 0}_${r.motherId || 0}`
      : `solo_${r.id}`
    if (!sibGroupMap.has(pkey)) sibGroupMap.set(pkey, [])
    sibGroupMap.get(pkey).push(r)
  })

  let curX = 0
  for (const [, group] of sibGroupMap) {
    // Sắp xếp: husband (có hôn nhân) trước, rồi mới đến others
    const husbands = group.filter(m =>
      (marriagesOf[m.id] || []).some(mar => mar.husbandId === m.id)
    )
    const others = group.filter(m =>
      !(marriagesOf[m.id] || []).some(mar => mar.husbandId === m.id)
    )
    const ordered = [...husbands, ...others]

    ordered.forEach(root => {
      if (placed.has(root.id)) return

      const layout = computeSubtreeLayout(root.id, members, marriages, memberById, marriagesOf, new Set(placed));
      applySubtreePositions(layout, curX, 0, members, marriages, memberById, marriagesOf, positions, placed);

      curX += layout.rightBound + SIBLING_GAP;
    })
    curX += ROOT_GAP - SIBLING_GAP
  }

  // Đặt các node mồ côi còn lại
  members.forEach(m => {
    if (placed.has(m.id)) return
    const layout = computeSubtreeLayout(m.id, members, marriages, memberById, marriagesOf, new Set(placed));
    applySubtreePositions(layout, curX, 0, members, marriages, memberById, marriagesOf, positions, placed);
    curX += layout.rightBound + ROOT_GAP;
  })

  // ── Normalize: căn giữa TỔ TIÊN về X=0 và Y bắt đầu từ 0 ──
  const allEntries = Object.entries(positions)
  const allPos = allEntries.map(([, p]) => p)
  if (allPos.length) {
    const minY = Math.min(...allPos.map(p => p.y))
    if (minY > 0) allPos.forEach(p => { p.y -= minY })

    // Tìm hàng trên cùng (tổ tiên / root couple) và căn giữa theo đó
    const topY = Math.min(...allPos.map(p => p.y))
    const rootNodes = allEntries.filter(([, p]) => Math.abs(p.y - topY) < 5)
    const rootMinX = Math.min(...rootNodes.map(([, p]) => p.x))
    const rootMaxX = Math.max(...rootNodes.map(([, p]) => p.x + NODE_W))
    const rootCenterX = (rootMinX + rootMaxX) / 2
    allPos.forEach(p => { p.x -= rootCenterX })
  }

  return positions
}

// ─────────────────────────────────────────────────────────────
//  Build React Flow nodes + edges
// ─────────────────────────────────────────────────────────────
export function buildGraph(members, marriages, edgeType = 'smoothstep', hideSpouses = false) {
  const fullMemberById = {}
  members.forEach(m => { fullMemberById[m.id] = m })

  let activeMembers = members
  let activeMarriages = marriages

  if (hideSpouses) {
    activeMembers = members.filter(m => isBloodline(m, fullMemberById, marriages))
    const activeIds = new Set(activeMembers.map(m => m.id))
    activeMarriages = marriages.filter(mar => activeIds.has(mar.husbandId) && activeIds.has(mar.wifeId))
  }

  const positions = buildLayout(activeMembers, activeMarriages)
  const nodes = []
  const edges = []

  // ── Member nodes ─────────────────────────────────────────
  activeMembers.forEach(m => {
    const pos = positions[`m-${m.id}`]
    if (!pos) return
    nodes.push({
      id: `m-${m.id}`,
      type: 'member',
      position: pos,
      data: {
        id: m.id,
        fullName: m.fullName,
        nickname: m.nickname,
        gender: m.gender,
        generation: m.generation,
        isDeceased: m.isDeceased,
        isAdopted: m.isAdopted,
        avatarUrl: m.avatarUrl,
        birthDate: m.birthDate,
        deathDate: m.death?.deathDate,
        hometown: m.hometown,
        occupation: m.occupation,
        birthPlace: m.birthPlace,
        address: m.address,
        bio: m.bio,
        birthDateLunar: m.birthDateLunar,
        phone: m.phone,
        email: m.email,
        isBloodline: isBloodline(m, fullMemberById, marriages)
      },
    })
  })

  // ── Marriage edges ───────────────────────────────────────
  // Nhóm tất cả node theo hàng Y và sắp xếp theo X
  const nodesByRow = {}
  Object.entries(positions).forEach(([key, pos]) => {
    const y = Math.round(pos.y)
    if (!nodesByRow[y]) nodesByRow[y] = []
    nodesByRow[y].push({ key, x: pos.x })
  })
  Object.values(nodesByRow).forEach(row => row.sort((a, b) => a.x - b.x))

  activeMarriages.forEach(mar => {
    const hPos = positions[`m-${mar.husbandId}`]
    const wPos = positions[`m-${mar.wifeId}`]
    if (!hPos || !wPos) return

    const isHusbandLeft = hPos.x < wPos.x
    const leftId = isHusbandLeft ? mar.husbandId : mar.wifeId
    const rightId = isHusbandLeft ? mar.wifeId : mar.husbandId
    const leftPos = isHusbandLeft ? hPos : wPos

    // Tìm hàng chứa 2 node này
    const y = Math.round(leftPos.y)
    const row = nodesByRow[y] || []
    const leftIdx = row.findIndex(n => n.key === `m-${leftId}`)
    const rightIdx = row.findIndex(n => n.key === `m-${rightId}`)

    // Nếu KHÔNG liền kề (có thẻ khác xen giữa), nối từ thẻ liền kề bên trái
    let sourceNodeId = `m-${leftId}`
    if (rightIdx > leftIdx + 1 && rightIdx > 0) {
      sourceNodeId = row[rightIdx - 1].key
    }

    const c = MARRIAGE_COLORS[mar.status] ?? MARRIAGE_COLORS.living

    edges.push({
      id: `esp-${mar.id}`,
      source: sourceNodeId,
      sourceHandle: 'right',
      target: `m-${rightId}`,
      targetHandle: 'left',
      type: 'straight',
      style: {
        stroke: c.stroke,
        strokeWidth: c.strokeWidth,
        strokeDasharray: c.dasharray ?? undefined,
      },
    })
  })

  // ── Parent → child edges ──────────────────────────────────
  activeMembers.forEach(m => {
    const anchor = anchorOf(m, fullMemberById, marriages)
    if (!anchor || !positions[`m-${m.id}`] || !positions[`m-${anchor}`]) return

    // Nếu là con nuôi (isAdopted = true), vẽ nét đứt
    const edgeStyle = m.isAdopted
      ? { stroke: '#9ca3af', strokeWidth: 1.5, strokeDasharray: '5 5' }
      : { stroke: '#9ca3af', strokeWidth: 1.5 };

    edges.push({
      id: `ec-${m.id}`,
      source: `m-${anchor}`,
      target: `m-${m.id}`,
      type: edgeType,
      style: edgeStyle,
    })
  })

  // ── Mother → child dashed edges ──────────────────────────────────
  activeMembers.forEach(m => {
    if (!m.motherId) return
    const motherPos = positions[`m-${m.motherId}`]
    const childPos = positions[`m-${m.id}`]
    if (!motherPos || !childPos) return

    // Nếu mẹ không phải là anchor, vẽ nét đứt từ mẹ
    const anchor = anchorOf(m, fullMemberById, marriages)
    if (anchor !== m.motherId) {
      edges.push({
        id: `em-${m.id}`,
        source: `m-${m.motherId}`,
        target: `m-${m.id}`,
        type: 'default',  // Luôn dùng đường cong nhánh cây cho mẹ → con
        style: { stroke: '#9ca3af', strokeWidth: 1.2, strokeDasharray: '4 4' },
      })
    }
  })

  return { nodes, edges }
}