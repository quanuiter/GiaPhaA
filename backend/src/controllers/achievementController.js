const prisma = require('../prisma')

const VALID_TYPES  = ['education','sport','art','science','business','social','military','medical','teaching','other']
const VALID_LEVELS = ['local','province','national']

exports.getAll = async (req, res) => {
  try {
    const { memberId, treeId } = req.params
    const member = await prisma.member.findFirst({ where: { id: +memberId, treeId: +treeId } })
    if (!member) return res.status(404).json({ message: 'Không tìm thấy thành viên' })

    const achievements = await prisma.achievement.findMany({
      where: { memberId: +memberId },
      orderBy: { year: 'desc' }
    })
    res.json(achievements)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.create = async (req, res) => {
  try {
    if (!['admin','editor'].includes(req.treeAccess.role))
      return res.status(403).json({ message: 'Không có quyền' })

    const { memberId, treeId } = req.params
    const { type, level, year, description, issuedBy } = req.body

    const member = await prisma.member.findFirst({ where: { id: +memberId, treeId: +treeId } })
    if (!member) return res.status(404).json({ message: 'Không tìm thấy thành viên' })

    if (!description?.trim()) return res.status(400).json({ message: 'Mô tả không được để trống' })
    if (!VALID_TYPES.includes(type))  return res.status(400).json({ message: 'Loại thành tích không hợp lệ' })
    if (!VALID_LEVELS.includes(level)) return res.status(400).json({ message: 'Cấp độ không hợp lệ' })

    const currentYear = new Date().getFullYear()
    if (+year > currentYear) return res.status(400).json({ message: 'Năm thành tích không được vượt năm hiện tại' })
    if (member.birthDate && +year < member.birthDate.getFullYear())
      return res.status(400).json({ message: 'Năm thành tích không được nhỏ hơn năm sinh' })

    const achievement = await prisma.achievement.create({
      data: { memberId: +memberId, type, level, year: +year, description: description.trim(), issuedBy }
    })
    res.status(201).json(achievement)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.update = async (req, res) => {
  try {
    if (!['admin','editor'].includes(req.treeAccess.role))
      return res.status(403).json({ message: 'Không có quyền' })

    const { type, level, year, description, issuedBy } = req.body
    const achievement = await prisma.achievement.update({
      where: { id: +req.params.achievementId },
      data: { type, level, year: +year, description, issuedBy }
    })
    res.json(achievement)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.remove = async (req, res) => {
  try {
    if (req.treeAccess.role !== 'admin')
      return res.status(403).json({ message: 'Chỉ admin mới được xóa' })
    await prisma.achievement.delete({ where: { id: +req.params.achievementId } })
    res.json({ message: 'Đã xóa' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}