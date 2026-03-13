const router = require('express').Router({ mergeParams: true })
const auth   = require('../middlewares/auth')
const prisma = require('../prisma')

const checkAccess = async (req, res, next) => {
  try {
    const access = await prisma.treeUser.findUnique({
      where: { treeId_userId: { treeId: +req.params.treeId, userId: req.user.id } }
    })
    if (!access) return res.status(403).json({ message: 'Không có quyền' })
    req.treeAccess = access
    next()
  } catch (err) { res.status(500).json({ message: err.message }) }
}

router.get('/', auth(), checkAccess, async (req, res) => {
  try {
    const treeId = +req.params.treeId

    const members = await prisma.member.findMany({
      where: { treeId },
      select: {
        id: true, fullName: true, gender: true, generation: true,
        birthDate: true, isDeceased: true, fatherId: true, motherId: true, avatarUrl: true,
        death: { select: { deathDate: true, longevity: true } }
      },
      orderBy: [{ generation: 'asc' }, { id: 'asc' }]
    })

    const marriages = await prisma.marriage.findMany({
      where: { treeId },
      select: { id: true, husbandId: true, wifeId: true, status: true, marriageDate: true }
    })

    res.json({ members, marriages })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router