const prisma = require('../prisma')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.login = async (req, res) => {
  const { username, password } = req.body
  const user = await prisma.user.findUnique({ where: { username } })
  
  if (!user) return res.status(401).json({ message: 'Tài khoản không tồn tại' })
  if (user.status === 'locked') return res.status(401).json({ message: 'Tài khoản đã bị khóa' })
  
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return res.status(401).json({ message: 'Sai mật khẩu' })

  // LƯU Ý: Không lưu role ở payload JWT nữa, vì quyền phụ thuộc vào cây
  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET, { expiresIn: '7d' }
  )
  res.json({ token, user: { id: user.id, username: user.username } })
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
    
    // Đăng ký xong là có tài khoản active ngay lập tức
    await prisma.user.create({
      data: {
        username,
        passwordHash,
        status: 'active' 
      }
    })
    
    res.json({ message: 'Đăng ký thành công! Vui lòng đăng nhập và xin gia nhập vào một cây gia phả.' })
  } catch (err) {
    res.status(500).json({ message: 'Lỗi đăng ký: ' + err.message })
  }
}

// XÓA 3 HÀM: getPendingUsers, approveUser, rejectUser (đã chuyển sang logic của Cây)