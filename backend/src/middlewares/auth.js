const jwt = require('jsonwebtoken')

const auth = (roles = []) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Chưa đăng nhập' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    // Nếu có truyền roles thì kiểm tra, không truyền thì chỉ cần đăng nhập
    if (roles.length && !roles.includes(decoded.role))
      return res.status(403).json({ message: 'Không có quyền' })
    next()
  } catch {
    res.status(401).json({ message: 'Token không hợp lệ' })
  }
}

module.exports = auth