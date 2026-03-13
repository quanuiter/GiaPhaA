const prisma = require('../prisma')

exports.getTreeData = async (req, res) => {
  const rootId = req.params.id ? +req.params.id : null
  const maxGen = +(req.query.maxGen || 10)

  // Lấy tất cả thành viên
  const members = await prisma.member.findMany({
    include: { death: true, marriagesAsH: { include: { wife: true } } }
  })

  // Build nodes cho React Flow
  const nodes = members.map(m => ({
    id: `m-${m.id}`,
    type: 'memberNode',
    position: { x: 0, y: 0 }, // React Flow + dagre sẽ tính lại
    data: {
      id: m.id, fullName: m.fullName, gender: m.gender,
      birthDate: m.birthDate, isDeceased: m.isDeceased,
      avatarUrl: m.avatarUrl, generation: m.generation,
      deathDate: m.death?.deathDate || null
    }
  }))

  // Build edges: cha/mẹ → con
  const edges = []
  for (const m of members) {
    if (m.fatherId) edges.push({ id: `f-${m.fatherId}-${m.id}`, source: `m-${m.fatherId}`, target: `m-${m.id}`, type: 'smoothstep' })
    if (m.motherId) edges.push({ id: `mo-${m.motherId}-${m.id}`, source: `m-${m.motherId}`, target: `m-${m.id}`, type: 'smoothstep', style: { stroke: '#e91e63' } })
  }

  res.json({ nodes, edges })
}