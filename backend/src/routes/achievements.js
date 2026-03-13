const router = require('express').Router({ mergeParams: true })
const auth   = require('../middlewares/auth')
const prisma = require('../prisma')
const ctrl   = require('../controllers/achievementController')

const checkAccess = async (req, res, next) => {
  try {
    const access = await prisma.treeUser.findUnique({
      where: { treeId_userId: { treeId: +req.params.treeId, userId: req.user.id } }
    })
    if (!access) return res.status(403).json({ message: 'Không có quyền truy cập' })
    req.treeAccess = access
    next()
  } catch (err) { res.status(500).json({ message: err.message }) }
}

router.get('/',                   auth(), checkAccess, ctrl.getAll)
router.post('/',                  auth(), checkAccess, ctrl.create)
router.put('/:achievementId',     auth(), checkAccess, ctrl.update)
router.delete('/:achievementId',  auth(), checkAccess, ctrl.remove)

module.exports = router