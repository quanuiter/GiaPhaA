const prisma = require('../prisma')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.login = async (req, res) => {
  const { username, password } = req.body
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user || user.status === 'locked')
    return res.status(401).json({ message: 'Tài khoản không tồn tại hoặc bị khóa' })
  
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return res.status(401).json({ message: 'Sai mật khẩu' })

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET, { expiresIn: '7d' }
  )
  res.json({ token, user: { id: user.id, username: user.username, role: user.role } })
}