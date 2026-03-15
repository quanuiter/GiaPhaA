# Hướng Dẫn Cập Nhật Prisma Schema

## Những Thay Đổi Được Thêm

### 1. **bioNote** (Member model)
- Loại: `String? @db.Text`
- Mục đích: Lưu trữ ghi chú tiểu sử dài hơn so với `occupation`
- Ví dụ: "Là một nông dân thành đạo, đã giúp xây dựng nhà thờ vào năm 1950..."

### 2. **familyRole** (Member model)
- Loại: `String? @db.VarChar(50)`
- Mục đích: Xác định vị trí của người trong gia đình
- Các giá trị: `"patriarch"`, `"matriarch"`, `"branch_head"`, `"elder"`, hoặc `null`
- Ví dụ: Đặt tổ chức trưởng gia tộc là "patriarch"

### 3. **RelationshipHistory** (Mô hình mới)
- Theo dõi lịch sử thay đổi trạng thái hôn nhân
- Bao gồm:
  - `marriageId`: Hôn nhân nào
  - `memberId`: Ai ghi nhận thay đổi này
  - `oldStatus`: Trạng thái cũ (VD: "living")
  - `newStatus`: Trạng thái mới (VD: "divorced")
  - `changeDate`: Ngày thay đổi
  - `note`: Ghi chú thêm

---

## Các Bước Cập Nhật

### Bước 1: Cập Nhật Code
```bash
# Pull hoặc merge các thay đổi từ repository
git pull origin main

# Hoặc nếu bạn đã clone v0 project:
# - File schema đã được cập nhật tại:
#   backend/prisma/schema.prisma
```

### Bước 2: Tạo Migration
```bash
cd backend

# Chạy lệnh tạo migration (Prisma sẽ so sánh schema.prisma với database)
npx prisma migrate dev --name add_enhancements
```

**Hoặc nếu muốn review SQL trước khi apply:**
```bash
# Tạo migration draft
npx prisma migrate dev --create-only --name add_enhancements

# Rồi manual chạy file SQL từ:
# backend/prisma/migrations/add_enhancements/migration.sql
```

### Bước 3: Cập Nhật Prisma Client
```bash
cd backend

# Prisma client sẽ tự động cập nhật sau khi migration thành công
# Nhưng nếu cần force update:
npx prisma generate
```

### Bước 4: Kiểm Tra Kết Quả
```bash
# Xem database schema đã được cập nhật
npx prisma db push

# Hoặc check trong database client (MySQL Workbench, DBeaver, etc.)
# Kiểm tra:
# - Member table có thêm bioNote, familyRole columns
# - RelationshipHistory table được tạo thành công
```

---

## Cách Sử Dụng Các Field Mới

### Ví Dụ 1: Thêm bioNote cho thành viên
```javascript
// API Backend
app.post('/api/members/:id', async (req, res) => {
  const { bioNote, familyRole } = req.body;
  
  const updated = await prisma.member.update({
    where: { id: parseInt(req.params.id) },
    data: {
      bioNote: bioNote || null,
      familyRole: familyRole || null,
    }
  });
  
  res.json(updated);
});
```

### Ví Dụ 2: Ghi nhận thay đổi hôn nhân
```javascript
// Khi thay đổi trạng thái hôn nhân
const updateMarriage = async (marriageId, newStatus, userId, note) => {
  // Lấy trạng thái cũ
  const marriage = await prisma.marriage.findUnique({
    where: { id: marriageId }
  });
  
  // Cập nhật hôn nhân
  await prisma.marriage.update({
    where: { id: marriageId },
    data: { status: newStatus }
  });
  
  // Ghi nhận lịch sử
  await prisma.relationshipHistory.create({
    data: {
      marriageId: marriageId,
      memberId: userId,
      oldStatus: marriage.status,
      newStatus: newStatus,
      changeDate: new Date(),
      note: note
    }
  });
};
```

### Ví Dụ 3: Lấy lịch sử hôn nhân
```javascript
// API lấy lịch sử thay đổi
app.get('/api/marriages/:id/history', async (req, res) => {
  const history = await prisma.relationshipHistory.findMany({
    where: { marriageId: parseInt(req.params.id) },
    include: {
      member: { select: { fullName: true } }
    },
    orderBy: { changeDate: 'desc' }
  });
  
  res.json(history);
});
```

### Ví Dụ 4: Query thành viên theo familyRole
```javascript
// Lấy tổng chỉ huy gia tộc
const patriarch = await prisma.member.findFirst({
  where: {
    treeId: treeId,
    familyRole: 'patriarch'
  }
});

// Lấy tất cả branch heads
const branchHeads = await prisma.member.findMany({
  where: {
    treeId: treeId,
    familyRole: 'branch_head'
  }
});
```

---

## Nếu Có Lỗi

### Lỗi: "Column not found"
→ Migration chưa được apply thành công. Kiểm tra:
```bash
npx prisma migrate status
```

### Lỗi: "Foreign key constraint fails"
→ Đảm bảo tất cả migrations đã được apply:
```bash
npx prisma migrate resolve --applied add_enhancements
```

### Lỗi: "Model not synced"
→ Generate lại Prisma client:
```bash
npx prisma generate
```

---

## Tóm Tắt

| Field/Model | Loại | Mục Đích |
|-------------|------|---------|
| `bioNote` | Member | Ghi chú tiểu sử dài |
| `familyRole` | Member | Vị trí gia tộc (patriarch, branch_head, etc.) |
| `RelationshipHistory` | Model | Theo dõi lịch sử thay đổi hôn nhân |

Tất cả các field này đều **optional** (`?`) nên không ảnh hưởng đến dữ liệu cũ. Hệ thống vẫn hoạt động bình thường ngay cả khi chưa điền các field này.
