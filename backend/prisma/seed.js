const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {

  // 1. Tạo tài khoản admin
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username:     'admin',
      passwordHash: await bcrypt.hash('admin123', 10),
      status:       'active',
    }
  })

  // Tạo thêm tài khoản editor và viewer để test phân quyền
  const editor = await prisma.user.upsert({
    where: { username: 'editor1' },
    update: {},
    create: {
      username:     'editor1',
      passwordHash: await bcrypt.hash('editor123', 10),
      status:       'active',
    }
  })

  const viewer = await prisma.user.upsert({
    where: { username: 'viewer1' },
    update: {},
    create: {
      username:     'viewer1',
      passwordHash: await bcrypt.hash('viewer123', 10),
      status:       'active',
    }
  })

  console.log('✅ Tạo tài khoản xong')

  // 2. Cấu hình hệ thống (global)
  const configs = [
    { key: 'avatarMaxMB', value: '5',  description: 'Dung lượng ảnh đại diện tối đa (MB)' },
    { key: 'logoMaxMB',   value: '2',  description: 'Dung lượng logo tối đa (MB)' },
    { key: 'bannerMaxMB', value: '10', description: 'Dung lượng banner tối đa (MB)' },
  ]
  for (const c of configs)
    await prisma.systemConfig.upsert({ where: { key: c.key }, update: {}, create: { ...c, updatedAt: new Date() } })

  console.log('✅ Tạo cấu hình hệ thống xong')

  // 3. Tạo cây gia phả #1 — Họ Nguyễn
  const tree1 = await prisma.familyTree.create({
    data: {
      name:        'Gia Phả Họ Nguyễn',
      description: 'Gia phả dòng họ Nguyễn — quê gốc Hà Nội',
      status:      'active',
      createdBy:   admin.id,
      // Phân quyền cho 3 user
      userAccess: {
        createMany: {
          data: [
            { userId: admin.id,  role: 'admin'  },
            { userId: editor.id, role: 'editor' },
            { userId: viewer.id, role: 'viewer' },
          ]
        }
      },
      // Cấu hình riêng cho cây này
      configs: {
        createMany: {
          data: [
            { key: 'maxGenDisplay', value: '10' },
            { key: 'reminderDays',  value: '7'  },
            { key: 'maxBloodGen',   value: '3'  },
          ]
        }
      }
    }
  })

  // 4. Thêm thành viên vào cây #1
  const to = await prisma.member.create({
    data: {
      treeId:     tree1.id,
      fullName:   'Nguyễn Văn Tổ',
      gender:     'male',
      generation: 1,
      birthDate:  new Date('1900-01-01'),
      hometown:   'Hà Nội',
    }
  })

  const cha = await prisma.member.create({
    data: {
      treeId:     tree1.id,
      fullName:   'Nguyễn Văn A',
      gender:     'male',
      generation: 2,
      birthDate:  new Date('1950-05-15'),
      fatherId:   to.id,
    }
  })

  const me = await prisma.member.create({
    data: {
      treeId:     tree1.id,
      fullName:   'Trần Thị B',
      gender:     'female',
      generation: 2,
      birthDate:  new Date('1955-08-20'),
    }
  })

  await prisma.marriage.create({
    data: {
      treeId:       tree1.id,
      husbandId:    cha.id,
      wifeId:       me.id,
      marriageDate: new Date('1978-01-01'),
      status:       'living',
    }
  })

  const con = await prisma.member.create({
    data: {
      treeId:     tree1.id,
      fullName:   'Nguyễn Văn Con',
      gender:     'male',
      generation: 3,
      birthDate:  new Date('1980-03-10'),
      fatherId:   cha.id,
      motherId:   me.id,
    }
  })

  const congai = await prisma.member.create({
    data: {
      treeId:     tree1.id,
      fullName:   'Nguyễn Thị Con Gái',
      gender:     'female',
      generation: 3,
      birthDate:  new Date('1983-07-22'),
      fatherId:   cha.id,
      motherId:   me.id,
    }
  })

  // Ghi nhận tổ đã mất (để test tính năng ngày giỗ)
  await prisma.death.create({
    data: {
      memberId:    to.id,
      deathDate:   new Date('1975-04-10'),
      cause:       'old_age',
      burialPlace: 'cemetery',
      longevity:   75,
      note:        'Cụ tổ dòng họ Nguyễn',
    }
  })
  await prisma.member.update({ where: { id: to.id }, data: { isDeceased: true } })

  // Tạo ngày giỗ tự động
  await prisma.familyEvent.create({
    data: {
      treeId:          tree1.id,
      type:            'anniversary',
      name:            `Ngày giỗ: ${to.fullName}`,
      eventDate:       new Date('1975-04-10'),
      lunarDate:       '10/3',
      relatedMemberId: to.id,
      canDelete:       false,
      note:            'Tự động tạo từ ngày mất',
    }
  })

  // Thêm sự kiện họp họ
  await prisma.familyEvent.create({
    data: {
      treeId:    tree1.id,
      type:      'meeting',
      name:      'Họp họ thường niên 2025',
      eventDate: new Date('2025-01-20'),
      location:  'Nhà thờ họ, Hà Nội',
      canDelete: true,
    }
  })

  console.log('✅ Tạo cây #1 và thành viên xong')

  // 5. Tạo cây gia phả #2 — Họ Trần (để test nhiều cây)
  const tree2 = await prisma.familyTree.create({
    data: {
      name:        'Gia Phả Họ Trần',
      description: 'Gia phả dòng họ Trần — quê gốc Nam Định',
      status:      'active',
      createdBy:   admin.id,
      userAccess: {
        createMany: {
          data: [
            { userId: admin.id, role: 'admin' },
          ]
        }
      },
      configs: {
        createMany: {
          data: [
            { key: 'maxGenDisplay', value: '5' },
            { key: 'reminderDays',  value: '3' },
            { key: 'maxBloodGen',   value: '3' },
          ]
        }
      }
    }
  })

  await prisma.member.create({
    data: {
      treeId:     tree2.id,
      fullName:   'Trần Văn Gốc',
      gender:     'male',
      generation: 1,
      birthDate:  new Date('1890-06-15'),
      hometown:   'Nam Định',
    }
  })

  console.log('✅ Tạo cây #2 xong')
  console.log('')
  console.log('📋 Tài khoản test:')
  console.log('   admin   / admin123  → admin  cây Nguyễn + Trần')
  console.log('   editor1 / editor123 → editor cây Nguyễn')
  console.log('   viewer1 / viewer123 → viewer cây Nguyễn')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())