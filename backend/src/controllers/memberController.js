const prisma = require('../prisma')

exports.getAll = async (req, res) => {
  try {
    const treeId = +req.params.treeId
    const { keyword, gender, generation, isDeceased } = req.query
    const where = { treeId }
    if (keyword) where.OR = [
      { fullName: { contains: keyword } },
      { nickname: { contains: keyword } }
    ]
    if (gender)     where.gender     = gender
    if (generation) where.generation = parseInt(generation)
    if (isDeceased !== undefined) where.isDeceased = isDeceased === 'true'

    const members = await prisma.member.findMany({
      where,
      orderBy: [{ generation: 'asc' }, { fullName: 'asc' }],
      include: { father: true, mother: true, death: true }
    })
    res.json(members)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.getById = async (req, res) => {
  try {
    const member = await prisma.member.findFirst({
      where: { id: +req.params.id, treeId: +req.params.treeId },
      include: {
        father: true, mother: true, death: true,
        achievements: true,
        marriagesAsH: { include: { wife: true } },
        marriagesAsW: { include: { husband: true } },
        childrenAsFather: true, childrenAsMother: true
      }
    })
    if (!member) return res.status(404).json({ message: 'Không tìm thấy' })
    res.json(member)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.create = async (req, res) => {
  try {
    if (!['admin','editor'].includes(req.treeAccess.role))
      return res.status(403).json({ message: 'Không có quyền' })

    const treeId = +req.params.treeId
    const { fullName, nickname, gender, birthDate,
            generation, fatherId, motherId, birthPlace, occupation, hometown } = req.body

    if (!fullName?.trim()) return res.status(400).json({ message: 'Họ tên không được để trống' })
    if (birthDate && new Date(birthDate) > new Date())
      return res.status(400).json({ message: 'Ngày sinh không hợp lệ' })

    const member = await prisma.member.create({
      data: {
        treeId, fullName: fullName.trim(), nickname, gender,
        birthDate:  birthDate  ? new Date(birthDate) : null,
        generation: generation ? +generation : 1,
        fatherId:   fatherId   ? +fatherId   : null,
        motherId:   motherId   ? +motherId   : null,
        birthPlace, occupation, hometown,
        avatarUrl: req.file ? `/uploads/${req.file.filename}` : null
      }
    })
    res.status(201).json(member)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.update = async (req, res) => {
  try {
    if (!['admin','editor'].includes(req.treeAccess.role))
      return res.status(403).json({ message: 'Không có quyền' })

    const data = { ...req.body }
    if (data.birthDate)  data.birthDate  = new Date(data.birthDate)
    if (data.fatherId)   data.fatherId   = +data.fatherId
    if (data.motherId)   data.motherId   = +data.motherId
    if (data.generation) data.generation = +data.generation
    if (req.file)        data.avatarUrl  = `/uploads/${req.file.filename}`
    delete data.treeId  // không cho đổi cây

    const member = await prisma.member.update({
      where: { id: +req.params.id }, data
    })
    res.json(member)
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.remove = async (req, res) => {
  try {
    if (req.treeAccess.role !== 'admin')
      return res.status(403).json({ message: 'Chỉ admin mới được xóa' })

    const member = await prisma.member.findFirst({
      where: { id: +req.params.id, treeId: +req.params.treeId },
      include: { childrenAsFather: true, childrenAsMother: true, death: true }
    })
    if (!member) return res.status(404).json({ message: 'Không tìm thấy' })
    if (member.death) return res.status(400).json({ message: 'Không thể xóa: đã ghi nhận mất' })
    if (member.childrenAsFather.length || member.childrenAsMother.length)
      return res.status(400).json({ message: 'Không thể xóa: thành viên có hậu duệ' })

    await prisma.member.delete({ where: { id: +req.params.id } })
    res.json({ message: 'Đã xóa' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}

exports.recordDeath = async (req, res) => {
  try {
    if (!['admin','editor'].includes(req.treeAccess.role))
      return res.status(403).json({ message: 'Không có quyền' })

    const memberId = +req.params.id
    const treeId   = +req.params.treeId
    const { deathDate, cause, burialPlace, note } = req.body

    const member = await prisma.member.findFirst({
      where: { id: memberId, treeId },
      include: { death: true, marriagesAsH: true, marriagesAsW: true }
    })
    if (!member)      return res.status(404).json({ message: 'Không tìm thấy' })
    if (member.death) return res.status(400).json({ message: 'Đã ghi nhận mất rồi' })
    if (member.birthDate && new Date(deathDate) <= member.birthDate)
      return res.status(400).json({ message: 'Ngày mất phải sau ngày sinh' })

    const longevity = member.birthDate
      ? new Date(deathDate).getFullYear() - member.birthDate.getFullYear()
      : null

    await prisma.$transaction(async tx => {
      await tx.death.create({
        data: { memberId, deathDate: new Date(deathDate), cause, burialPlace, longevity, note }
      })
      await tx.member.update({ where: { id: memberId }, data: { isDeceased: true } })

      // Cập nhật hôn nhân → Góa
      for (const m of [...member.marriagesAsH, ...member.marriagesAsW]) {
        if (m.status === 'living')
          await tx.marriage.update({ where: { id: m.id }, data: { status: 'widowed' } })
      }

      // Tạo ngày giỗ
      await tx.familyEvent.create({
        data: {
          treeId, type: 'anniversary',
          name:      `Ngày giỗ: ${member.fullName}`,
          eventDate: new Date(deathDate),
          relatedMemberId: memberId, canDelete: false,
          note: 'Tự động tạo từ ngày mất'
        }
      })
    })
    res.json({ message: 'Đã ghi nhận mất thành công' })
  } catch (err) { res.status(500).json({ message: err.message }) }
}