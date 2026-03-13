const { PrismaClient } = require('@prisma/client');

// Khởi tạo client với một chút cấu hình để tránh lỗi khởi tạo trống
const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

async function main() {
  console.log('--- Bắt đầu Seed dữ liệu ---');

  // Sử dụng upsert để tránh lỗi trùng lặp nếu bạn chạy lệnh này nhiều lần
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: 'admin123', // Sau này nhớ dùng bcrypt để hash
      role: 'admin',
      status: 'active'
    },
  });

  console.log('Đã tạo/cập nhật tài khoản Admin:', admin.username);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('--- Seed hoàn tất ---');
  })
  .catch(async (e) => {
    console.error('Lỗi khi seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });