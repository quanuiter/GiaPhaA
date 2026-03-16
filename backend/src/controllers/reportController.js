// file: backend/src/controllers/reportController.js
const prisma = require('../prisma')

exports.getAnnualReport = async (req, res) => {
  try {
    if (!['admin', 'editor'].includes(req.treeAccess.role)) {
      return res.status(403).json({ message: 'Không có quyền truy cập báo cáo' })
    }

    const treeId = +req.params.treeId
    const currentYear = new Date().getFullYear()
    const fromYear = parseInt(req.query.fromYear) || (currentYear - 5)
    const toYear = parseInt(req.query.toYear) || currentYear
    
    // Thêm tham số type để tối ưu query (members, achievements, hoặc all)
    const reportType = req.query.type || 'all' 

    const result = {}

    // ----------------------------------------------------------------
    // 1. TÍNH TOÁN DỮ LIỆU BÁO CÁO BM11.1 (Tăng giảm thành viên)
    // ----------------------------------------------------------------
    if (reportType === 'all' || reportType === 'members') {
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
        const sinh = members.filter(m => m.birthDate && m.birthDate.getFullYear() === year).length
        const ketHon = marriages.filter(m => m.marriageDate && m.marriageDate.getFullYear() === year).length
        const mat = members.filter(m => m.death && m.death.deathDate.getFullYear() === year).length

        const tongThanhVien = members.filter(m => {
          if (m.birthDate) return m.birthDate.getFullYear() <= year;
          return m.createdAt.getFullYear() <= year; 
        }).length

        const tongMatDenNamDo = members.filter(m => m.death && m.death.deathDate.getFullYear() <= year).length
        const tongConSong = tongThanhVien - tongMatDenNamDo

        totalSinh += sinh;
        totalKetHon += ketHon;
        totalMat += mat;

        memberStats.push({ year, sinh, ketHon, mat, tongConSong, tongThanhVien })
      }
      
      result.memberStats = { rows: memberStats, totals: { totalSinh, totalKetHon, totalMat } }
    }

    // ----------------------------------------------------------------
    // 2. TÍNH TOÁN DỮ LIỆU BÁO CÁO BM11.2 (Báo cáo thành tích)
    // ----------------------------------------------------------------
    if (reportType === 'all' || reportType === 'achievements') {
      const achievements = await prisma.achievement.findMany({
        where: {
          year: { gte: fromYear, lte: toYear },
          member: { treeId: treeId }
        },
        include: { member: true }
      })

      const achMap = {}
      achievements.forEach(a => {
        if (!achMap[a.type]) achMap[a.type] = []
        achMap[a.type].push(a)
      })

      const achievementStats = Object.keys(achMap).map(type => {
        const list = achMap[type]
        const count = list.length

        const levelCounts = {}
        list.forEach(a => { levelCounts[a.level] = (levelCounts[a.level] || 0) + 1 })
        const commonLevel = Object.keys(levelCounts).sort((a, b) => levelCounts[b] - levelCounts[a])[0]

        const memberCounts = {}
        list.forEach(a => {
          const name = a.member.fullName
          memberCounts[name] = (memberCounts[name] || 0) + 1
        })
        const topMember = Object.keys(memberCounts).sort((a, b) => memberCounts[b] - memberCounts[a])[0]

        return { type, count, commonLevel, topMember }
      })

      result.achievementStats = achievementStats
    }

    res.json(result)

  } catch (err) { res.status(500).json({ message: err.message }) }
}