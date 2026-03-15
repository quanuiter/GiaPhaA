// file: backend/src/controllers/reportController.js
const prisma = require('../prisma')

exports.getAnnualReport = async (req, res) => {
  try {
    // QĐ11.2: Chỉ Admin và Biên tập viên mới được xem và xuất báo cáo
    if (!['admin', 'editor'].includes(req.treeAccess.role)) {
      return res.status(403).json({ message: 'Không có quyền truy cập báo cáo' })
    }

    const treeId = +req.params.treeId
    const currentYear = new Date().getFullYear()
    const fromYear = parseInt(req.query.fromYear) || (currentYear - 5)
    const toYear = parseInt(req.query.toYear) || currentYear

    // ----------------------------------------------------------------
    // 1. TÍNH TOÁN DỮ LIỆU BÁO CÁO BM11.1 (Tăng giảm thành viên)
    // ----------------------------------------------------------------
    const members = await prisma.member.findMany({
      where: { treeId },
      include: { death: true }
    })

    const marriages = await prisma.marriage.findMany({
      where: { treeId }
    })

    const memberStats = []
    let totalSinh = 0, totalKetHon = 0, totalMat = 0;

    for (let year = fromYear; year <= toYear; year++) {
      // Số lượng sinh: thành viên có năm sinh thuộc năm đó
      const sinh = members.filter(m => m.birthDate && m.birthDate.getFullYear() === year).length
      // Số lượng kết hôn: số cặp hôn nhân có năm kết hôn thuộc năm đó
      const ketHon = marriages.filter(m => m.marriageDate && m.marriageDate.getFullYear() === year).length
      // Số lượng mất: thành viên có năm mất thuộc năm đó
      const mat = members.filter(m => m.death && m.death.deathDate.getFullYear() === year).length

      // Tổng số thành viên (sống & mất) tính đến 31/12 năm đó
      const tongThanhVien = members.filter(m => {
        if (m.birthDate) return m.birthDate.getFullYear() <= year;
        return m.createdAt.getFullYear() <= year; 
      }).length

      // Tổng cuối năm (còn sống) = Tổng số thành viên - những người đã mất tính đến năm đó
      const tongMatDenNamDo = members.filter(m => m.death && m.death.deathDate.getFullYear() <= year).length
      const tongConSong = tongThanhVien - tongMatDenNamDo

      totalSinh += sinh;
      totalKetHon += ketHon;
      totalMat += mat;

      memberStats.push({ year, sinh, ketHon, mat, tongConSong, tongThanhVien })
    }

    // ----------------------------------------------------------------
    // 2. TÍNH TOÁN DỮ LIỆU BÁO CÁO BM11.2 (Báo cáo thành tích)
    // ----------------------------------------------------------------
    const achievements = await prisma.achievement.findMany({
      where: {
        year: { gte: fromYear, lte: toYear },
        member: { treeId: treeId }
      },
      include: { member: true }
    })

    // Gom nhóm theo loại thành tích
    const achMap = {}
    achievements.forEach(a => {
      if (!achMap[a.type]) achMap[a.type] = []
      achMap[a.type].push(a)
    })

    const achievementStats = Object.keys(achMap).map(type => {
      const list = achMap[type]
      const count = list.length

      // Cấp độ phổ biến: Đếm tần suất xuất hiện của các cấp độ
      const levelCounts = {}
      list.forEach(a => { levelCounts[a.level] = (levelCounts[a.level] || 0) + 1 })
      const commonLevel = Object.keys(levelCounts).sort((a, b) => levelCounts[b] - levelCounts[a])[0]

      // Thành viên tiêu biểu: Thành viên có số thành tích nhiều nhất trong loại này
      const memberCounts = {}
      list.forEach(a => {
        const name = a.member.fullName
        memberCounts[name] = (memberCounts[name] || 0) + 1
      })
      const topMember = Object.keys(memberCounts).sort((a, b) => memberCounts[b] - memberCounts[a])[0]

      return { type, count, commonLevel, topMember }
    })

    res.json({
      memberStats: { rows: memberStats, totals: { totalSinh, totalKetHon, totalMat } },
      achievementStats
    })

  } catch (err) { res.status(500).json({ message: err.message }) }
}