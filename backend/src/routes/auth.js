const router = require('express').Router()
const { login, signup } = require('../controllers/authController')

// Đăng nhập
router.post('/login', login)

// Đăng ký tài khoản mới (không cần pending nữa)
router.post('/signup', signup)

module.exports = router