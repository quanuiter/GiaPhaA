/**
 * routes/configs.js — Quản lý tham số hệ thống cho từng cây (QĐ10.2)
 *
 * Các tham số:
 *   - maxGenDisplay : Số đời tối đa hiển thị phả đồ (3–20, mặc định 10)
 *   - reminderDays  : Số ngày nhắc nhở trước sự kiện  (1–30, mặc định 7)
 *   - maxBloodGen   : Phạm vi cấm kết hôn cận huyết   (2–5,  mặc định 3)
 *   - maxAvatarSize : Dung lượng tối đa ảnh đại diện MB (1–50, mặc định 5)
 *   - maxLogoSize   : Dung lượng tối đa logo MB         (1–50, mặc định 2)
 *   - maxBannerSize : Dung lượng tối đa banner MB        (1–50, mặc định 10)
 *
 * Ràng buộc QĐ10.2:
 *   - Chỉ Admin mới được thay đổi.
 *   - Giá trị phải nằm trong phạm vi cho phép.
 */
const router = require('express').Router({ mergeParams: true })
const auth   = require('../middlewares/auth')
const prisma = require('../prisma')

// ── Định nghĩa tham số và ràng buộc ──────────────────────
const CONFIG_SCHEMA = {
  maxGenDisplay: {
    label:   'Số đời tối đa hiển thị phả đồ',
    min:     3,
    max:     20,
    default: '10',
    unit:    'đời',
  },
  reminderDays: {
    label:   'Số ngày nhắc nhở trước sự kiện',
    min:     1,
    max:     30,
    default: '7',
    unit:    'ngày',
  },
  maxBloodGen: {
    label:   'Phạm vi cấm kết hôn cận huyết',
    min:     2,
    max:     5,
    default: '3',
    unit:    'đời',
  },
  maxAvatarSize: {
    label:   'Dung lượng tối đa ảnh đại diện',
    min:     1,
    max:     50,
    default: '5',
    unit:    'MB',
  },
  maxLogoSize: {
    label:   'Dung lượng tối đa logo',
    min:     1,
    max:     50,
    default: '2',
    unit:    'MB',
  },
  maxBannerSize: {
    label:   'Dung lượng tối đa banner',
    min:     1,
    max:     50,
    default: '10',
    unit:    'MB',
  },
}

// ── Middleware ──────────────────────────────────────────────
const checkAccess = async (req, res, next) => {
  try {
    const access = await prisma.treeUser.findUnique({
      where: { treeId_userId: { treeId: +req.params.treeId, userId: req.user.id } }
    })
    if (!access || access.role === 'pending')
      return res.status(403).json({ message: 'Không có quyền truy cập' })
    req.treeAccess = access
    next()
  } catch (err) { res.status(500).json({ message: err.message }) }
}

const adminOnly = (req, res, next) => {
  if (req.treeAccess.role !== 'admin')
    return res.status(403).json({ message: 'Chỉ Quản trị viên mới được thay đổi tham số hệ thống' })
  next()
}

// ================================================================
// GET /api/trees/:treeId/configs
// Lấy tất cả tham số của cây. Nếu thiếu key → trả về giá trị mặc định.
// ================================================================
router.get('/', auth(), checkAccess, async (req, res) => {
  try {
    const treeId = +req.params.treeId

    const configs = await prisma.treeConfig.findMany({
      where: { treeId }
    })

    // Tạo map key → value
    const configMap = {}
    configs.forEach(c => { configMap[c.key] = c.value })

    // Merge với schema mặc định
    const result = Object.entries(CONFIG_SCHEMA).map(([key, schema]) => ({
      key,
      value:   configMap[key] ?? schema.default,
      label:   schema.label,
      min:     schema.min,
      max:     schema.max,
      unit:    schema.unit,
      default: schema.default,
      isCustomized: key in configMap,
    }))

    res.json(result)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ================================================================
// GET /api/trees/:treeId/configs/schema
// Trả về schema (metadata) của các tham số hệ thống
// ================================================================
router.get('/schema', auth(), checkAccess, async (req, res) => {
  res.json(CONFIG_SCHEMA)
})

// ================================================================
// PUT /api/trees/:treeId/configs
// Cập nhật một hoặc nhiều tham số. Chỉ Admin.
// Body: { maxGenDisplay: "15", reminderDays: "10", ... }
// ================================================================
router.put('/', auth(), checkAccess, adminOnly, async (req, res) => {
  try {
    const treeId = +req.params.treeId
    const updates = req.body

    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0)
      return res.status(400).json({ message: 'Không có dữ liệu cần cập nhật' })

    const errors = []
    const validUpdates = {}

    for (const [key, rawValue] of Object.entries(updates)) {
      const schema = CONFIG_SCHEMA[key]
      if (!schema) {
        errors.push(`Tham số "${key}" không hợp lệ`)
        continue
      }

      const numValue = parseInt(rawValue)
      if (isNaN(numValue)) {
        errors.push(`${schema.label}: giá trị phải là số`)
        continue
      }
      if (numValue < schema.min || numValue > schema.max) {
        errors.push(`${schema.label}: giá trị phải từ ${schema.min} đến ${schema.max} ${schema.unit}`)
        continue
      }

      validUpdates[key] = String(numValue)
    }

    if (errors.length > 0 && Object.keys(validUpdates).length === 0)
      return res.status(400).json({ message: errors.join('. ') })

    // Upsert từng key
    const results = []
    for (const [key, value] of Object.entries(validUpdates)) {
      const result = await prisma.treeConfig.upsert({
        where: { treeId_key: { treeId, key } },
        update: { value },
        create: { treeId, key, value },
      })
      results.push(result)
    }

    const response = {
      message: `Đã cập nhật ${results.length} tham số thành công`,
      updated: results,
    }
    if (errors.length > 0) response.warnings = errors

    res.json(response)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ================================================================
// PUT /api/trees/:treeId/configs/:key
// Cập nhật một tham số cụ thể. Chỉ Admin.
// Body: { value: "15" }
// ================================================================
router.put('/:key', auth(), checkAccess, adminOnly, async (req, res) => {
  try {
    const treeId = +req.params.treeId
    const key    = req.params.key
    const { value } = req.body

    const schema = CONFIG_SCHEMA[key]
    if (!schema)
      return res.status(400).json({ message: `Tham số "${key}" không hợp lệ` })

    const numValue = parseInt(value)
    if (isNaN(numValue))
      return res.status(400).json({ message: `${schema.label}: giá trị phải là số` })

    if (numValue < schema.min || numValue > schema.max)
      return res.status(400).json({
        message: `${schema.label}: giá trị phải từ ${schema.min} đến ${schema.max} ${schema.unit}`
      })

    const result = await prisma.treeConfig.upsert({
      where: { treeId_key: { treeId, key } },
      update: { value: String(numValue) },
      create: { treeId, key, value: String(numValue) },
    })

    res.json({
      message: `Đã cập nhật ${schema.label} thành ${numValue} ${schema.unit}`,
      config: result,
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ================================================================
// POST /api/trees/:treeId/configs/reset
// Reset tham số về mặc định. Chỉ Admin.
// Body: { key: "maxGenDisplay" } hoặc không truyền key → reset tất cả
// ================================================================
router.post('/reset', auth(), checkAccess, adminOnly, async (req, res) => {
  try {
    const treeId = +req.params.treeId
    const { key } = req.body

    if (key) {
      const schema = CONFIG_SCHEMA[key]
      if (!schema)
        return res.status(400).json({ message: `Tham số "${key}" không hợp lệ` })

      await prisma.treeConfig.upsert({
        where: { treeId_key: { treeId, key } },
        update: { value: schema.default },
        create: { treeId, key, value: schema.default },
      })
      return res.json({ message: `Đã đặt lại ${schema.label} về mặc định (${schema.default} ${schema.unit})` })
    }

    // Reset tất cả
    for (const [k, schema] of Object.entries(CONFIG_SCHEMA)) {
      await prisma.treeConfig.upsert({
        where: { treeId_key: { treeId, key: k } },
        update: { value: schema.default },
        create: { treeId, key: k, value: schema.default },
      })
    }
    res.json({ message: 'Đã đặt lại tất cả tham số hệ thống về mặc định' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
