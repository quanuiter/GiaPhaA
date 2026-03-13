const router             = require('express').Router({ mergeParams: true })
const auth               = require('../middlewares/auth')
const prisma             = require('../prisma')
const { isBloodRelated } = require('../utils/bloodRelation')

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
    const marriages = await prisma.marriage.findMany({
      where: { treeId: +req.params.treeId },
      include: { husband: true, wife: true },
      orderBy: { marriageDate: 'asc' }
    })
    res.json(marriages)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/', auth(), checkAccess, async (req, res) => {
  try {
    if (!['admin','editor'].includes(req.treeAccess.role))
      return res.status(403).json({ message: 'Không có quyền' })

    const treeId = +req.params.treeId
    const { husbandId, wifeId, marriageDate, note } = req.body

    if (!husbandId || !wifeId)
      return res.status(400).json({ message: 'Thiếu thông tin vợ hoặc chồng' })
    if (husbandId === wifeId)
      return res.status(400).json({ message: 'Không thể kết hôn với chính mình' })

    const husband = await prisma.member.findFirst({ where: { id: +husbandId, treeId } })
    const wife    = await prisma.member.findFirst({ where: { id: +wifeId,    treeId } })
    if (!husband) return res.status(404).json({ message: 'Không tìm thấy chồng trong cây này' })
    if (!wife)    return res.status(404).json({ message: 'Không tìm thấy vợ trong cây này' })

    // Kiểm tra giới tính
    if (husband.gender !== 'male')   return res.status(400).json({ message: 'Chồng phải là Nam' })
    if (wife.gender    !== 'female') return res.status(400).json({ message: 'Vợ phải là Nữ' })

    // Kiểm tra đang có hôn nhân active
    const activeH = await prisma.marriage.findFirst({ where: { treeId, husbandId: +husbandId, status: 'living' } })
    const activeW = await prisma.marriage.findFirst({ where: { treeId, wifeId:    +wifeId,    status: 'living' } })
    if (activeH) return res.status(400).json({ message: `${husband.fullName} đang có hôn nhân hiện tại` })
    if (activeW) return res.status(400).json({ message: `${wife.fullName} đang có hôn nhân hiện tại` })

    // Kiểm tra ngày kết hôn
    if (marriageDate) {
      const md = new Date(marriageDate)
      if (husband.birthDate && md <= husband.birthDate)
        return res.status(400).json({ message: 'Ngày kết hôn phải sau ngày sinh của chồng' })
      if (wife.birthDate && md <= wife.birthDate)
        return res.status(400).json({ message: 'Ngày kết hôn phải sau ngày sinh của vợ' })
    }

    // Kiểm tra huyết thống
    const cfg = await prisma.treeConfig.findUnique({
      where: { treeId_key: { treeId, key: 'maxBloodGen' } }
    })
    const maxBloodGen = parseInt(cfg?.value || '3')
    const related = await isBloodRelated(+husbandId, +wifeId, treeId, maxBloodGen)
    if (related)
      return res.status(400).json({
        message: `Không thể kết hôn: hai người có cùng huyết thống trong phạm vi ${maxBloodGen} đời`
      })

    const marriage = await prisma.marriage.create({
      data: {
        treeId, husbandId: +husbandId, wifeId: +wifeId,
        marriageDate: marriageDate ? new Date(marriageDate) : null,
        status: 'living', note
      },
      include: { husband: true, wife: true }
    })
    res.status(201).json(marriage)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/:id', auth(), checkAccess, async (req, res) => {
  try {
    if (!['admin','editor'].includes(req.treeAccess.role))
      return res.status(403).json({ message: 'Không có quyền' })

    const { status, divorceDate, note } = req.body
    const allowed = ['living', 'divorced', 'widowed']
    if (!allowed.includes(status))
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' })

    const marriage = await prisma.marriage.update({
      where: { id: +req.params.id },
      data: {
        status,
        divorceDate: divorceDate ? new Date(divorceDate) : null,
        note
      },
      include: { husband: true, wife: true }
    })
    res.json(marriage)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.delete('/:id', auth(), checkAccess, async (req, res) => {
  try {
    if (req.treeAccess.role !== 'admin')
      return res.status(403).json({ message: 'Chỉ admin mới được xóa' })
    await prisma.marriage.delete({ where: { id: +req.params.id } })
    res.json({ message: 'Đã xóa' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router