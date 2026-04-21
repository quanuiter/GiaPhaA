const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

/**
 * Seed gia phả HỌ NGÔ — 10 đời (~55 thành viên)
 *
 * Khoảng cách mỗi đời: ~27 năm
 *  Đời 1: 1768   →  Đời 10: 2020–2026
 *
 * Trường hợp đa dạng:
 *  ✔ Đa hôn (2 vợ − vợ cả mất, cưới vợ thứ)    đời 4
 *  ✔ Ly hôn + tái hôn                            đời 8
 *  ✔ Góa (widowed)                                đời 6, 7
 *  ✔ Con nuôi (isAdopted)                         đời 8
 *  ✔ Chết trẻ / tuyệt tự                         đời 2
 *  ✔ Đông con (4 con)                             đời 6 → 7
 *  ✔ Chết chiến tranh                             đời 7
 *  ✔ Chết do tai nạn lao động                     đời 7
 *  ✔ Chết do dịch bệnh (nạn đói 1945)            đời 6
 *  ✔ Độc thân suốt đời                           đời 8
 *  ✔ Chưa kết hôn (trẻ)                          đời 9
 *  ✔ Trẻ sơ sinh 2026                            đời 10
 *  ✔ Thành tích (giáo dục, quân sự, y khoa, IT)
 *  ✔ Ngày giỗ, sự kiện họp họ
 */

async function main() {
  // ═══════════════════════════════════════════════════
  // 1. TÀI KHOẢN
  // ═══════════════════════════════════════════════════
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: { username: 'admin', passwordHash: await bcrypt.hash('admin123', 10), status: 'active' }
  })
  const editor = await prisma.user.upsert({
    where: { username: 'editor1' },
    update: {},
    create: { username: 'editor1', passwordHash: await bcrypt.hash('editor123', 10), status: 'active' }
  })
  const viewer = await prisma.user.upsert({
    where: { username: 'viewer1' },
    update: {},
    create: { username: 'viewer1', passwordHash: await bcrypt.hash('viewer123', 10), status: 'active' }
  })
  console.log('✅ Tạo tài khoản xong')

  // ═══════════════════════════════════════════════════
  // 2. CẤU HÌNH HỆ THỐNG
  // ═══════════════════════════════════════════════════
  for (const c of [
    { key: 'avatarMaxMB', value: '5',  description: 'Dung lượng ảnh đại diện tối đa (MB)' },
    { key: 'logoMaxMB',   value: '2',  description: 'Dung lượng logo tối đa (MB)' },
    { key: 'bannerMaxMB', value: '10', description: 'Dung lượng banner tối đa (MB)' },
  ]) await prisma.systemConfig.upsert({ where: { key: c.key }, update: {}, create: { ...c, updatedAt: new Date() } })
  console.log('✅ Tạo cấu hình hệ thống xong')

  // ═══════════════════════════════════════════════════
  // 3. TẠO CÂY GIA PHẢ — HỌ NGÔ
  // ═══════════════════════════════════════════════════
  const tree = await prisma.familyTree.create({
    data: {
      name: 'Gia Phả Họ Ngô', status: 'active', createdBy: admin.id,
      description: 'Gia phả dòng họ Ngô — quê gốc Hoằng Hóa, Thanh Hóa. Truy nguyên từ thế kỷ 18.',
      userAccess: { createMany: { data: [
        { userId: admin.id,  role: 'admin'  },
        { userId: editor.id, role: 'editor' },
        { userId: viewer.id, role: 'viewer' },
      ]}},
      configs: { createMany: { data: [
        { key: 'maxGenDisplay', value: '10' },
        { key: 'reminderDays',  value: '7'  },
        { key: 'maxBloodGen',   value: '3'  },
      ]}},
    }
  })
  const T = tree.id

  // ─── helpers ───────────────────────────────────────
  const m = (d) => prisma.member.create({ data: { treeId: T, ...d } })
  const w = (d) => prisma.marriage.create({ data: { treeId: T, ...d } })
  const die = async (id, d) => {
    await prisma.death.create({ data: { memberId: id, ...d } })
    await prisma.member.update({ where: { id }, data: { isDeceased: true } })
  }
  const ach = (d) => prisma.achievement.create({ data: d })
  const evt = (d) => prisma.familyEvent.create({ data: { treeId: T, ...d } })

  // ══════════════════════════════════════════════════════════════
  //  ĐỜI 1  (sinh ~1768)
  // ══════════════════════════════════════════════════════════════
  const to = await m({
    fullName: 'Ngô Phúc Tổ', gender: 'male', generation: 1,
    birthDate: new Date('1768-03-15'), birthPlace: 'Hoằng Hóa, Thanh Hóa',
    hometown: 'Thanh Hóa', occupation: 'Nông dân',
    bio: 'Thủy Tổ dòng họ Ngô, khai cơ lập nghiệp tại Hoằng Hóa, Thanh Hóa.',
  })
  const ngoc = await m({
    fullName: 'Trần Thị Ngọc', gender: 'female', generation: 1,
    birthDate: new Date('1772-08-20'), hometown: 'Thanh Hóa',
  })
  await w({ husbandId: to.id, wifeId: ngoc.id, marriageDate: new Date('1790-01-15'), status: 'widowed' })
  await die(to.id,  { deathDate: new Date('1845-05-10'), cause: 'old_age', burialPlace: 'cemetery', longevity: 77, note: 'Thủy Tổ dòng họ Ngô' })
  await die(ngoc.id,{ deathDate: new Date('1850-11-22'), cause: 'old_age', burialPlace: 'cemetery', longevity: 78 })

  // ══════════════════════════════════════════════════════════════
  //  ĐỜI 2  (sinh ~1793–1800)
  // ══════════════════════════════════════════════════════════════
  const duc = await m({
    fullName: 'Ngô Văn Đức', gender: 'male', generation: 2,
    birthDate: new Date('1793-06-10'), fatherId: to.id, motherId: ngoc.id,
    hometown: 'Thanh Hóa', occupation: 'Nông dân',
    bio: 'Trưởng nam, nối nghiệp cha trông coi ruộng vườn dòng tộc.',
  })
  const hoaD2 = await m({
    fullName: 'Lê Thị Hoa', gender: 'female', generation: 2,
    birthDate: new Date('1796-02-18'), hometown: 'Nghệ An',
  })
  await w({ husbandId: duc.id, wifeId: hoaD2.id, marriageDate: new Date('1818-01-10'), status: 'widowed' })
  await die(duc.id,  { deathDate: new Date('1870-03-18'), cause: 'old_age', burialPlace: 'cemetery', longevity: 77 })
  await die(hoaD2.id,{ deathDate: new Date('1875-08-05'), cause: 'old_age', burialPlace: 'cemetery', longevity: 79 })

  // Chết trẻ, tuyệt tự
  const hien = await m({
    fullName: 'Ngô Văn Hiền', gender: 'male', generation: 2,
    birthDate: new Date('1796-09-01'), fatherId: to.id, motherId: ngoc.id,
    hometown: 'Thanh Hóa', bio: 'Mất sớm do bệnh, chưa lập gia đình.',
  })
  await die(hien.id, { deathDate: new Date('1818-06-12'), cause: 'critical_illness', burialPlace: 'cemetery', longevity: 22, note: 'Mất trẻ do bệnh phổi' })

  // Con gái gả đi
  const lan = await m({
    fullName: 'Ngô Thị Lan', gender: 'female', generation: 2,
    birthDate: new Date('1800-12-25'), fatherId: to.id, motherId: ngoc.id,
    hometown: 'Thanh Hóa', bio: 'Gả về họ Phạm ở Ninh Bình.',
  })
  await die(lan.id, { deathDate: new Date('1878-10-15'), cause: 'old_age', burialPlace: 'cemetery', longevity: 78 })

  // ══════════════════════════════════════════════════════════════
  //  ĐỜI 3  (sinh ~1822–1826)
  // ══════════════════════════════════════════════════════════════
  const trung = await m({
    fullName: 'Ngô Văn Trung', gender: 'male', generation: 3,
    birthDate: new Date('1822-03-15'), fatherId: duc.id, motherId: hoaD2.id,
    hometown: 'Thanh Hóa', occupation: 'Thầy đồ',
    bio: 'Đỗ thi Hương, dạy chữ Hán trong làng.',
  })
  const mai = await m({
    fullName: 'Phạm Thị Mai', gender: 'female', generation: 3,
    birthDate: new Date('1825-07-08'), hometown: 'Ninh Bình',
  })
  await w({ husbandId: trung.id, wifeId: mai.id, marriageDate: new Date('1846-01-01'), status: 'widowed' })
  await die(trung.id,{ deathDate: new Date('1898-07-20'), cause: 'old_age', burialPlace: 'temple', longevity: 76 })
  await die(mai.id,  { deathDate: new Date('1903-01-10'), cause: 'old_age', burialPlace: 'temple', longevity: 78 })
  await ach({ memberId: trung.id, type: 'education', level: 'province', year: 1845, description: 'Đỗ thi Hương, được phong Thầy đồ dạy học trong vùng' })

  const bich = await m({
    fullName: 'Ngô Thị Bích', gender: 'female', generation: 3,
    birthDate: new Date('1826-05-30'), fatherId: duc.id, motherId: hoaD2.id,
    hometown: 'Thanh Hóa', bio: 'Gả về họ Lê ở Nghệ An.',
  })
  await die(bich.id, { deathDate: new Date('1903-06-12'), cause: 'old_age', burialPlace: 'cemetery', longevity: 77 })

  // ══════════════════════════════════════════════════════════════
  //  ĐỜI 4  (sinh ~1849–1858)  ── ĐA HÔN — 2 vợ
  // ══════════════════════════════════════════════════════════════
  const khanh = await m({
    fullName: 'Ngô Văn Khánh', gender: 'male', generation: 4,
    birthDate: new Date('1849-02-14'), fatherId: trung.id, motherId: mai.id,
    hometown: 'Thanh Hóa', occupation: 'Thương nhân',
    bio: 'Buôn bán đường dài Thanh Hóa – Thăng Long. Vợ cả mất sớm, tục huyền vợ thứ.',
  })

  // Vợ cả — mất sớm do bệnh hiểm nghèo
  const duyen = await m({
    fullName: 'Nguyễn Thị Duyên', gender: 'female', generation: 4,
    birthDate: new Date('1852-08-30'), hometown: 'Hà Nội',
    bio: 'Vợ cả ông Khánh, mất sớm do bệnh.',
  })
  await w({ husbandId: khanh.id, wifeId: duyen.id, marriageDate: new Date('1872-01-01'), status: 'widowed' })
  await die(duyen.id, { deathDate: new Date('1882-04-10'), cause: 'critical_illness', burialPlace: 'cemetery', longevity: 30, note: 'Mất sớm do bệnh hiểm nghèo' })

  // Vợ thứ — cưới sau khi vợ cả mất
  const nhan = await m({
    fullName: 'Bùi Thị Nhàn', gender: 'female', generation: 4,
    birthDate: new Date('1858-03-05'), hometown: 'Thanh Hóa',
    bio: 'Vợ kế ông Khánh, hết lòng nuôi cả con chồng.',
  })
  await w({ husbandId: khanh.id, wifeId: nhan.id, marriageDate: new Date('1884-01-01'), status: 'widowed' })

  await die(khanh.id,{ deathDate: new Date('1924-11-05'), cause: 'old_age', burialPlace: 'cemetery', longevity: 75 })
  await die(nhan.id, { deathDate: new Date('1935-09-15'), cause: 'old_age', burialPlace: 'cemetery', longevity: 77 })

  // Con gái gả đi
  const sen = await m({
    fullName: 'Ngô Thị Sen', gender: 'female', generation: 4,
    birthDate: new Date('1855-11-20'), fatherId: trung.id, motherId: mai.id,
    hometown: 'Thanh Hóa',
  })
  await die(sen.id, { deathDate: new Date('1933-08-15'), cause: 'old_age', burialPlace: 'cemetery', longevity: 78 })

  // ══════════════════════════════════════════════════════════════
  //  ĐỜI 5  (sinh ~1875–1890)
  // ══════════════════════════════════════════════════════════════

  // Con vợ cả (Duyên)
  const loi = await m({
    fullName: 'Ngô Văn Lợi', gender: 'male', generation: 5,
    birthDate: new Date('1875-05-18'), fatherId: khanh.id, motherId: duyen.id,
    hometown: 'Thanh Hóa', occupation: 'Nông dân',
    bio: 'Con vợ cả, trưởng nam nối dõi.',
  })
  const tho = await m({
    fullName: 'Vũ Thị Thơ', gender: 'female', generation: 5,
    birthDate: new Date('1878-04-02'), hometown: 'Nghệ An',
  })
  await w({ husbandId: loi.id, wifeId: tho.id, marriageDate: new Date('1900-01-01'), status: 'widowed' })
  await die(loi.id, { deathDate: new Date('1950-07-22'), cause: 'old_age', burialPlace: 'cemetery', longevity: 75 })
  await die(tho.id, { deathDate: new Date('1955-02-25'), cause: 'old_age', burialPlace: 'cemetery', longevity: 77 })

  // Con vợ thứ (Nhàn) — nhánh phụ
  const phu = await m({
    fullName: 'Ngô Văn Phú', gender: 'male', generation: 5,
    birthDate: new Date('1886-09-12'), fatherId: khanh.id, motherId: nhan.id,
    hometown: 'Thanh Hóa', occupation: 'Thương nhân',
    bio: 'Con vợ thứ, theo nghiệp buôn bán của cha.',
  })
  const lieu = await m({
    fullName: 'Trương Thị Liễu', gender: 'female', generation: 5,
    birthDate: new Date('1889-05-10'), hometown: 'Thanh Hóa',
  })
  await w({ husbandId: phu.id, wifeId: lieu.id, marriageDate: new Date('1910-01-01'), status: 'widowed' })
  await die(phu.id,  { deathDate: new Date('1960-11-05'), cause: 'old_age', burialPlace: 'cemetery', longevity: 74 })
  await die(lieu.id, { deathDate: new Date('1965-08-20'), cause: 'old_age', burialPlace: 'cemetery', longevity: 76 })

  const hanhD5 = await m({
    fullName: 'Ngô Thị Hạnh', gender: 'female', generation: 5,
    birthDate: new Date('1890-01-25'), fatherId: khanh.id, motherId: nhan.id,
    hometown: 'Thanh Hóa', bio: 'Gả về họ Hoàng ở Hà Tĩnh.',
  })
  await die(hanhD5.id, { deathDate: new Date('1968-06-30'), cause: 'old_age', burialPlace: 'cemetery', longevity: 78 })

  // ══════════════════════════════════════════════════════════════
  //  ĐỜI 6  (sinh ~1903–1912)  ── NẠN ĐÓI 1945
  // ══════════════════════════════════════════════════════════════

  // Nhánh chính (con ông Lợi)
  const hung = await m({
    fullName: 'Ngô Văn Hưng', gender: 'male', generation: 6,
    birthDate: new Date('1903-04-25'), fatherId: loi.id, motherId: tho.id,
    hometown: 'Thanh Hóa', occupation: 'Nông dân',
    bio: 'Mất trong nạn đói Ất Dậu 1945, để lại vợ góa nuôi 4 con nhỏ.',
    birthDateLunar: '10/3 Quý Mão',
  })
  const le = await m({
    fullName: 'Nguyễn Thị Lệ', gender: 'female', generation: 6,
    birthDate: new Date('1907-10-08'), hometown: 'Thanh Hóa',
    bio: 'Góa chồng năm 38 tuổi, một mình nuôi 4 con trưởng thành.',
  })
  await w({ husbandId: hung.id, wifeId: le.id, marriageDate: new Date('1928-01-01'), status: 'widowed' })
  await die(hung.id, { deathDate: new Date('1945-03-15'), cause: 'epidemic', burialPlace: 'cemetery', longevity: 42, note: 'Mất trong nạn đói Ất Dậu 1945' })
  await die(le.id,   { deathDate: new Date('1987-12-05'), cause: 'old_age', burialPlace: 'cemetery', longevity: 80 })

  const tam = await m({
    fullName: 'Ngô Văn Tâm', gender: 'male', generation: 6,
    birthDate: new Date('1906-08-20'), fatherId: loi.id, motherId: tho.id,
    hometown: 'Thanh Hóa', occupation: 'Thầy thuốc',
    bio: 'Thầy thuốc Đông y, chữa bệnh cho dân làng.',
  })
  const minh6 = await m({
    fullName: 'Đào Thị Minh', gender: 'female', generation: 6,
    birthDate: new Date('1910-04-15'), hometown: 'Thanh Hóa',
  })
  await w({ husbandId: tam.id, wifeId: minh6.id, marriageDate: new Date('1933-01-01'), status: 'widowed' })
  await die(tam.id,   { deathDate: new Date('1984-04-10'), cause: 'old_age', burialPlace: 'temple', longevity: 78 })
  await die(minh6.id, { deathDate: new Date('1990-11-10'), cause: 'old_age', burialPlace: 'temple', longevity: 80 })
  await ach({ memberId: tam.id, type: 'medical', level: 'local', year: 1950, description: 'Được phong danh hiệu "Lương y từ mẫu" trong vùng' })

  const phuong = await m({
    fullName: 'Ngô Thị Phương', gender: 'female', generation: 6,
    birthDate: new Date('1908-06-14'), fatherId: loi.id, motherId: tho.id,
    hometown: 'Thanh Hóa', bio: 'Gả về họ Lê ở Hà Nội.',
  })
  await die(phuong.id, { deathDate: new Date('1986-02-28'), cause: 'old_age', burialPlace: 'cemetery', longevity: 78 })

  // Nhánh phụ (con ông Phú) — dừng ở đây
  const quang = await m({
    fullName: 'Ngô Văn Quang', gender: 'male', generation: 6,
    birthDate: new Date('1912-11-08'), fatherId: phu.id, motherId: lieu.id,
    hometown: 'Thanh Hóa', occupation: 'Thợ mộc',
    bio: 'Nhánh con ông Phú, nghệ nhân đồ gỗ.',
  })
  await die(quang.id, { deathDate: new Date('1988-05-20'), cause: 'old_age', burialPlace: 'cemetery', longevity: 76 })

  // ══════════════════════════════════════════════════════════════
  //  ĐỜI 7  (sinh ~1930–1940)  ── CHIẾN TRANH VIỆT NAM
  // ══════════════════════════════════════════════════════════════

  // --- Nhánh ông Hưng (4 con) ---
  const thanh = await m({
    fullName: 'Ngô Văn Thành', gender: 'male', generation: 7,
    birthDate: new Date('1930-01-10'), fatherId: hung.id, motherId: le.id,
    hometown: 'Thanh Hóa', occupation: 'Quân nhân',
    bio: 'Tham gia kháng chiến chống Mỹ, hy sinh anh dũng tại mặt trận Quảng Trị.',
    birthDateLunar: '12/12 Kỷ Tỵ',
  })
  const ly = await m({
    fullName: 'Hoàng Thị Lý', gender: 'female', generation: 7,
    birthDate: new Date('1934-06-18'), hometown: 'Hà Nội',
    bio: 'Góa chồng liệt sĩ, một mình nuôi con khôn lớn.',
  })
  await w({ husbandId: thanh.id, wifeId: ly.id, marriageDate: new Date('1956-01-15'), status: 'widowed' })
  await die(thanh.id, { deathDate: new Date('1968-02-15'), cause: 'war', burialPlace: 'cemetery', longevity: 38, note: 'Liệt sĩ chống Mỹ, mặt trận Quảng Trị' })
  await die(ly.id,    { deathDate: new Date('2018-08-10'), cause: 'old_age', burialPlace: 'cemetery', longevity: 84 })
  await ach({ memberId: thanh.id, type: 'military', level: 'national', year: 1968, description: 'Huân chương Chiến sĩ vẻ vang hạng Nhất (truy tặng)', issuedBy: 'Nhà nước Việt Nam' })

  // Liệt sĩ, chưa lập gia đình
  const vinh = await m({
    fullName: 'Ngô Văn Vinh', gender: 'male', generation: 7,
    birthDate: new Date('1933-03-22'), fatherId: hung.id, motherId: le.id,
    hometown: 'Thanh Hóa', occupation: 'Quân nhân',
    bio: 'Hy sinh tại chiến trường miền Nam, chưa kịp lập gia đình.',
  })
  await die(vinh.id, { deathDate: new Date('1965-11-08'), cause: 'war', burialPlace: 'cemetery', longevity: 32, note: 'Liệt sĩ chống Mỹ, chưa lập gia đình' })
  await ach({ memberId: vinh.id, type: 'military', level: 'national', year: 1965, description: 'Huân chương Chiến sĩ giải phóng (truy tặng)', issuedBy: 'Mặt trận Dân tộc Giải phóng' })

  // Con gái gả đi
  const hoaD7 = await m({
    fullName: 'Ngô Thị Hòa', gender: 'female', generation: 7,
    birthDate: new Date('1936-07-15'), fatherId: hung.id, motherId: le.id,
    hometown: 'Thanh Hóa', bio: 'Gả về họ Trần ở Nghệ An.',
  })
  await die(hoaD7.id, { deathDate: new Date('2020-03-20'), cause: 'old_age', burialPlace: 'cemetery', longevity: 84 })

  // Tai nạn lao động
  const duong = await m({
    fullName: 'Ngô Văn Dương', gender: 'male', generation: 7,
    birthDate: new Date('1938-12-05'), fatherId: hung.id, motherId: le.id,
    hometown: 'Thanh Hóa', occupation: 'Công nhân',
    bio: 'Làm công nhân nhà máy, mất do tai nạn lao động.',
  })
  await die(duong.id, { deathDate: new Date('1975-05-10'), cause: 'accident_work', burialPlace: 'cemetery', longevity: 37, note: 'Tai nạn lao động tại nhà máy' })

  // --- Nhánh ông Tâm (2 con) ---
  const dao = await m({
    fullName: 'Ngô Văn Đạo', gender: 'male', generation: 7,
    birthDate: new Date('1937-05-22'), fatherId: tam.id, motherId: minh6.id,
    hometown: 'Thanh Hóa', occupation: 'Giáo viên',
    bio: 'Giáo viên cấp 2, dạy Toán và Lý.',
  })
  const van = await m({
    fullName: 'Lê Thị Vân', gender: 'female', generation: 7,
    birthDate: new Date('1940-09-10'), hometown: 'Nghệ An',
    bio: 'Hiện sống cùng con trai tại Thanh Hóa.',
  })
  await w({ husbandId: dao.id, wifeId: van.id, marriageDate: new Date('1963-01-01'), status: 'widowed' })
  await die(dao.id, { deathDate: new Date('2015-09-15'), cause: 'old_age', burialPlace: 'cemetery', longevity: 78 })
  // Bà Vân còn sống (86 tuổi năm 2026)

  const cuc = await m({
    fullName: 'Ngô Thị Cúc', gender: 'female', generation: 7,
    birthDate: new Date('1940-11-30'), fatherId: tam.id, motherId: minh6.id,
    hometown: 'Thanh Hóa', bio: 'Gả về họ Đặng ở Hà Nội. Hiện còn sống, 86 tuổi.',
  })
  // Bà Cúc còn sống (86 tuổi năm 2026)

  // ══════════════════════════════════════════════════════════════
  //  ĐỜI 8  (sinh ~1958–1967)  ── LY HÔN, CON NUÔI, ĐỘC THÂN
  // ══════════════════════════════════════════════════════════════

  // --- Nhánh ông Thành ---
  const hungD8 = await m({
    fullName: 'Ngô Văn Hùng', gender: 'male', generation: 8,
    birthDate: new Date('1958-07-15'), fatherId: thanh.id, motherId: ly.id,
    hometown: 'Thanh Hóa', occupation: 'Kỹ sư',
    bio: 'Kỹ sư xây dựng, tốt nghiệp Đại học Bách khoa Hà Nội.',
    phone: '0912345001', email: 'ngohung@example.com',
    address: '45 Lê Lai, TP. Thanh Hóa',
  })
  const ngan = await m({
    fullName: 'Phạm Thị Ngân', gender: 'female', generation: 8,
    birthDate: new Date('1962-03-20'), hometown: 'Hà Nội', occupation: 'Giáo viên',
    phone: '0912345002', email: 'pngan@example.com',
  })
  await w({ husbandId: hungD8.id, wifeId: ngan.id, marriageDate: new Date('1985-05-01'), status: 'living' })
  await ach({ memberId: hungD8.id, type: 'education', level: 'national', year: 1983, description: 'Tốt nghiệp Kỹ sư loại Giỏi Đại học Bách khoa Hà Nội', issuedBy: 'Đại học Bách khoa Hà Nội' })

  // LY HÔN + TÁI HÔN
  const hanhD8 = await m({
    fullName: 'Ngô Thị Hạnh', gender: 'female', generation: 8,
    birthDate: new Date('1960-10-12'), fatherId: thanh.id, motherId: ly.id,
    hometown: 'Thanh Hóa', occupation: 'Kế toán',
    bio: 'Ly hôn chồng đầu (1990), tái hôn hạnh phúc (1993).',
    phone: '0912345003',
  })
  const binh = await m({
    fullName: 'Lý Văn Bình', gender: 'male', generation: 8,
    birthDate: new Date('1958-02-28'), hometown: 'Hà Nội', occupation: 'Công nhân',
  })
  const dai = await m({
    fullName: 'Trương Văn Đại', gender: 'male', generation: 8,
    birthDate: new Date('1960-08-15'), hometown: 'Thanh Hóa', occupation: 'Kỹ sư',
  })
  await w({ husbandId: binh.id, wifeId: hanhD8.id, marriageDate: new Date('1983-06-01'), status: 'divorced', divorceDate: new Date('1990-03-15'), note: 'Ly hôn do bất đồng quan điểm sống' })
  await w({ husbandId: dai.id, wifeId: hanhD8.id, marriageDate: new Date('1993-01-10'), status: 'living' })

  // CON NUÔI
  const tinh = await m({
    fullName: 'Ngô Văn Tình', gender: 'male', generation: 8,
    birthDate: new Date('1963-01-05'), fatherId: thanh.id, motherId: ly.id,
    hometown: 'Thanh Hóa', occupation: 'Kinh doanh', isAdopted: true,
    bio: 'Con nuôi bà Lý, gốc họ Trần. Được nhận nuôi từ nhỏ do cha mẹ ruột mất sớm.',
    phone: '0912345004', email: 'ngotinh@example.com',
  })
  const lanD8 = await m({
    fullName: 'Bùi Thị Lan', gender: 'female', generation: 8,
    birthDate: new Date('1966-07-22'), hometown: 'Hà Nội',
  })
  await w({ husbandId: tinh.id, wifeId: lanD8.id, marriageDate: new Date('1990-06-01'), status: 'living' })
  await ach({ memberId: tinh.id, type: 'business', level: 'province', year: 2005, description: 'Doanh nhân tiêu biểu tỉnh Thanh Hóa', issuedBy: 'UBND tỉnh Thanh Hóa' })

  // --- Nhánh ông Đạo ---
  const nam = await m({
    fullName: 'Ngô Văn Nam', gender: 'male', generation: 8,
    birthDate: new Date('1965-04-18'), fatherId: dao.id, motherId: van.id,
    hometown: 'Thanh Hóa', occupation: 'Nông dân',
    phone: '0912345005',
    bio: 'Ở lại quê canh tác ruộng vườn, chăm sóc mẹ già.',
  })
  const hoaD8 = await m({
    fullName: 'Trần Thị Hoa', gender: 'female', generation: 8,
    birthDate: new Date('1968-09-05'), hometown: 'Thanh Hóa',
  })
  await w({ husbandId: nam.id, wifeId: hoaD8.id, marriageDate: new Date('1992-01-01'), status: 'living' })

  // ĐỘC THÂN suốt đời
  const xuan = await m({
    fullName: 'Ngô Thị Xuân', gender: 'female', generation: 8,
    birthDate: new Date('1967-03-28'), fatherId: dao.id, motherId: van.id,
    hometown: 'Hà Nội', occupation: 'Giáo viên',
    bio: 'Sống độc thân, cống hiến cho ngành giáo dục. Nhận danh hiệu Nhà giáo Ưu tú.',
    phone: '0912345006', email: 'ngoxuan@example.com',
    address: '78 Hoàng Hoa Thám, Hà Nội',
  })
  await ach({ memberId: xuan.id, type: 'teaching', level: 'national', year: 2010, description: 'Nhà giáo Ưu tú', issuedBy: 'Bộ Giáo dục và Đào tạo' })

  // ══════════════════════════════════════════════════════════════
  //  ĐỜI 9  (sinh ~1988–1996)  ── THẾ HỆ TRẺ
  // ══════════════════════════════════════════════════════════════

  // Con ông Hùng
  const minhD9 = await m({
    fullName: 'Ngô Văn Minh', gender: 'male', generation: 9,
    birthDate: new Date('1988-11-08'), fatherId: hungD8.id, motherId: ngan.id,
    hometown: 'Thanh Hóa', occupation: 'Kỹ sư IT',
    bio: 'Giám đốc startup công nghệ, tốt nghiệp ĐH Bách khoa HN.',
    phone: '0988001001', email: 'ngominh@example.com',
    address: '120 Nguyễn Trãi, Thanh Xuân, Hà Nội',
  })
  const trang = await m({
    fullName: 'Trần Thị Trang', gender: 'female', generation: 9,
    birthDate: new Date('1991-05-15'), hometown: 'Hà Nội', occupation: 'Dược sĩ',
    phone: '0988001002', email: 'trang.tt@example.com',
  })
  await w({ husbandId: minhD9.id, wifeId: trang.id, marriageDate: new Date('2017-12-25'), status: 'living' })
  await ach({ memberId: minhD9.id, type: 'business', level: 'province', year: 2022, description: 'Giải Nhì cuộc thi Startup Việt Nam', issuedBy: 'Bộ KH&CN' })

  // Chưa kết hôn
  const maiD9 = await m({
    fullName: 'Ngô Thị Mai', gender: 'female', generation: 9,
    birthDate: new Date('1992-08-20'), fatherId: hungD8.id, motherId: ngan.id,
    hometown: 'Hà Nội', occupation: 'Kiến trúc sư',
    bio: 'Kiến trúc sư, đang tập trung phát triển sự nghiệp.',
    phone: '0988001003', email: 'maiarchitect@example.com',
    address: '50 Kim Mã, Ba Đình, Hà Nội',
  })

  // Con ông Tình (con nuôi)
  const khang = await m({
    fullName: 'Ngô Gia Khang', gender: 'male', generation: 9,
    birthDate: new Date('1993-06-10'), fatherId: tinh.id, motherId: lanD8.id,
    hometown: 'Thanh Hóa', occupation: 'Doanh nhân',
    bio: 'Nối nghiệp kinh doanh của cha, mở rộng ra TP.HCM.',
    phone: '0988001004', email: 'khang.ngo@example.com',
  })
  const linh = await m({
    fullName: 'Đặng Thị Linh', gender: 'female', generation: 9,
    birthDate: new Date('1996-02-14'), hometown: 'TP. Hồ Chí Minh', occupation: 'Marketing',
    phone: '0988001005',
  })
  await w({ husbandId: khang.id, wifeId: linh.id, marriageDate: new Date('2020-05-01'), status: 'living' })

  // Con ông Nam
  const tung = await m({
    fullName: 'Ngô Văn Tùng', gender: 'male', generation: 9,
    birthDate: new Date('1994-09-22'), fatherId: nam.id, motherId: hoaD8.id,
    hometown: 'Thanh Hóa', occupation: 'Giáo viên',
    bio: 'Giáo viên dạy Toán THPT tại Thanh Hóa.',
    phone: '0988001006', email: 'tungngo@example.com',
  })
  const hang = await m({
    fullName: 'Nguyễn Thị Hằng', gender: 'female', generation: 9,
    birthDate: new Date('1996-12-30'), hometown: 'Thanh Hóa', occupation: 'Y tá',
    phone: '0988001007',
  })
  await w({ husbandId: tung.id, wifeId: hang.id, marriageDate: new Date('2021-06-15'), status: 'living' })

  // ══════════════════════════════════════════════════════════════
  //  ĐỜI 10  (sinh 2020–2026)  ── TRẺ EM & SƠ SINH
  // ══════════════════════════════════════════════════════════════

  // Con ông Minh
  await m({
    fullName: 'Ngô Gia Bảo', gender: 'male', generation: 10,
    birthDate: new Date('2020-05-15'), fatherId: minhD9.id, motherId: trang.id,
    hometown: 'Hà Nội', bio: 'Đang học lớp 1.',
  })
  await m({
    fullName: 'Ngô Minh Châu', gender: 'female', generation: 10,
    birthDate: new Date('2023-08-10'), fatherId: minhD9.id, motherId: trang.id,
    hometown: 'Hà Nội',
  })

  // Con ông Khang
  await m({
    fullName: 'Ngô Đức An', gender: 'male', generation: 10,
    birthDate: new Date('2022-03-20'), fatherId: khang.id, motherId: linh.id,
    hometown: 'TP. Hồ Chí Minh',
  })
  await m({
    fullName: 'Ngô An Nhiên', gender: 'female', generation: 10,
    birthDate: new Date('2025-01-15'), fatherId: khang.id, motherId: linh.id,
    hometown: 'TP. Hồ Chí Minh', bio: 'Mới 1 tuổi.',
  })

  // Con ông Tùng — bao gồm trẻ sơ sinh 2026!
  await m({
    fullName: 'Ngô Minh Anh', gender: 'female', generation: 10,
    birthDate: new Date('2024-07-05'), fatherId: tung.id, motherId: hang.id,
    hometown: 'Thanh Hóa',
  })
  await m({
    fullName: 'Ngô Hải Đăng', gender: 'male', generation: 10,
    birthDate: new Date('2026-01-10'), fatherId: tung.id, motherId: hang.id,
    hometown: 'Thanh Hóa', bio: 'Mới sinh tháng 1/2026.',
  })

  console.log('✅ Tạo gia phả Họ Ngô — 10 đời xong')

  // ══════════════════════════════════════════════════════════════
  //  SỰ KIỆN GIA PHẢ
  // ══════════════════════════════════════════════════════════════
  await evt({ type: 'anniversary', name: `Ngày giỗ: ${to.fullName}`, eventDate: new Date('1845-05-10'), lunarDate: '5/4', relatedMemberId: to.id, canDelete: false, note: 'Giỗ Thủy Tổ dòng họ Ngô' })
  await evt({ type: 'anniversary', name: `Ngày giỗ: ${thanh.fullName}`, eventDate: new Date('1968-02-15'), lunarDate: '18/1', relatedMemberId: thanh.id, canDelete: false, note: 'Liệt sĩ chống Mỹ' })
  await evt({ type: 'anniversary', name: `Ngày giỗ: ${vinh.fullName}`, eventDate: new Date('1965-11-08'), lunarDate: '15/10', relatedMemberId: vinh.id, canDelete: false, note: 'Liệt sĩ chống Mỹ' })
  await evt({ type: 'anniversary', name: `Ngày giỗ: ${hung.fullName}`, eventDate: new Date('1945-03-15'), lunarDate: '2/2', relatedMemberId: hung.id, canDelete: false, note: 'Mất trong nạn đói 1945' })
  await evt({ type: 'meeting', name: 'Họp họ thường niên 2026', eventDate: new Date('2026-02-01'), location: 'Nhà thờ họ Ngô, Hoằng Lộc, Hoằng Hóa, Thanh Hóa', canDelete: true, note: 'Họp họ đầu xuân Bính Ngọ' })
  await evt({ type: 'meeting', name: 'Lễ Thanh minh 2026', eventDate: new Date('2026-04-04'), location: 'Nghĩa trang dòng họ, Hoằng Hóa, Thanh Hóa', canDelete: true, note: 'Tảo mộ thanh minh' })
  await evt({ type: 'other', name: 'Trùng tu nhà thờ họ', eventDate: new Date('2025-06-15'), location: 'Nhà thờ họ Ngô, Hoằng Lộc', canDelete: true, note: 'Dự kiến hoàn thành cuối năm 2025' })

  console.log('✅ Tạo sự kiện xong')

  // ══════════════════════════════════════════════════════════════
  //  TỔNG KẾT
  // ══════════════════════════════════════════════════════════════
  const mc = await prisma.member.count({ where: { treeId: T } })
  const mrc = await prisma.marriage.count({ where: { treeId: T } })
  const dc = await prisma.death.count()
  const ac = await prisma.achievement.count()
  const ec = await prisma.familyEvent.count({ where: { treeId: T } })

  console.log('')
  console.log('╔══════════════════════════════════════════╗')
  console.log('║     GIA PHẢ HỌ NGÔ — 10 ĐỜI            ║')
  console.log('╠══════════════════════════════════════════╣')
  console.log(`║  Thành viên:     ${String(mc).padStart(4)}                   ║`)
  console.log(`║  Hôn nhân:       ${String(mrc).padStart(4)}                   ║`)
  console.log(`║  Đã mất:         ${String(dc).padStart(4)}                   ║`)
  console.log(`║  Thành tích:     ${String(ac).padStart(4)}                   ║`)
  console.log(`║  Sự kiện:        ${String(ec).padStart(4)}                   ║`)
  console.log('╠══════════════════════════════════════════╣')
  console.log('║  Trường hợp đặc biệt:                    ║')
  console.log('║  • Đa hôn (2 vợ): Đời 4                  ║')
  console.log('║  • Ly hôn + Tái hôn: Đời 8               ║')
  console.log('║  • Góa (chồng chết): Đời 6, 7            ║')
  console.log('║  • Con nuôi: Đời 8                        ║')
  console.log('║  • Chết trẻ / tuyệt tự: Đời 2            ║')
  console.log('║  • Đông con (4): Đời 6 → 7               ║')
  console.log('║  • Chết chiến tranh: Đời 7                ║')
  console.log('║  • Tai nạn lao động: Đời 7                ║')
  console.log('║  • Dịch bệnh (nạn đói 1945): Đời 6       ║')
  console.log('║  • Độc thân suốt đời: Đời 8              ║')
  console.log('║  • Chưa kết hôn: Đời 9                    ║')
  console.log('║  • Sơ sinh 2026: Đời 10                   ║')
  console.log('╠══════════════════════════════════════════╣')
  console.log('║  Tài khoản test:                          ║')
  console.log('║  admin   / admin123  → admin              ║')
  console.log('║  editor1 / editor123 → editor             ║')
  console.log('║  viewer1 / viewer123 → viewer             ║')
  console.log('╚══════════════════════════════════════════╝')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())