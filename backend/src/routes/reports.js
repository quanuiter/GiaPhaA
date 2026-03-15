// file: backend/src/routes/reports.js
const router = require('express').Router({ mergeParams: true })
const reportController = require('../controllers/reportController')
const auth = require('../middlewares/auth')
const prisma = require('../prisma')

const checkAccess = async (req, res, next) => {
  try {
    const access = await prisma.treeUser.findUnique({
      where: { treeId_userId: { treeId: +req.params.treeId, userId: req.user.id } }
    })
    if (!access) return res.status(403).json({ message: 'Không có quyền' })
    req.treeAccess = access
    next()
  } catch (err) { res.status(500).json({ message: err.message }) }
}

router.get('/', auth(), checkAccess, reportController.getAnnualReport)

module.exports = router