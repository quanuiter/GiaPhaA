const prisma = require('../prisma')

/**
 * Lấy tập hợp tổ tiên trực hệ (cha, ông, cụ...) đến N đời
 */
async function getAncestors(memberId, treeId, maxGen) {
  const ancestors = new Set()
  const queue = [{ id: memberId, depth: 0 }]

  while (queue.length > 0) {
    const { id, depth } = queue.shift()
    if (depth >= maxGen) continue

    const member = await prisma.member.findFirst({
      where: { id, treeId },
      select: { fatherId: true, motherId: true }
    })
    if (!member) continue

    if (member.fatherId) {
      ancestors.add(member.fatherId)
      queue.push({ id: member.fatherId, depth: depth + 1 })
    }
    if (member.motherId) {
      ancestors.add(member.motherId)
      queue.push({ id: member.motherId, depth: depth + 1 })
    }
  }
  return ancestors
}

/**
 * Kiểm tra 2 người có cùng huyết thống trong N đời không
 * Trả về true nếu CẤM kết hôn
 */
async function isBloodRelated(idA, idB, treeId, maxGen) {
  // Kiểm tra một người có phải tổ tiên của người kia không
  const ancestorsA = await getAncestors(idA, treeId, maxGen)
  const ancestorsB = await getAncestors(idB, treeId, maxGen)

  // A là tổ tiên của B hoặc ngược lại
  if (ancestorsA.has(idB)) return true
  if (ancestorsB.has(idA)) return true

  // Có tổ tiên chung
  for (const a of ancestorsA) {
    if (ancestorsB.has(a)) return true
  }
  return false
}

module.exports = { isBloodRelated }