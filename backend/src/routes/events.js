const router = require('express').Router({ mergeParams: true })
const auth   = require('../middlewares/auth')
const prisma = require('../prisma')

const checkAccess = async (req, res, next) => {
  const access = await prisma.treeUser.findUnique({
    where: { treeId_userId: { treeId: +req.params.treeId, userId: req.user.id } }
  })
  if (!access) return res.status(403).json({ message: 'Không có quyền' })
  req.treeAccess = access
  next()
}

router.get('/', auth(), checkAccess, async (req, res) => {
  try {
    const treeId = +req.params.treeId
    const { upcoming } = req.query
    const where = { treeId }
    if (upcoming === 'true') {
      const cfg  = await prisma.treeConfig.findUnique({ where: { treeId_key: { treeId, key: 'reminderDays' } } })
      const days = parseInt(cfg?.value || '7')
      const now  = new Date()
      const soon = new Date(); soon.setDate(soon.getDate() + days)
      where.eventDate = { gte: now, lte: soon }
    }
    const events = await prisma.familyEvent.findMany({
      where, orderBy: { eventDate: 'asc' },
      include: { relatedMember: true }
    })
    res.json(events)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/', auth(), checkAccess, async (req, res) => {
  try {
    if (!['admin','editor'].includes(req.treeAccess.role))
      return res.status(403).json({ message: 'Không có quyền' })
    const treeId = +req.params.treeId
    const { type, name, eventDate, lunarDate, location, note, relatedMemberId } = req.body
    if (type === 'anniversary')
      return res.status(400).json({ message: 'Ngày giỗ được tạo tự động' })

    const event = await prisma.familyEvent.create({
      data: { treeId, type, name, eventDate: new Date(eventDate),
              lunarDate, location, note,
              relatedMemberId: relatedMemberId || null, canDelete: true }
    })
    res.status(201).json(event)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/:id', auth(), checkAccess, async (req, res) => {
  try {
    if (!['admin','editor'].includes(req.treeAccess.role))
      return res.status(403).json({ message: 'Không có quyền' })
    const ev = await prisma.familyEvent.findUnique({ where: { id: +req.params.id } })
    if (!ev) return res.status(404).json({ message: 'Không tìm thấy' })
    const { location, note, eventDate, name } = req.body
    const data = ev.type === 'anniversary'
      ? { location, note }
      : { name, eventDate: eventDate ? new Date(eventDate) : undefined, location, note }
    res.json(await prisma.familyEvent.update({ where: { id: +req.params.id }, data }))
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.delete('/:id', auth(), checkAccess, async (req, res) => {
  try {
    if (!['admin','editor'].includes(req.treeAccess.role))
      return res.status(403).json({ message: 'Không có quyền' })
    const ev = await prisma.familyEvent.findUnique({ where: { id: +req.params.id } })
    if (!ev)          return res.status(404).json({ message: 'Không tìm thấy' })
    if (!ev.canDelete) return res.status(400).json({ message: 'Không thể xóa ngày giỗ' })
    await prisma.familyEvent.delete({ where: { id: +req.params.id } })
    res.json({ message: 'Đã xóa' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router