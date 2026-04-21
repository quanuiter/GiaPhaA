/**
 * routes/categories.js — Quản lý danh mục tùy chỉnh theo từng cây (QĐ10.1)
 *
 * Các loại danh mục (type):
 *   - hometown     : Quê quán             (QĐ1)
 *   - occupation   : Nghề nghiệp          (QĐ1)
 *   - marital_status: Trạng thái hôn nhân (QĐ2)
 *   - achievement_type : Loại thành tích  (QĐ3)
 *   - achievement_level: Cấp độ thành tích(QĐ3)
 *   - death_cause  : Nguyên nhân mất      (QĐ4)
 *   - burial_place : Địa điểm mai táng    (QĐ4)
 *
 * Ràng buộc QĐ10.1:
 *   - Mỗi danh mục phải có TỐI THIỂU 2 mục → không được xóa nếu chỉ còn 2 mục active.
 *   - Chỉ Admin mới được thao tác.
 */
const router = require('express').Router({ mergeParams: true })
const auth   = require('../middlewares/auth')
const prisma = require('../prisma')

// ── Danh mục mặc định khi cây chưa có danh mục riêng ──────────
const DEFAULTS = {
  hometown: [
    { value: 'hanoi',      label: 'Hà Nội' },
    { value: 'hochiminh',  label: 'TP. Hồ Chí Minh' },
    { value: 'danang',     label: 'Đà Nẵng' },
    { value: 'haiphong',   label: 'Hải Phòng' },
    { value: 'cantho',     label: 'Cần Thơ' },
    { value: 'other',      label: 'Khác' },
  ],
  occupation: [
    { value: 'farmer',    label: 'Nông dân' },
    { value: 'worker',    label: 'Công nhân' },
    { value: 'teacher',   label: 'Giáo viên' },
    { value: 'doctor',    label: 'Bác sĩ' },
    { value: 'engineer',  label: 'Kỹ sư' },
    { value: 'business',  label: 'Kinh doanh' },
    { value: 'military',  label: 'Quân nhân' },
    { value: 'retired',   label: 'Nghỉ hưu' },
    { value: 'student',   label: 'Sinh viên / Học sinh' },
    { value: 'other',     label: 'Khác' },
  ],
  marital_status: [
    { value: 'living',   label: 'Đang sống chung' },
    { value: 'divorced', label: 'Ly hôn' },
    { value: 'widowed',  label: 'Góa' },
  ],
  achievement_type: [
    { value: 'education', label: 'Học tập' },
    { value: 'sport',     label: 'Thể thao' },
    { value: 'art',       label: 'Nghệ thuật' },
    { value: 'science',   label: 'Khoa học' },
    { value: 'business',  label: 'Kinh doanh' },
    { value: 'social',    label: 'Cống hiến xã hội' },
    { value: 'military',  label: 'Quân sự' },
    { value: 'medical',   label: 'Y tế' },
    { value: 'teaching',  label: 'Giáo dục' },
    { value: 'other',     label: 'Khác' },
  ],
  achievement_level: [
    { value: 'local',    label: 'Cơ sở' },
    { value: 'province', label: 'Tỉnh / Thành phố' },
    { value: 'national', label: 'Quốc gia' },
  ],
  death_cause: [
    { value: 'natural',          label: 'Bệnh tự nhiên' },
    { value: 'accident_traffic', label: 'Tai nạn giao thông' },
    { value: 'accident_work',    label: 'Tai nạn lao động' },
    { value: 'critical_illness', label: 'Bệnh hiểm nghèo' },
    { value: 'old_age',          label: 'Tuổi già' },
    { value: 'sudden_death',     label: 'Đột tử' },
    { value: 'natural_disaster', label: 'Thiên tai' },
    { value: 'epidemic',         label: 'Dịch bệnh' },
    { value: 'surgery',          label: 'Phẫu thuật' },
    { value: 'war',              label: 'Chiến tranh' },
    { value: 'poisoning',        label: 'Ngộ độc' },
    { value: 'other',            label: 'Khác' },
  ],
  burial_place: [
    { value: 'cemetery', label: 'Nghĩa trang' },
    { value: 'temple',   label: 'Chùa / Nhà thờ' },
    { value: 'home',     label: 'Tại gia' },
  ],
}

// ── Danh sách loại danh mục hợp lệ ──
const VALID_TYPES = Object.keys(DEFAULTS)

// ── Middleware: kiểm tra quyền truy cập cây ──
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

// ── Middleware: chỉ Admin ──
const adminOnly = (req, res, next) => {
  if (req.treeAccess.role !== 'admin')
    return res.status(403).json({ message: 'Chỉ Quản trị viên mới được thay đổi quy định' })
  next()
}

// ================================================================
// GET /api/trees/:treeId/categories?type=...
// Lấy danh sách danh mục theo loại.
// Nếu cây chưa tạo danh mục riêng → trả về danh mục mặc định.
// ================================================================
router.get('/', auth(), checkAccess, async (req, res) => {
  try {
    const treeId = +req.params.treeId
    const { type } = req.query

    // Nếu truyền type → lấy 1 loại; không truyền → lấy tất cả
    const typeFilter = type ? { type } : {}

    const categories = await prisma.category.findMany({
      where: { treeId, ...typeFilter },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { label: 'asc' }]
    })

    // Nếu có type cụ thể và chưa có danh mục → trả mặc định
    if (type && categories.length === 0 && DEFAULTS[type]) {
      return res.json(DEFAULTS[type].map((d, i) => ({
        id: null, treeId, type, value: d.value, label: d.label,
        isActive: true, sortOrder: i, isDefault: true,
      })))
    }

    // Nếu không truyền type và chưa có bất kỳ danh mục nào → trả tất cả mặc định
    if (!type && categories.length === 0) {
      const allDefaults = []
      for (const [t, items] of Object.entries(DEFAULTS)) {
        items.forEach((d, i) => {
          allDefaults.push({
            id: null, treeId, type: t, value: d.value, label: d.label,
            isActive: true, sortOrder: i, isDefault: true,
          })
        })
      }
      return res.json(allDefaults)
    }

    res.json(categories)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ================================================================
// GET /api/trees/:treeId/categories/types
// Lấy danh sách loại danh mục hợp lệ
// ================================================================
router.get('/types', auth(), checkAccess, async (req, res) => {
  const typeLabels = {
    hometown:          'Quê quán',
    occupation:        'Nghề nghiệp',
    marital_status:    'Trạng thái hôn nhân',
    achievement_type:  'Loại thành tích',
    achievement_level: 'Cấp độ thành tích',
    death_cause:       'Nguyên nhân mất',
    burial_place:      'Địa điểm mai táng',
  }

  const treeId = +req.params.treeId

  // Đếm số mục cho mỗi loại
  const counts = await prisma.category.groupBy({
    by: ['type'],
    where: { treeId },
    _count: { id: true }
  })
  const countMap = {}
  counts.forEach(c => { countMap[c.type] = c._count.id })

  const result = VALID_TYPES.map(t => ({
    type: t,
    label: typeLabels[t],
    count: countMap[t] || DEFAULTS[t]?.length || 0,
    isCustomized: !!countMap[t], // true nếu cây đã tạo danh mục riêng
  }))

  res.json(result)
})

// ================================================================
// POST /api/trees/:treeId/categories
// Thêm danh mục mới. Chỉ Admin.
// Body: { type, value, label }
// ================================================================
router.post('/', auth(), checkAccess, adminOnly, async (req, res) => {
  try {
    const treeId = +req.params.treeId
    const { type, value, label } = req.body

    if (!VALID_TYPES.includes(type))
      return res.status(400).json({ message: `Loại danh mục không hợp lệ. Các loại: ${VALID_TYPES.join(', ')}` })
    if (!value?.trim())
      return res.status(400).json({ message: 'Giá trị (value) không được để trống' })
    if (!label?.trim())
      return res.status(400).json({ message: 'Nhãn (label) không được để trống' })

    // Kiểm tra trùng value trong cùng type + cây
    const existing = await prisma.category.findFirst({
      where: { treeId, type, value: value.trim() }
    })
    if (existing)
      return res.status(400).json({ message: `Giá trị "${value}" đã tồn tại trong danh mục "${type}"` })

    // Nếu cây chưa có danh mục riêng cho loại này → seed mặc định trước
    const count = await prisma.category.count({ where: { treeId, type } })
    if (count === 0 && DEFAULTS[type]) {
      await prisma.category.createMany({
        data: DEFAULTS[type].map((d, i) => ({
          treeId, type, value: d.value, label: d.label, isActive: true, sortOrder: i,
        }))
      })
    }

    // Lấy sortOrder cao nhất
    const maxSort = await prisma.category.findFirst({
      where: { treeId, type },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true }
    })

    const category = await prisma.category.create({
      data: {
        treeId,
        type,
        value: value.trim(),
        label: label.trim(),
        isActive: true,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      }
    })

    res.status(201).json(category)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ================================================================
// POST /api/trees/:treeId/categories/init
// Khởi tạo danh mục mặc định cho cây (nếu chưa có). Chỉ Admin.
// Body: { type } hoặc không truyền type → init tất cả
// ================================================================
router.post('/init', auth(), checkAccess, adminOnly, async (req, res) => {
  try {
    const treeId = +req.params.treeId
    const { type } = req.body

    const typesToInit = type ? [type] : VALID_TYPES
    let created = 0

    for (const t of typesToInit) {
      if (!DEFAULTS[t]) continue
      const count = await prisma.category.count({ where: { treeId, type: t } })
      if (count === 0) {
        await prisma.category.createMany({
          data: DEFAULTS[t].map((d, i) => ({
            treeId, type: t, value: d.value, label: d.label, isActive: true, sortOrder: i,
          }))
        })
        created += DEFAULTS[t].length
      }
    }

    res.json({ message: `Đã khởi tạo ${created} danh mục mặc định`, created })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ================================================================
// PUT /api/trees/:treeId/categories/:id
// Cập nhật danh mục. Chỉ Admin.
// Body: { label?, value?, isActive?, sortOrder? }
// ================================================================
router.put('/:id', auth(), checkAccess, adminOnly, async (req, res) => {
  try {
    const treeId = +req.params.treeId
    const catId  = +req.params.id

    const cat = await prisma.category.findFirst({
      where: { id: catId, treeId }
    })
    if (!cat) return res.status(404).json({ message: 'Không tìm thấy danh mục' })

    const { label, value, isActive, sortOrder } = req.body
    const data = {}
    if (label     !== undefined) data.label     = label.trim()
    if (value     !== undefined) data.value     = value.trim()
    if (isActive  !== undefined) data.isActive  = isActive
    if (sortOrder !== undefined) data.sortOrder = +sortOrder

    // Nếu đang bật (active) → tắt (inactive): kiểm tra ràng buộc tối thiểu 2 mục active
    if (isActive === false) {
      const activeCount = await prisma.category.count({
        where: { treeId, type: cat.type, isActive: true }
      })
      if (activeCount <= 2)
        return res.status(400).json({
          message: 'Không thể vô hiệu hóa: Mỗi danh mục phải có tối thiểu 2 mục hoạt động'
        })
    }

    // Kiểm tra trùng value nếu đổi value
    if (value && value.trim() !== cat.value) {
      const dup = await prisma.category.findFirst({
        where: { treeId, type: cat.type, value: value.trim(), NOT: { id: catId } }
      })
      if (dup)
        return res.status(400).json({ message: `Giá trị "${value}" đã tồn tại` })
    }

    const updated = await prisma.category.update({
      where: { id: catId },
      data,
    })
    res.json(updated)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ================================================================
// DELETE /api/trees/:treeId/categories/:id
// Xóa danh mục. Chỉ Admin.
// Ràng buộc: Tối thiểu 2 mục active trong cùng type.
// ================================================================
router.delete('/:id', auth(), checkAccess, adminOnly, async (req, res) => {
  try {
    const treeId = +req.params.treeId
    const catId  = +req.params.id

    const cat = await prisma.category.findFirst({
      where: { id: catId, treeId }
    })
    if (!cat) return res.status(404).json({ message: 'Không tìm thấy danh mục' })

    // Kiểm tra ràng buộc tối thiểu 2 mục
    const totalCount = await prisma.category.count({
      where: { treeId, type: cat.type }
    })
    if (totalCount <= 2)
      return res.status(400).json({
        message: 'Không thể xóa: Mỗi danh mục phải có tối thiểu 2 mục'
      })

    await prisma.category.delete({ where: { id: catId } })
    res.json({ message: 'Đã xóa danh mục' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
