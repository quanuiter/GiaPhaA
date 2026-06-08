const router = require('express').Router()
const auth   = require('../middlewares/auth')
const prisma = require('../prisma')

// 1. Lấy danh sách TẤT CẢ các cây (API này PHẢI nằm trên cùng để tránh lỗi /:id)
router.get('/all', auth(), async (req, res) => {
  try {
    const trees = await prisma.familyTree.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
    res.json(trees)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// 2. Lấy danh sách cây của user hiện tại
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

// 3. Lấy chi tiết 1 cây
router.get('/:id', auth(), async (req, res) => {
  try {
    const access = await prisma.treeUser.findUnique({
      where: { treeId_userId: { treeId: +req.params.id, userId: req.user.id } }
    })
    // Chặn người chưa được duyệt (pending)
    if (!access || access.role === 'pending') return res.status(403).json({ message: 'Không có quyền truy cập' })

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
    // Kiểm tra quyền: Chỉ System Admin mới được tạo cây mới
    if (req.user.role !== 'admin' && req.user.username !== 'admin') {
      return res.status(403).json({ message: 'Chỉ Quản trị viên hệ thống mới có quyền tạo cây gia phả mới' })
    }

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
    if (req.user.username !== 'admin' && access?.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới được sửa' })

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
    const treeId = +req.params.id;
    const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
    if (!tree) return res.status(404).json({ message: 'Không tìm thấy cây' });

    if (req.user.username !== 'admin' && tree.createdBy !== req.user.id) {
      return res.status(403).json({ message: 'Chỉ người tạo hoặc quản trị viên hệ thống mới được xóa cây' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Lấy danh sách member
      const members = await tx.member.findMany({ where: { treeId }, select: { id: true } });
      const memberIds = members.map(m => m.id);

      if (memberIds.length > 0) {
        // Gỡ liên kết user -> member
        await tx.user.updateMany({
          where: { memberId: { in: memberIds } },
          data: { memberId: null }
        });

        // Gỡ liên kết cha mẹ để tránh lỗi foreign key self-reference
        await tx.member.updateMany({
          where: { treeId },
          data: { fatherId: null, motherId: null }
        });

        // Xóa bảng phụ thuộc vào member
        await tx.death.deleteMany({ where: { memberId: { in: memberIds } } });
        await tx.achievement.deleteMany({ where: { memberId: { in: memberIds } } });
      }

      // Xóa các bảng phụ thuộc vào tree nhưng không có cascade
      await tx.marriage.deleteMany({ where: { treeId } });
      await tx.familyEvent.deleteMany({ where: { treeId } });
      await tx.auditLog.deleteMany({ where: { treeId } });
      if (memberIds.length > 0) {
        await tx.auditLog.deleteMany({ where: { memberId: { in: memberIds } } });
      }
      await tx.category.deleteMany({ where: { treeId } });

      // Cuối cùng xóa cây (sẽ tự động cascade xóa TreeUser, TreeConfig, Member)
      await tx.familyTree.delete({ where: { id: treeId } });
    });

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
    if (req.user.username !== 'admin' && access?.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới được phân quyền' })

    const { username, role } = req.body
    const targetUser = await prisma.user.findUnique({ where: { username } })
    if (!targetUser) return res.status(404).json({ message: 'Không tìm thấy user' })

    const tree = await prisma.familyTree.findUnique({ where: { id: treeId } })
    if (targetUser.username === 'admin') return res.status(400).json({ message: 'Không thể thay đổi quyền của quản trị viên hệ thống' })
    if (targetUser.id === tree.createdBy) return res.status(400).json({ message: 'Không thể thay đổi quyền của người tạo cây' })

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
    if (req.user.username !== 'admin' && access?.role !== 'admin') return res.status(403).json({ message: 'Chỉ admin mới được xóa thành viên' })
    if (+req.params.userId === req.user.id) return res.status(400).json({ message: 'Không thể tự xóa mình' })

    const targetUser = await prisma.user.findUnique({ where: { id: +req.params.userId } })
    const tree = await prisma.familyTree.findUnique({ where: { id: treeId } })
    
    if (targetUser?.username === 'admin') return res.status(400).json({ message: 'Không thể xóa quản trị viên hệ thống khỏi cây' })
    if (targetUser?.id === tree.createdBy) return res.status(400).json({ message: 'Không thể xóa người tạo cây khỏi cây' })

    await prisma.treeUser.delete({
      where: { treeId_userId: { treeId, userId: +req.params.userId } }
    })
    res.json({ message: 'Đã xóa quyền' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ==========================================
// CÁC API XIN GIA NHẬP VÀ PHÊ DUYỆT CÂY
// ==========================================

// User gửi yêu cầu xin gia nhập cây
router.post('/:id/request-join', auth(), async (req, res) => {
  try {
    const treeId = +req.params.id;
    const userId = req.user.id;

    const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
    if (!tree) return res.status(404).json({ message: 'Không tìm thấy cây gia phả' });

    const existing = await prisma.treeUser.findUnique({
      where: { treeId_userId: { treeId, userId } }
    });

    if (existing) {
      if (existing.role === 'pending') return res.status(400).json({ message: 'Yêu cầu của bạn đang chờ duyệt' });
      return res.status(400).json({ message: 'Bạn đã là thành viên của cây này' });
    }

    await prisma.treeUser.create({ data: { treeId, userId, role: 'pending' } });
    res.json({ message: 'Đã gửi yêu cầu gia nhập, vui lòng chờ quản trị viên phê duyệt.' });
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// Admin lấy danh sách user chờ duyệt
router.get('/:id/pending-requests', auth(), async (req, res) => {
  try {
    const treeId = +req.params.id;
    const access = await prisma.treeUser.findUnique({
      where: { treeId_userId: { treeId, userId: req.user.id } }
    });
    if (req.user.username !== 'admin' && access?.role !== 'admin') return res.status(403).json({ message: 'Bạn không có quyền' });

    const requests = await prisma.treeUser.findMany({
      where: { treeId, role: 'pending' },
      include: { user: { select: { id: true, username: true, createdAt: true } } }
    });

    res.json(requests.map(r => ({
      userId: r.user.id,
      username: r.user.username,
      createdAt: r.createdAt
    })));
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// Admin phê duyệt
router.put('/:id/requests/:userId/approve', auth(), async (req, res) => {
  try {
    const treeId = +req.params.id;
    const targetUserId = +req.params.userId;
    const { role } = req.body;

    const access = await prisma.treeUser.findUnique({
      where: { treeId_userId: { treeId, userId: req.user.id } }
    });
    if (req.user.username !== 'admin' && access?.role !== 'admin') return res.status(403).json({ message: 'Bạn không có quyền' });

    await prisma.treeUser.update({
      where: { treeId_userId: { treeId, userId: targetUserId } },
      data: { role: role || 'viewer' }
    });
    res.json({ message: 'Đã phê duyệt thành viên' });
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// Admin từ chối
router.delete('/:id/requests/:userId/reject', auth(), async (req, res) => {
  try {
    const treeId = +req.params.id;
    const targetUserId = +req.params.userId;

    const access = await prisma.treeUser.findUnique({
      where: { treeId_userId: { treeId, userId: req.user.id } }
    });
    if (req.user.username !== 'admin' && access?.role !== 'admin') return res.status(403).json({ message: 'Bạn không có quyền' });

    await prisma.treeUser.delete({
      where: { treeId_userId: { treeId, userId: targetUserId } }
    });
    res.json({ message: 'Đã từ chối yêu cầu gia nhập' });
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router