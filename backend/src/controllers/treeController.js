const prisma = require('../prisma')

// ... (Giữ nguyên hàm exports.getTreeData hiện tại của bạn) ...

// ==========================================
// CÁC HÀM XỬ LÝ XIN GIA NHẬP VÀ PHÊ DUYỆT
// ==========================================

// 1. User gửi yêu cầu xin gia nhập một cây (User gọi API này)
exports.requestJoinTree = async (req, res) => {
  try {
    const treeId = parseInt(req.params.id);
    const userId = req.user.id; // ID lấy từ token đăng nhập

    // Kiểm tra cây có tồn tại không
    const tree = await prisma.familyTree.findUnique({ where: { id: treeId } });
    if (!tree) return res.status(404).json({ message: 'Không tìm thấy cây gia phả với ID này' });

    // Kiểm tra xem đã xin gia nhập hoặc đã ở trong cây chưa
    const existing = await prisma.treeUser.findUnique({
      where: { treeId_userId: { treeId, userId } }
    });

    if (existing) {
      if (existing.role === 'pending') return res.status(400).json({ message: 'Yêu cầu của bạn đang chờ quản trị viên duyệt' });
      return res.status(400).json({ message: 'Bạn đã là thành viên của cây này rồi' });
    }

    // Tạo yêu cầu với quyền tạm thời là 'pending'
    await prisma.treeUser.create({
      data: { treeId, userId, role: 'pending' }
    });

    res.json({ message: 'Đã gửi yêu cầu gia nhập, vui lòng chờ quản trị viên phê duyệt.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi: ' + error.message });
  }
};

// 2. Admin xem danh sách chờ duyệt của cây (Admin gọi API này)
exports.getPendingRequests = async (req, res) => {
  try {
    const treeId = parseInt(req.params.id);
    
    // Lấy những user đang có role là 'pending' trong cây này
    const requests = await prisma.treeUser.findMany({
      where: { treeId, role: 'pending' },
      include: { 
        user: { select: { id: true, username: true, createdAt: true } } 
      }
    });

    // Format lại data cho Frontend dễ đọc
    const formattedRequests = requests.map(r => ({
      requestId: r.id,
      userId: r.user.id,
      username: r.user.username,
      createdAt: r.createdAt
    }));

    res.json(formattedRequests);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi: ' + error.message });
  }
};

// 3. Admin phê duyệt yêu cầu (Admin gọi API này)
exports.approveJoinRequest = async (req, res) => {
  try {
    const treeId = parseInt(req.params.id);
    const { userId, role } = req.body; // Role do Admin chọn trên giao diện (ví dụ: viewer, editor)

    // Đổi role từ 'pending' sang quyền chính thức
    await prisma.treeUser.update({
      where: { treeId_userId: { treeId, userId: parseInt(userId) } },
      data: { role: role || 'viewer' }
    });

    res.json({ message: 'Đã phê duyệt thành viên thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi: ' + error.message });
  }
};

// 4. Admin từ chối yêu cầu (Admin gọi API này)
exports.rejectJoinRequest = async (req, res) => {
  try {
    const treeId = parseInt(req.params.id);
    const userId = parseInt(req.params.userId);

    // Xóa thẳng bản ghi trong bảng TreeUser
    await prisma.treeUser.delete({
      where: { treeId_userId: { treeId, userId } }
    });

    res.json({ message: 'Đã từ chối yêu cầu gia nhập' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi: ' + error.message });
  }
};