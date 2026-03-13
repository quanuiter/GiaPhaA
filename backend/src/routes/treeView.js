const router = require('express').Router({ mergeParams: true })
const auth   = require('../middlewares/auth')
const prisma = require('../prisma')

router.get('/', auth(), async (req, res) => {
  try {
    const treeId = +req.params.treeId
    const access = await prisma.treeUser.findUnique({
      where: { treeId_userId: { treeId, userId: req.user.id } }
    })
    if (!access) return res.status(403).json({ message: 'Không có quyền' })

    const members = await prisma.member.findMany({
      where: { treeId },
      include: { death: true }
    })

    const nodes = members.map(m => ({
      id:       `m-${m.id}`,
      type:     'memberNode',
      position: { x: 0, y: 0 },
      data: {
        id:         m.id,
        fullName:   m.fullName,
        gender:     m.gender,
        birthDate:  m.birthDate,
        isDeceased: m.isDeceased,
        avatarUrl:  m.avatarUrl,
        generation: m.generation,
        deathDate:  m.death?.deathDate || null,
      }
    }))

    const edges = []
    for (const m of members) {
      if (m.fatherId) edges.push({
        id: `f-${m.fatherId}-${m.id}`,
        source: `m-${m.fatherId}`, target: `m-${m.id}`,
        type: 'smoothstep',
        style: { stroke: '#3b82f6' }
      })
      if (m.motherId) edges.push({
        id: `mo-${m.motherId}-${m.id}`,
        source: `m-${m.motherId}`, target: `m-${m.id}`,
        type: 'smoothstep',
        style: { stroke: '#ec4899' }
      })
    }

    res.json({ nodes, edges })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router