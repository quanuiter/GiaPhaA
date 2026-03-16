const prisma = require('../prisma')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.login = async (req, res) => {
  const { username, password } = req.body
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user || user.status === 'locked')
    return res.status(401).json({ message: 'Tài khoản không tồn tại hoặc bị khóa' })
  
  if (user.status === 'pending')
    return res.status(401).json({ message: 'Tài khoản của bạn đang chờ quản trị viên xét duyệt' })
  
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return res.status(401).json({ message: 'Sai mật khẩu' })

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET, { expiresIn: '7d' }
  )
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } })
}

exports.signup = async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password)
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' })
    
    if (password.length < 6)
      return res.status(400).json({ message: 'Mật khẩu phải ít nhất 6 ký tự' })
    
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing)
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' })
    
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        status: 'pending', // Chờ admin xét duyệt
        role: 'viewer'  // Mặc định là viewer
      }
    })
    
    res.json({ message: 'Đăng ký thành công. Vui lòng chờ quản trị viên xét duyệt.' })
  } catch (err) {
    res.status(500).json({ message: 'Lỗi đăng ký: ' + err.message })
  }
}

exports.getPendingUsers = async (req, res) => {
  try {
    // Chỉ admin mới có thể xem
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (currentUser?.role !== 'admin')
      return res.status(403).json({ message: 'Bạn không có quyền' })
    
    const pendingUsers = await prisma.user.findMany({
      where: { status: 'pending' },
      select: { id: true, username: true, createdAt: true }
    })
    
    res.json(pendingUsers)
  } catch (err) {
    res.status(500).json({ message: 'Lỗi: ' + err.message })
  }
}

exports.approveUser = async (req, res) => {
  try {
    const { userId, treeId, role } = req.params
    
    // Chỉ admin mới có thể phê duyệt
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (currentUser?.role !== 'admin')
      return res.status(403).json({ message: 'Bạn không có quyền' })
    
    // Cập nhật status user
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'active' }
    })
    
    // Thêm quyền vào cây gia phả
    await prisma.treeUser.create({
      data: {
        userId,
        treeId,
        role
      }
    })
    
    res.json({ message: 'Phê duyệt người dùng thành công' })
  } catch (err) {
    if (err.code === 'P2002')
      return res.status(400).json({ message: 'Người dùng đã được thêm vào cây này' })
    res.status(500).json({ message: 'Lỗi: ' + err.message })
  }
}

exports.rejectUser = async (req, res) => {
  try {
    const { userId } = req.params
    
    // Chỉ admin mới có thể từ chối
    const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } })
    if (currentUser?.role !== 'admin')
      return res.status(403).json({ message: 'Bạn không có quyền' })
    
    // Khóa tài khoản
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'locked' }
    })
    
    res.json({ message: 'Từ chối người dùng thành công' })
  } catch (err) {
    res.status(500).json({ message: 'Lỗi: ' + err.message })
  }
}
