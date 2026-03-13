const router  = require('express').Router({ mergeParams: true }) // ← mergeParams để lấy treeId từ parent route
const auth    = require('../middlewares/auth')
const prisma  = require('../prisma')
const multer  = require('multer')
const path    = require('path')
const ctrl    = require('../controllers/memberController')

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
})
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

// Middleware kiểm tra quyền truy cập cây — gắn vào req.treeAccess
const checkTreeAccess = async (req, res, next) => {
  try {
    const treeId = +req.params.treeId
    const access = await prisma.treeUser.findUnique({
      where: { treeId_userId: { treeId, userId: req.user.id } }
    })
    if (!access) return res.status(403).json({ message: 'Không có quyền truy cập cây này' })
    req.treeAccess = access  // { treeId, userId, role }
    next()
  } catch (err) { res.status(500).json({ message: err.message }) }
}

router.get('/',           auth(), checkTreeAccess, ctrl.getAll)
router.get('/:id',        auth(), checkTreeAccess, ctrl.getById)
router.post('/',          auth(), checkTreeAccess, upload.single('avatar'), ctrl.create)
router.put('/:id',        auth(), checkTreeAccess, upload.single('avatar'), ctrl.update)
router.delete('/:id',     auth(), checkTreeAccess, ctrl.remove)
router.post('/:id/death', auth(), checkTreeAccess, ctrl.recordDeath)

module.exports = router