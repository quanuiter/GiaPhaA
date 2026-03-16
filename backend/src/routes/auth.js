const router = require('express').Router()
const { login, signup, getPendingUsers, approveUser, rejectUser } = require('../controllers/authController')
const { auth } = require('../middleware/auth')

router.post('/login', login)
router.post('/signup', signup)

// Admin only routes
router.get('/pending-users', auth, getPendingUsers)
router.put('/approve-user/:userId/:treeId/:role', auth, approveUser)
router.put('/reject-user/:userId', auth, rejectUser)

module.exports = router
