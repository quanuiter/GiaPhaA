const router = require('express').Router()
const auth   = require('../middlewares/auth')
const prisma = require('../prisma')

// Lấy danh sách cây của user hiện tại
router.get('/', auth(), async (req, res) => {
  try {
    const trees = await prisma.familyTree.findMany({
      where: { userAccess: { some: { userId: req.user.id } } },
      include: {
        userAccess: { where: { userId: req.user.id }, select: { role: true } },
        _count: { select: { members: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(trees.map(t => ({
      ...t,
      myRole:      t.userAccess[0]?.role,
      memberCount: t._count.members
    })))
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// Lấy chi tiết 1 cây
router.get('/:id', auth(), async (req, res) => {
  try {
    const access = await prisma.treeUser.findUnique({
      where: { treeId_userId: { treeId: +req.params.id, userId: req.user.id } }
    })
    if (!access) return res.status(403).json({ message: 'Không có quyền truy cập' })

    const tree = await prisma.familyTree.findUnique({
      where: { id: +req.params.id },
      include: {
        configs: true,
        userAccess: { include: { user: { select: { id: true, username: true, status: true } } } },
        _count: { select: { members: true, events: true } }
      }
    })
    if (!tree) return res.status(404).json({ message: 'Không tìm thấy cây' })
    res.json({ ...tree, myRole: access.role })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// Tạo cây mới
router.post('/', auth(), async (req, res) => {
  try {
    const { name, description } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Tên cây không được để trống' })
    if (name.length > 200) return res.status(400).json({ message: 'Tên cây tối đa 200 ký tự' })

    const tree = await prisma.$transaction(async tx => {
      const t = await tx.familyTree.create({
        data: { name: name.trim(), description, createdBy: req.user.id }
      })
      await tx.treeUser.create({ data: { treeId: t.id, userId: req.user.id, role: 'admin' } })
      await tx.treeConfig.createMany({
        data: [
          { treeId: t.id, key: 'maxGenDisplay', value: '10' },
          { treeId: t.id, key: 'reminderDays',  value: '7'  },
          { treeId: t.id, key: 'maxBloodGen',   value: '3'  },
        ]
      })
      return t
    })
    res.status(201).json(tree)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// Cập nhật thông tin cây
router.put('/:id', auth(), async (req, res) => {
  try {
    const access = await prisma.treeUser.findUnique({
      where: { treeId_userId: { treeId: +req.params.id, userId: req.user.id } }
    })
    if (access?.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới được sửa' })

    const { name, description, status } = req.body
    const tree = await prisma.familyTree.update({
      where: { id: +req.params.id },
      data: { name, description, status }
    })
    res.json(tree)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// Xóa cây
router.delete('/:id', auth(), async (req, res) => {
  try {
    const access = await prisma.treeUser.findUnique({
      where: { treeId_userId: { treeId: +req.params.id, userId: req.user.id } }
    })
    if (access?.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới được xóa' })
    await prisma.familyTree.delete({ where: { id: +req.params.id } })
    res.json({ message: 'Đã xóa cây gia phả' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// Mời / cập nhật quyền user trong cây
router.post('/:id/users', auth(), async (req, res) => {
  try {
    const treeId = +req.params.id
    const access = await prisma.treeUser.findUnique({
      where: { treeId_userId: { treeId, userId: req.user.id } }
    })
    if (access?.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới được phân quyền' })

    const { username, role } = req.body
    const targetUser = await prisma.user.findUnique({ where: { username } })
    if (!targetUser) return res.status(404).json({ message: 'Không tìm thấy user' })

    const result = await prisma.treeUser.upsert({
      where: { treeId_userId: { treeId, userId: targetUser.id } },
      update: { role },
      create: { treeId, userId: targetUser.id, role }
    })
    res.json(result)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// Xóa user khỏi cây
router.delete('/:id/users/:userId', auth(), async (req, res) => {
  try {
    const treeId = +req.params.id
    const access = await prisma.treeUser.findUnique({
      where: { treeId_userId: { treeId, userId: req.user.id } }
    })
    if (access?.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới được xóa thành viên' })
    if (+req.params.userId === req.user.id) return res.status(400).json({ message: 'Không thể tự xóa mình' })

    await prisma.treeUser.delete({
      where: { treeId_userId: { treeId, userId: +req.params.userId } }
    })
    res.json({ message: 'Đã xóa quyền' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router