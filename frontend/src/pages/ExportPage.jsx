/**
 * ExportPage — Xuất phả đồ PDF + Danh sách CSV
 *
 * PHIÊN BẢN MỚI: Sử dụng Custom SVG Renderer thay vì html2canvas.
 * → Vẽ toàn bộ cây gia phả thành SVG thuần túy từ dữ liệu,
 *   đảm bảo 100% đường nối luôn hiển thị trong PDF.
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { treeApi } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { buildGraph, NODE_W, NODE_H, MARRIAGE_COLORS } from '../utils/treeLayout'
import toast from 'react-hot-toast'
import { jsPDF } from 'jspdf'
import { ReactFlowProvider } from '@xyflow/react'
import { FamilyFlow } from './TreePage'

// ══════════════════════════════════════════════════════════════
//  Constants for SVG rendering
// ══════════════════════════════════════════════════════════════
const PDF_PADDING = 80
const HEADER_HEIGHT = 140
const LEGEND_HEIGHT = 90
const FOOTER_HEIGHT = 60
const FIXED_SECTION_WIDTH = 800 // Kích thước cố định cho header/legend/footer

// ══════════════════════════════════════════════════════════════
//  Avatar → Base64 conversion
// ══════════════════════════════════════════════════════════════
async function loadAvatarsAsBase64(members) {
  const avatarMap = {}
  const promises = members
    .filter(m => m.avatarUrl)
    .map(async (m) => {
      try {
        const url = `http://localhost:3001${m.avatarUrl}`
        const resp = await fetch(url)
        if (!resp.ok) return
        const blob = await resp.blob()
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(blob)
        })
        avatarMap[m.id] = dataUrl
      } catch (e) {
        console.warn(`Không thể tải avatar cho member ${m.id}:`, e)
      }
    })
  await Promise.all(promises)
  return avatarMap
}

// ══════════════════════════════════════════════════════════════
//  SVG Generation — Vẽ phả đồ từ dữ liệu, không phụ thuộc DOM
// ══════════════════════════════════════════════════════════════

/** Escape ký tự đặc biệt trong SVG text */
function esc(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/** Rút gọn tên hiển thị */
function shortName(fullName) {
  const parts = (fullName || '').trim().split(' ')
  return parts.length > 3 ? parts.slice(-3).join(' ') : fullName
}

/** Tạo đường cong smoothstep từ (x1,y1) đến (x2,y2) */
function smoothstepPath(x1, y1, x2, y2) {
  const midY = (y1 + y2) / 2
  return `M ${x1},${y1} C ${x1},${midY} ${x2},${midY} ${x2},${y2}`
}

/** Tạo đường nối theo kiểu */
function edgePath(x1, y1, x2, y2, type) {
  switch (type) {
    case 'straight':
      return `M ${x1},${y1} L ${x2},${y2}`
    case 'step': {
      const midY = (y1 + y2) / 2
      return `M ${x1},${y1} L ${x1},${midY} L ${x2},${midY} L ${x2},${y2}`
    }
    case 'smoothstep':
    case 'default':
    default:
      return smoothstepPath(x1, y1, x2, y2)
  }
}

/**
 * Sinh SVG string hoàn chỉnh cho phả đồ
 * @returns {{ svgString: string, width: number, height: number }}
 */
function generateFamilyTreeSVG(members, marriages, edgeType = 'smoothstep', hideSpouses = false, avatarMap = {}) {
  const { nodes, edges } = buildGraph(members, marriages, edgeType, hideSpouses)
  if (nodes.length === 0) return { svgString: '', width: 0, height: 0 }

  // Tính bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  nodes.forEach(n => {
    const x = n.position.x
    const y = n.position.y
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x + NODE_W > maxX) maxX = x + NODE_W
    if (y + NODE_H > maxY) maxY = y + NODE_H
  })

  const padding = PDF_PADDING
  const treeW = maxX - minX + padding * 2
  const treeH = maxY - minY + padding * 2
  const offsetX = -minX + padding
  const offsetY = -minY + padding

  // Tạo lookup map cho positions
  const nodeMap = {}
  nodes.forEach(n => { nodeMap[n.id] = n })

  let svgParts = []

  // ── Nền ──
  svgParts.push(`<rect width="${treeW}" height="${treeH}" fill="#faf6f0"/>`)

  // ── Đường cắt thế hệ — vẽ giữa 2 hàng node (không bị card đè) ──
  const maxGen = Math.max(...nodes.map(n => n.data.generation || 1))
  const GEN_GAP = 100
  for (let i = 1; i <= maxGen; i++) {
    // Đường ngang nằm ở đáy mỗi hàng node + nửa khoảng trống → nằm giữa 2 đời
    const lineY = (i - 1) * (NODE_H + GEN_GAP) + NODE_H + GEN_GAP / 2 + offsetY
    if (i < maxGen) {
      svgParts.push(`<line x1="0" y1="${lineY}" x2="${treeW}" y2="${lineY}" stroke="#b45309" stroke-width="1.5" stroke-dasharray="8 6" opacity="0.18"/>`)
    }
    // Label đời ở bên trái, canh giữa chiều cao node
    const labelY = (i - 1) * (NODE_H + GEN_GAP) + NODE_H / 2 + offsetY
    svgParts.push(`<text x="${14}" y="${labelY + 6}" fill="#b45309" font-size="18" font-family="Georgia, serif" opacity="0.35" font-weight="bold">Đời ${i}</text>`)
  }

  // ── Vẽ Edges (đường nối) ──
  edges.forEach(e => {
    const src = nodeMap[e.source]
    const tgt = nodeMap[e.target]
    if (!src || !tgt) return

    const srcX = src.position.x + offsetX
    const srcY = src.position.y + offsetY
    const tgtX = tgt.position.x + offsetX
    const tgtY = tgt.position.y + offsetY

    const style = e.style || {}
    const strokeColor = style.stroke || '#9ca3af'
    const strokeWidth = style.strokeWidth || 1.5
    const dasharray = style.strokeDasharray || ''

    // Xác định điểm nối
    let x1, y1, x2, y2
    if (e.sourceHandle === 'right' && e.targetHandle === 'left') {
      // Hôn nhân: nối bên phải nguồn → bên trái đích
      x1 = srcX + NODE_W
      y1 = srcY + NODE_H / 2
      x2 = tgtX
      y2 = tgtY + NODE_H / 2
      // Đường thẳng cho hôn nhân
      svgParts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${dasharray ? `stroke-dasharray="${dasharray}"` : ''} fill="none"/>`)

      // Label hôn nhân
      if (e.label) {
        const midX = (x1 + x2) / 2
        const midY = (y1 + y2) / 2
        svgParts.push(`<text x="${midX}" y="${midY - 4}" text-anchor="middle" fill="#9ca3af" font-size="9" font-family="sans-serif">${esc(e.label)}</text>`)
      }
    } else {
      // Parent → Child: nối đáy cha → đỉnh con
      x1 = srcX + NODE_W / 2
      y1 = srcY + NODE_H
      x2 = tgtX + NODE_W / 2
      y2 = tgtY
      const d = edgePath(x1, y1, x2, y2, e.type || edgeType)
      svgParts.push(`<path d="${d}" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${dasharray ? `stroke-dasharray="${dasharray}"` : ''} fill="none"/>`)
    }
  })

  // ── Vẽ Nodes (thẻ thành viên) ──
  nodes.forEach(n => {
    const x = n.position.x + offsetX
    const y = n.position.y + offsetY
    const d = n.data
    const isDeceased = d.isDeceased

    // ★ Màu nền theo GIỚI TÍNH: Xanh dương = Nam, Hồng = Nữ, Xám = Đã mất
    let cardBg, borderColor, textColor, subColor
    if (isDeceased) {
      cardBg = '#d1d5db'; borderColor = '#6b7280'; textColor = '#374151'; subColor = '#4b5563'
    } else if (d.gender === 'male') {
      cardBg = '#DBEAFE'; borderColor = '#2563EB'; textColor = '#1e3a5f'; subColor = '#1e40af'
    } else {
      cardBg = '#FCE7F3'; borderColor = '#DB2777'; textColor = '#5a1a3a'; subColor = '#9d174d'
    }

    // Card (không có shadow để tránh đè)
    svgParts.push(`<rect x="${x}" y="${y}" width="${NODE_W}" height="${NODE_H}" rx="10" ry="10" fill="${cardBg}" stroke="${borderColor}" stroke-width="3"/>`)

    // Avatar circle
    const avatarCx = x + NODE_W / 2
    const avatarCy = y + 48
    const avatarR = 28
    svgParts.push(`<circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR}" fill="#f3f4f6" stroke="${borderColor}" stroke-width="2.5"/>`)

    // Avatar: ảnh thật nếu có, fallback chữ cái đầu
    const avatarDataUrl = avatarMap[d.id]
    if (avatarDataUrl) {
      svgParts.push(`<defs><clipPath id="clip-${d.id}"><circle cx="${avatarCx}" cy="${avatarCy}" r="${avatarR - 1}"/></clipPath></defs>`)
      svgParts.push(`<image href="${avatarDataUrl}" x="${avatarCx - avatarR}" y="${avatarCy - avatarR}" width="${avatarR * 2}" height="${avatarR * 2}" clip-path="url(#clip-${d.id})" preserveAspectRatio="xMidYMid slice"/>`)
    } else {
      const lastName = (d.fullName || '?').trim().split(' ').pop()
      svgParts.push(`<text x="${avatarCx}" y="${avatarCy + 7}" text-anchor="middle" font-size="22" font-weight="bold" fill="${subColor}" font-family="Georgia, serif">${esc(lastName[0])}</text>`)
    }

    // Generation badge
    svgParts.push(`<circle cx="${x + 14}" cy="${y + 14}" r="13" fill="${borderColor}"/>`)
    svgParts.push(`<text x="${x + 14}" y="${y + 19}" text-anchor="middle" font-size="12" font-weight="bold" fill="white" font-family="sans-serif">${d.generation}</text>`)

    // Name (2 lines max centered) — chữ TO hơn
    const name = shortName(d.fullName)
    const nameParts = name.split(' ')
    let line1 = name, line2 = ''
    if (nameParts.length > 2) {
      const mid = Math.ceil(nameParts.length / 2)
      line1 = nameParts.slice(0, mid).join(' ')
      line2 = nameParts.slice(mid).join(' ')
    }
    const nameY = y + 98
    svgParts.push(`<text x="${x + NODE_W / 2}" y="${nameY}" text-anchor="middle" font-size="14" font-weight="bold" fill="${textColor}" font-family="Georgia, serif">${esc(line1)}</text>`)
    if (line2) {
      svgParts.push(`<text x="${x + NODE_W / 2}" y="${nameY + 17}" text-anchor="middle" font-size="14" font-weight="bold" fill="${textColor}" font-family="Georgia, serif">${esc(line2)}</text>`)
    }

    // Birth year — chữ to hơn
    const birthStr = d.birthDate ? `ns: ${new Date(d.birthDate).getFullYear()}` : ''
    if (birthStr) {
      svgParts.push(`<text x="${x + NODE_W / 2}" y="${y + NODE_H - 20}" text-anchor="middle" font-size="12" fill="${subColor}" font-family="Georgia, serif">${birthStr}</text>`)
    }

    // Death marker — to hơn
    if (isDeceased) {
      svgParts.push(`<text x="${x + NODE_W - 16}" y="${y + NODE_H - 8}" text-anchor="middle" font-size="16" font-weight="bold" fill="#4b5563" font-family="serif">✝</text>`)
    }
  })

  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${treeW}" height="${treeH}" viewBox="0 0 ${treeW} ${treeH}">${svgParts.join('')}</svg>`
  return { svgString, width: treeW, height: treeH }
}

// ══════════════════════════════════════════════════════════════
//  SVG → Canvas conversion
// ══════════════════════════════════════════════════════════════
function svgToCanvas(svgString, width, height, scale = 2) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas)
    }
    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(new Error('Lỗi khi chuyển đổi SVG sang ảnh'))
    }
    img.src = url
  })
}

// ══════════════════════════════════════════════════════════════
//  Header SVG generation
// ══════════════════════════════════════════════════════════════
function generateHeaderSVG(treeName, pageWidth) {
  const h = HEADER_HEIGHT
  const dateStr = new Date().toLocaleDateString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pageWidth}" height="${h}" viewBox="0 0 ${pageWidth} ${h}">
    <rect width="${pageWidth}" height="${h}" fill="#faf6f0"/>
    <rect x="0" y="${h - 2}" width="${pageWidth}" height="2" fill="#b45309" opacity="0.3"/>
    <text x="${pageWidth / 2}" y="42" text-anchor="middle" font-size="16" font-weight="bold" fill="#b45309" font-family="Georgia, serif" letter-spacing="8">GIA PHA</text>
    <text x="${pageWidth / 2}" y="78" text-anchor="middle" font-size="30" font-weight="bold" fill="#3d2817" font-family="Georgia, serif" letter-spacing="3">${esc(treeName)}</text>
    <text x="${pageWidth / 2}" y="105" text-anchor="middle" font-size="13" fill="#8b5a2b" font-family="Georgia, serif">Ngày xuất: ${dateStr}</text>
    <line x1="${pageWidth / 2 - 100}" y1="118" x2="${pageWidth / 2 + 100}" y2="118" stroke="#b45309" stroke-width="1" opacity="0.3"/>
  </svg>`
}

// ══════════════════════════════════════════════════════════════
//  Legend SVG generation
// ══════════════════════════════════════════════════════════════
function generateLegendSVG(pageWidth) {
  const h = LEGEND_HEIGHT
  let parts = []
  parts.push(`<rect width="${pageWidth}" height="${h}" fill="#faf6f0"/>`)
  parts.push(`<line x1="20" y1="2" x2="${pageWidth - 20}" y2="2" stroke="#b45309" stroke-width="1" opacity="0.25"/>`)
  parts.push(`<text x="30" y="28" font-size="14" font-weight="bold" fill="#78350f" font-family="Georgia, serif">Chú thích:</text>`)

  // Row 1: Node types — màu KHỚP với card (xanh=nam, hồng=nữ, xám=mất)
  const items1 = [
    { x: 30, color: '#DBEAFE', border: '#2563EB', label: 'Nam' },
    { x: 140, color: '#FCE7F3', border: '#DB2777', label: 'Nữ' },
    { x: 250, color: '#d1d5db', border: '#6b7280', label: 'Đã mất' },
  ]
  items1.forEach(({ x, color, border, label }) => {
    parts.push(`<rect x="${x}" y="40" width="18" height="18" rx="3" fill="${color}" stroke="${border}" stroke-width="2"/>`)
    parts.push(`<text x="${x + 26}" y="54" font-size="13" fill="#3d2817" font-family="Georgia, serif">${label}</text>`)
  })

  // Row 1: Edge types (tiếp theo) — chữ to hơn
  const items2 = [
    { x: 380, dash: '', color: '#9ca3af', label: 'Cha/Mẹ - Con' },
    { x: 540, dash: '4 4', color: '#9ca3af', label: 'Hôn nhân' },
    { x: 680, dash: '2 4', color: '#9ca3af', label: 'Ly hôn / Goá' },
  ]
  items2.forEach(({ x, dash, color, label }) => {
    parts.push(`<line x1="${x}" y1="49" x2="${x + 32}" y2="49" stroke="${color}" stroke-width="2.5" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`)
    parts.push(`<text x="${x + 40}" y="54" font-size="13" fill="#3d2817" font-family="Georgia, serif">${label}</text>`)
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pageWidth}" height="${h}" viewBox="0 0 ${pageWidth} ${h}">${parts.join('')}</svg>`
}

// ══════════════════════════════════════════════════════════════
//  Footer SVG generation
// ══════════════════════════════════════════════════════════════
function generateFooterSVG(pageWidth, memberCount, genCount, marriageCount) {
  const h = FOOTER_HEIGHT
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pageWidth}" height="${h}" viewBox="0 0 ${pageWidth} ${h}">
    <rect width="${pageWidth}" height="${h}" fill="#faf6f0"/>
    <line x1="20" y1="4" x2="${pageWidth - 20}" y2="4" stroke="#b45309" stroke-width="1" opacity="0.25"/>
    <text x="${pageWidth / 2}" y="30" text-anchor="middle" font-size="14" fill="#3d2817" font-family="Georgia, serif" font-weight="bold">
      Tổng cộng: ${memberCount} thành viên — ${genCount} thế hệ — ${marriageCount} hôn nhân
    </text>
    <text x="${pageWidth / 2}" y="50" text-anchor="middle" font-size="10" fill="#b45309" opacity="0.5" font-family="Georgia, serif">Hệ Thống Quản Lý Gia Phả</text>
  </svg>`
}

// ══════════════════════════════════════════════════════════════
//  Cover Page SVG (Trang bìa A4) — luôn đẹp & dễ đọc
// ══════════════════════════════════════════════════════════════
function generateCoverPageSVG(treeName, memberCount, genCount, marriageCount, w, h) {
  const dateStr = new Date().toLocaleDateString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="#faf6f0"/>
    <!-- Viền trang trí -->
    <rect x="20" y="20" width="${w - 40}" height="${h - 40}" fill="none" stroke="#b45309" stroke-width="2" rx="4" opacity="0.3"/>
    <rect x="28" y="28" width="${w - 56}" height="${h - 56}" fill="none" stroke="#b45309" stroke-width="0.5" rx="2" opacity="0.2"/>
    <!-- Hoa văn góc -->
    <text x="40" y="55" font-size="24" fill="#b45309" opacity="0.15" font-family="serif">❧</text>
    <text x="${w - 40}" y="55" text-anchor="end" font-size="24" fill="#b45309" opacity="0.15" font-family="serif">❧</text>
    <text x="40" y="${h - 35}" font-size="24" fill="#b45309" opacity="0.15" font-family="serif">❧</text>
    <text x="${w - 40}" y="${h - 35}" text-anchor="end" font-size="24" fill="#b45309" opacity="0.15" font-family="serif">❧</text>
    <!-- Tiêu đề phụ -->
    <text x="${w / 2}" y="${h * 0.28}" text-anchor="middle" font-size="18" fill="#b45309" font-family="Georgia, serif" letter-spacing="10" font-weight="bold">GIA PHẢ</text>
    <line x1="${w / 2 - 60}" y1="${h * 0.28 + 12}" x2="${w / 2 + 60}" y2="${h * 0.28 + 12}" stroke="#b45309" stroke-width="1" opacity="0.4"/>
    <!-- Tên gia phả (chính) -->
    <text x="${w / 2}" y="${h * 0.40}" text-anchor="middle" font-size="38" font-weight="bold" fill="#3d2817" font-family="Georgia, serif" letter-spacing="4">${esc(treeName)}</text>
    <line x1="${w / 2 - 120}" y1="${h * 0.40 + 18}" x2="${w / 2 + 120}" y2="${h * 0.40 + 18}" stroke="#b45309" stroke-width="1.5" opacity="0.3"/>
    <!-- Thống kê -->
    <text x="${w / 2}" y="${h * 0.54}" text-anchor="middle" font-size="16" fill="#78350f" font-family="Georgia, serif">${memberCount} thành viên · ${genCount} thế hệ · ${marriageCount} hôn nhân</text>
    <!-- Ngày xuất -->
    <text x="${w / 2}" y="${h * 0.72}" text-anchor="middle" font-size="14" fill="#8b5a2b" font-family="Georgia, serif">Ngày xuất: ${dateStr}</text>
    <!-- Footer -->
    <text x="${w / 2}" y="${h * 0.88}" text-anchor="middle" font-size="11" fill="#b45309" opacity="0.5" font-family="Georgia, serif">Hệ Thống Quản Lý Gia Phả</text>
  </svg>`
}

// ══════════════════════════════════════════════════════════════
//  Legend Page SVG (Trang chú thích A4) — luôn đẹp & dễ đọc
// ══════════════════════════════════════════════════════════════
function generateLegendPageSVG(treeName, memberCount, genCount, marriageCount, w, h) {
  let parts = []
  parts.push(`<rect width="${w}" height="${h}" fill="#faf6f0"/>`)
  // Viền
  parts.push(`<rect x="20" y="20" width="${w - 40}" height="${h - 40}" fill="none" stroke="#b45309" stroke-width="2" rx="4" opacity="0.3"/>`)

  const cx = w / 2
  let y = 80

  // Tiêu đề
  parts.push(`<text x="${cx}" y="${y}" text-anchor="middle" font-size="22" font-weight="bold" fill="#3d2817" font-family="Georgia, serif" letter-spacing="5">CHÚ THÍCH PHẢ ĐỒ</text>`)
  y += 16
  parts.push(`<line x1="${cx - 100}" y1="${y}" x2="${cx + 100}" y2="${y}" stroke="#b45309" stroke-width="1" opacity="0.3"/>`)
  y += 50

  // Chú thích node
  parts.push(`<text x="60" y="${y}" font-size="16" font-weight="bold" fill="#78350f" font-family="Georgia, serif">Màu sắc thẻ thành viên:</text>`)
  y += 35
  const nodeItems = [
    { color: '#DBEAFE', border: '#2563EB', label: 'Nam (con trai, huyết thống)' },
    { color: '#FCE7F3', border: '#DB2777', label: 'Nữ (con gái, vợ)' },
    { color: '#d1d5db', border: '#6b7280', label: 'Đã mất (quá cố)' },
  ]
  nodeItems.forEach(({ color, border, label }) => {
    parts.push(`<rect x="80" y="${y - 16}" width="28" height="28" rx="5" fill="${color}" stroke="${border}" stroke-width="2.5"/>`)
    parts.push(`<text x="120" y="${y + 2}" font-size="15" fill="#3d2817" font-family="Georgia, serif">${label}</text>`)
    y += 42
  })

  y += 20
  // Chú thích đường nối
  parts.push(`<text x="60" y="${y}" font-size="16" font-weight="bold" fill="#78350f" font-family="Georgia, serif">Kiểu đường nối:</text>`)
  y += 35
  const edgeItems = [
    { dash: '', color: '#9ca3af', label: 'Cha/Mẹ — Con (trực hệ)' },
    { dash: '4 4', color: '#9ca3af', label: 'Mẹ — Con (đường phụ)' },
    { dash: '', color: '#d97706', label: 'Hôn nhân (đang chung sống)' },
    { dash: '6 4', color: '#ef4444', label: 'Ly hôn' },
    { dash: '8 4', color: '#6b7280', label: 'Goá' },
  ]
  edgeItems.forEach(({ dash, color, label }) => {
    parts.push(`<line x1="80" y1="${y - 5}" x2="130" y2="${y - 5}" stroke="${color}" stroke-width="3" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`)
    parts.push(`<text x="145" y="${y}" font-size="15" fill="#3d2817" font-family="Georgia, serif">${label}</text>`)
    y += 40
  })

  y += 30
  // Thống kê
  parts.push(`<line x1="60" y1="${y}" x2="${w - 60}" y2="${y}" stroke="#b45309" stroke-width="1" opacity="0.25"/>`)
  y += 35
  parts.push(`<text x="${cx}" y="${y}" text-anchor="middle" font-size="16" font-weight="bold" fill="#3d2817" font-family="Georgia, serif">Thống kê: ${memberCount} thành viên — ${genCount} thế hệ — ${marriageCount} hôn nhân</text>`)

  // Footer
  parts.push(`<text x="${cx}" y="${h - 40}" text-anchor="middle" font-size="11" fill="#b45309" opacity="0.5" font-family="Georgia, serif">Hệ Thống Quản Lý Gia Phả</text>`)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${parts.join('')}</svg>`
}

// ══════════════════════════════════════════════════════════════
//  Main Component
// ══════════════════════════════════════════════════════════════
export default function ExportPage() {
  const [activeTab, setActiveTab] = useState('tree')
  const [pdfOptions, setPdfOptions] = useState({
    lineType: 'smoothstep',
    hideSpouses: false,
    genFrom: '',
    genTo: '',
  })
  const [exporting, setExporting] = useState(false)
  const treeRef = useRef(null)
  const currentTree = useAuthStore(s => s.currentTree)
  const userRole = useAuthStore(s => s.userRole)
  const treeId = currentTree?.id
  const canExport = ['admin', 'editor'].includes(currentTree?.myRole || userRole)

  const { data: allMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ['treeMembers', treeId],
    queryFn: () => treeApi(treeId).members().then(r => r.data),
    enabled: !!treeId
  })

  const { data: treeData = null, isLoading: treeDataLoading } = useQuery({
    queryKey: ['treeData', treeId],
    queryFn: () => treeApi(treeId).treeData().then(r => r.data),
    enabled: !!treeId
  })

  // ── Xuất PDF bằng Custom SVG Renderer (Multi-page) ──
  const handleExportTreePDF = useCallback(async () => {
    if (!canExport) return toast.error('Bạn không có quyền xuất file')
    if (!treeData?.members?.length) return toast.error('Chưa có thành viên trong cây')

    setExporting(true)
    try {
      let members = treeData.members
      let marriages = treeData.marriages || []

      // ── Lọc theo đời ──
      const gFrom = pdfOptions.genFrom ? parseInt(pdfOptions.genFrom) : null
      const gTo = pdfOptions.genTo ? parseInt(pdfOptions.genTo) : null
      if (gFrom || gTo) {
        members = members.filter(m => {
          const g = m.generation || 1
          if (gFrom && g < gFrom) return false
          if (gTo && g > gTo) return false
          return true
        })
        const memberIds = new Set(members.map(m => m.id))
        marriages = marriages.filter(mar => memberIds.has(mar.husbandId) && memberIds.has(mar.wifeId))
      }

      if (members.length === 0) throw new Error('Không có thành viên nào trong khoảng đời đã chọn')

      // ── Tải avatar thành base64 ──
      toast('Đang tải ảnh đại diện...', { icon: '⏳', duration: 2000 })
      const avatarMap = await loadAvatarsAsBase64(members)

      // 1. Generate SVG phả đồ
      const { svgString: treeSvg, width: treeW, height: treeH } = generateFamilyTreeSVG(
        members, marriages, pdfOptions.lineType, pdfOptions.hideSpouses, avatarMap
      )
      if (!treeSvg) throw new Error('Không thể tạo phả đồ')

      const maxGen = Math.max(...members.map(m => m.generation || 1))
      const scale = 2

      // ════════════════════════════════════════════════════════
      //  TRANG 1 — Trang bìa (A4 cố định: 595 × 842 pt)
      // ════════════════════════════════════════════════════════
      const A4_W = 595, A4_H = 842
      const coverSvg = generateCoverPageSVG(currentTree?.name || 'Gia Phả', members.length, maxGen, marriages.length, A4_W, A4_H)
      const coverCanvas = await svgToCanvas(coverSvg, A4_W, A4_H, scale)

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [A4_W, A4_H] })
      pdf.addImage(coverCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, A4_W, A4_H)

      // ════════════════════════════════════════════════════════
      //  TRANG 2 — Phả đồ (1 trang, kích thước tùy biến)
      // ════════════════════════════════════════════════════════
      const treeCanvas = await svgToCanvas(treeSvg, treeW, treeH, scale)
      const treeOrientation = treeW > treeH ? 'landscape' : 'portrait'
      pdf.addPage([treeW, treeH], treeOrientation)
      pdf.addImage(treeCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, treeW, treeH)

      // ════════════════════════════════════════════════════════
      //  TRANG 3 — Chú thích + thống kê (A4 cố định)
      // ════════════════════════════════════════════════════════
      const legendPageSvg = generateLegendPageSVG(currentTree?.name || 'Gia Phả', members.length, maxGen, marriages.length, A4_W, A4_H)
      const legendPageCanvas = await svgToCanvas(legendPageSvg, A4_W, A4_H, scale)
      pdf.addPage([A4_W, A4_H], 'portrait')
      pdf.addImage(legendPageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, A4_W, A4_H)

      pdf.save(`Gia_Pha_${currentTree?.name || 'Tree'}.pdf`)
      toast.success('Xuất PDF thành công (3 trang)!')
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Lỗi xuất file: ' + err.message)
    } finally {
      setExporting(false)
    }
  }, [canExport, treeData, pdfOptions, currentTree])

  // ── Xuất CSV (sửa bug gender) ──
  const handleExportExcel = async () => {
    if (!canExport) return toast.error('Bạn không có quyền xuất file')
    try {
      const csv = generateExcelCSV(allMembers)
      downloadFile(csv, 'danh-sach-thanh-vien.csv', 'text/csv;charset=utf-8;')
      toast.success('Xuất danh sách thành viên thành công!')
    } catch (err) {
      toast.error('Lỗi xuất file: ' + err.message)
    }
  }

  const generateExcelCSV = (members) => {
    const user = useAuthStore.getState().user
    // Header metadata rows (QĐ12.1)
    const metaRows = [
      [`Gia phả: ${currentTree?.name || ''}`, '', '', '', '', '', '', '', '', '', '', ''],
      [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, `Người thực hiện: ${user?.fullName || user?.username || ''}`, '', '', '', '', '', '', '', '', '', ''],
      [],
    ]

    const headers = ['STT', 'Họ và tên', 'Tên gọi khác', 'Ngày sinh', 'Giới tính', 'Đời thứ', 'Cha', 'Mẹ', 'Vợ / Chồng', 'Nghề nghiệp', 'Quê quán', 'Trạng thái']
    const rows = members.map((m, idx) => {
      // Collect spouses
      const spouses = []
      if (m.marriagesAsH) m.marriagesAsH.forEach(mar => { if (mar.wife) spouses.push(mar.wife.fullName) })
      if (m.marriagesAsW) m.marriagesAsW.forEach(mar => { if (mar.husband) spouses.push(mar.husband.fullName) })

      return [
        idx + 1,
        m.fullName || '',
        m.nickname || '',
        m.birthDate ? new Date(m.birthDate).toLocaleDateString('vi-VN') : '',
        m.gender === 'male' ? 'Nam' : m.gender === 'female' ? 'Nữ' : '',
        m.generation || '',
        m.father?.fullName || '',
        m.mother?.fullName || '',
        spouses.join(', ') || '',
        m.occupation || '',
        m.hometown || '',
        m.isDeceased ? 'Đã mất' : 'Còn sống',
      ]
    })
    const csvContent = [
      ...metaRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n')
    return '\uFEFF' + csvContent
  }

  // Helper: get spouse names for a member
  const getSpouseNames = (m) => {
    const spouses = []
    if (m.marriagesAsH) m.marriagesAsH.forEach(mar => { if (mar.wife) spouses.push(mar.wife.fullName) })
    if (m.marriagesAsW) m.marriagesAsW.forEach(mar => { if (mar.husband) spouses.push(mar.husband.fullName) })
    return spouses.join(', ')
  }

  const downloadFile = (content, filename, mimeType) => {
    const element = document.createElement('a')
    element.setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(content))
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  // ── Permission check ──
  if (!canExport) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-light text-amber-950" style={{fontFamily: 'Georgia, serif', letterSpacing: '0.1em'}}>Xuất Dữ Liệu</h2>
          <p className="text-amber-700 text-sm font-light mt-1" style={{fontFamily: 'Georgia, serif'}}>Xuất phả đồ hoặc danh sách thành viên</p>
        </div>
        <Divider />
        <div className="bg-red-50 border-2 border-red-200 p-6 rounded-sm text-center">
          <p className="text-red-900 font-light" style={{fontFamily: 'Georgia, serif'}}>
            Bạn không có quyền xuất dữ liệu. Chỉ những người có quyền <span className="font-medium">Biên tập viên</span> trở lên mới có thể xuất file.
          </p>
        </div>
      </div>
    )
  }

  // ── SVG Preview (nhỏ, inline) ──
  // Lọc members cho preview theo genFrom/genTo
  const filteredPreviewMembers = (() => {
    if (!treeData?.members?.length) return []
    let m = treeData.members
    const gFrom = pdfOptions.genFrom ? parseInt(pdfOptions.genFrom) : null
    const gTo = pdfOptions.genTo ? parseInt(pdfOptions.genTo) : null
    if (gFrom || gTo) {
      m = m.filter(mem => {
        const g = mem.generation || 1
        if (gFrom && g < gFrom) return false
        if (gTo && g > gTo) return false
        return true
      })
    }
    return m
  })()
  const filteredPreviewMarriages = (() => {
    if (!treeData?.marriages?.length || !filteredPreviewMembers.length) return []
    const ids = new Set(filteredPreviewMembers.map(m => m.id))
    return treeData.marriages.filter(mar => ids.has(mar.husbandId) && ids.has(mar.wifeId))
  })()
  const previewSvg = filteredPreviewMembers.length
    ? generateFamilyTreeSVG(filteredPreviewMembers, filteredPreviewMarriages, pdfOptions.lineType, pdfOptions.hideSpouses)
    : null

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-light text-amber-950" style={{ fontFamily: 'Georgia, serif', letterSpacing: '0.1em' }}>Xuất Dữ Liệu</h2>
        <p className="text-amber-700 text-sm font-light mt-1" style={{ fontFamily: 'Georgia, serif' }}>Xuất phả đồ hoặc danh sách thành viên</p>
      </div>

      <Divider />

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-amber-200">
        <TabBtn active={activeTab === 'tree'} onClick={() => setActiveTab('tree')}>Xuất Phả Đồ (PDF)</TabBtn>
        <TabBtn active={activeTab === 'members'} onClick={() => setActiveTab('members')}>Xuất Danh Sách (CSV)</TabBtn>
      </div>

      {/* Tree Export Tab */}
      {activeTab === 'tree' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-sm space-y-4">
            <h3 className="text-lg font-light text-amber-950" style={{ fontFamily: 'Georgia, serif' }}>Tùy chọn xuất phả đồ</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-light text-amber-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>Loại đường nối</label>
                <select
                  value={pdfOptions.lineType}
                  onChange={(e) => setPdfOptions({ ...pdfOptions, lineType: e.target.value })}
                  className="w-full px-3 py-2 border border-amber-200 rounded-sm text-sm focus:outline-none focus:border-amber-900 bg-white"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  <option value="smoothstep">Cong (Smoothstep)</option>
                  <option value="default">Cong (Bezier)</option>
                  <option value="straight">Thẳng</option>
                  <option value="step">Gấp khúc</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-light text-amber-900 mb-2" style={{ fontFamily: 'Georgia, serif' }}>Lọc theo đời</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number" min="1" placeholder="Từ đời"
                    value={pdfOptions.genFrom}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, genFrom: e.target.value })}
                    className="w-24 px-3 py-2 border border-amber-200 rounded-sm text-sm focus:outline-none focus:border-amber-900 bg-white"
                    style={{ fontFamily: 'Georgia, serif' }}
                  />
                  <span className="text-amber-700 text-sm">→</span>
                  <input
                    type="number" min="1" placeholder="Đến đời"
                    value={pdfOptions.genTo}
                    onChange={(e) => setPdfOptions({ ...pdfOptions, genTo: e.target.value })}
                    className="w-24 px-3 py-2 border border-amber-200 rounded-sm text-sm focus:outline-none focus:border-amber-900 bg-white"
                    style={{ fontFamily: 'Georgia, serif' }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pdfOptions.hideSpouses}
                  onChange={(e) => setPdfOptions({ ...pdfOptions, hideSpouses: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-light text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>Ẩn hôn phối (chỉ hiện trực hệ)</span>
              </label>
            </div>

            {/* Bản xem trước SVG */}
            <div className="mt-6 bg-white border border-amber-200 rounded-sm overflow-hidden">
              <div className="p-3 border-b border-amber-200 bg-amber-50 flex items-center justify-between">
                <h4 className="text-sm font-medium text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>Bản xem trước khi xuất:</h4>
                <span className="text-xs text-amber-600" style={{ fontFamily: 'Georgia, serif' }}>
                  {previewSvg ? `${Math.round(previewSvg.width)}×${Math.round(previewSvg.height)}px` : ''}
                </span>
              </div>
              <div className="w-full bg-[#faf6f0] overflow-auto" style={{ maxHeight: 700 }}>
                {treeDataLoading ? (
                  <div className="flex justify-center items-center h-48 text-amber-900 font-light">Đang tải phả đồ...</div>
                ) : previewSvg?.svgString ? (
                  <div
                    className="p-4"
                    style={{ minWidth: previewSvg.width * 0.65, height: previewSvg.height * 0.65, transform: 'scale(0.65)', transformOrigin: 'top left' }}
                    dangerouslySetInnerHTML={{ __html: previewSvg.svgString }}
                  />
                ) : (
                  <div className="flex justify-center items-center h-48 text-amber-700 font-light">Chưa có dữ liệu phả đồ</div>
                )}
              </div>
            </div>

            <button
              onClick={handleExportTreePDF}
              disabled={exporting || treeDataLoading || !treeData?.members?.length}
              className="w-full py-3 bg-amber-900 text-white font-light hover:bg-amber-950 disabled:opacity-50 transition-colors rounded-sm mt-6"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {exporting ? 'Đang xuất PDF...' : '📄 Xuất Phả Đồ PDF'}
            </button>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-sm">
            <p className="text-sm font-light text-blue-900" style={{ fontFamily: 'Georgia, serif' }}>
              <span className="font-medium">Phiên bản mới:</span> PDF được vẽ trực tiếp từ dữ liệu (Custom SVG Renderer) — đường nối cha con, hôn nhân luôn hiển thị đầy đủ. File PDF bao gồm tiêu đề, phả đồ, chú thích và thống kê.
            </p>
          </div>
        </div>
      )}

      {/* Members Export Tab */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-light text-amber-950" style={{ fontFamily: 'Georgia, serif' }}>Xuất danh sách thành viên</h3>
              <span className="text-sm text-amber-700 font-light" style={{ fontFamily: 'Georgia, serif' }}>Tổng: <span className="font-medium">{allMembers.length}</span> thành viên</span>
            </div>

            <p className="text-sm text-amber-800 font-light" style={{ fontFamily: 'Georgia, serif' }}>
              File CSV sẽ chứa đầy đủ 12 cột theo biểu mẫu BM12: STT, Họ tên, Tên gọi khác, Ngày sinh, Giới tính, Đời thứ, Cha, Mẹ, Vợ/Chồng, Nghề nghiệp, Quê quán, Trạng thái.
            </p>

            {/* Preview table */}
            <div className="bg-white border border-amber-200 rounded-sm overflow-hidden">
              <div className="p-3 border-b border-amber-200 bg-amber-50 flex items-center justify-between">
                <h4 className="text-sm font-medium text-amber-900" style={{ fontFamily: 'Georgia, serif' }}>Bản xem trước:</h4>
                <span className="text-xs text-amber-600" style={{ fontFamily: 'Georgia, serif' }}>
                  {allMembers.length} dòng × 12 cột
                </span>
              </div>
              <div className="overflow-auto" style={{ maxHeight: 420 }}>
                {membersLoading ? (
                  <div className="flex justify-center items-center h-32 text-amber-900 font-light">Đang tải dữ liệu...</div>
                ) : allMembers.length === 0 ? (
                  <div className="flex justify-center items-center h-32 text-amber-700 font-light" style={{ fontFamily: 'Georgia, serif' }}>Chưa có thành viên nào</div>
                ) : (
                  <table className="w-full border-collapse text-xs" style={{ fontFamily: 'Georgia, serif' }}>
                    <thead>
                      <tr className="bg-amber-100 border-b-2 border-amber-300 sticky top-0">
                        {['STT', 'Họ và tên', 'Tên gọi khác', 'Ngày sinh', 'Giới tính', 'Đời', 'Cha', 'Mẹ', 'Vợ / Chồng', 'Nghề nghiệp', 'Quê quán', 'Trạng thái'].map((col, i) => (
                          <th key={i} className="px-2 py-2 text-left font-medium text-amber-950 whitespace-nowrap border-r border-amber-200 last:border-r-0">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allMembers.map((m, idx) => (
                        <tr key={m.id} className={`border-b border-amber-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-amber-50/50'} hover:bg-amber-100/60 transition-colors`}>
                          <td className="px-2 py-1.5 text-amber-700 border-r border-amber-100 text-center">{idx + 1}</td>
                          <td className="px-2 py-1.5 text-amber-950 font-medium border-r border-amber-100 whitespace-nowrap">{m.fullName}</td>
                          <td className="px-2 py-1.5 text-amber-800 border-r border-amber-100">{m.nickname || '-'}</td>
                          <td className="px-2 py-1.5 text-amber-800 border-r border-amber-100 whitespace-nowrap">{m.birthDate ? new Date(m.birthDate).toLocaleDateString('vi-VN') : '-'}</td>
                          <td className="px-2 py-1.5 border-r border-amber-100">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${m.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                              {m.gender === 'male' ? 'Nam' : 'Nữ'}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-amber-800 border-r border-amber-100 text-center">{m.generation || '-'}</td>
                          <td className="px-2 py-1.5 text-amber-800 border-r border-amber-100 whitespace-nowrap">{m.father?.fullName || '-'}</td>
                          <td className="px-2 py-1.5 text-amber-800 border-r border-amber-100 whitespace-nowrap">{m.mother?.fullName || '-'}</td>
                          <td className="px-2 py-1.5 text-amber-800 border-r border-amber-100 whitespace-nowrap">{getSpouseNames(m) || '-'}</td>
                          <td className="px-2 py-1.5 text-amber-800 border-r border-amber-100">{m.occupation || '-'}</td>
                          <td className="px-2 py-1.5 text-amber-800 border-r border-amber-100">{m.hometown || '-'}</td>
                          <td className="px-2 py-1.5 border-r border-amber-100">
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${m.isDeceased ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-800'}`}>
                              {m.isDeceased ? 'Đã mất' : 'Còn sống'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <button
              onClick={handleExportExcel}
              disabled={exporting || membersLoading || allMembers.length === 0}
              className="w-full py-3 bg-green-700 text-white font-light hover:bg-green-800 disabled:opacity-50 transition-colors rounded-sm mt-2"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {exporting ? 'Đang xuất...' : '📊 Xuất Danh Sách CSV'}
            </button>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-sm">
            <p className="text-sm font-light text-blue-900" style={{ fontFamily: 'Georgia, serif' }}>
              <span className="font-medium">Lưu ý:</span> File CSV bao gồm tiêu đề gia phả, ngày xuất, người thực hiện. Hỗ trợ mở trực tiếp bằng Excel, Google Sheets, v.v.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Reusable UI components ──────────────────────────────────
function Divider() {
  return (
    <div className="flex justify-center items-center gap-3">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-amber-900 opacity-30" />
      <div className="text-amber-800 opacity-40" style={{ fontSize: '0.8rem' }}>※</div>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-amber-900 opacity-30" />
    </div>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 font-light text-sm border-b-2 transition-colors ${active
        ? 'border-amber-900 text-amber-950'
        : 'border-transparent text-amber-700 hover:text-amber-900'
      }`}
      style={{ fontFamily: 'Georgia, serif' }}
    >
      {children}
    </button>
  )
}
