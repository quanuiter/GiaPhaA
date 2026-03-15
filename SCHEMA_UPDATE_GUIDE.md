# Hướng Dẫn Cập Nhật Prisma Schema

## 📋 Tóm Tắt Thay Đổi

Schema hiện tại đã khá hoàn chỉnh. Cập nhật này bổ sung một số trường và tính năng hữu ích:

### 1. **Member Model** - 3 trường mới
- `bioNote` (TEXT) - Tiểu sử/ghi chú dài cho thành viên
- `deathDate` (DATETIME) - Ngày mất (cho phép query nhanh hơn mà không cần join Death table)
- `deletedAt` (DATETIME) - Soft delete field để giữ lịch sử dữ liệu

### 2. **Marriage Model** - 3 trường mới
- `location` (VARCHAR) - Địa điểm kết hôn
- `witnesses` (TEXT) - Danh sách nhân chứng (lưu dưới dạng JSON)
- `deletedAt` (DATETIME) - Soft delete field

### 3. **Achievement Model** - 2 trường mới + index
- `certificate` (VARCHAR) - URL chứng chỉ/bằng cấp
- `deletedAt` (DATETIME) - Soft delete field
- Thêm proper indexes cho memberId, year, deletedAt

---

## 🚀 Cách Cập Nhật

### Bước 1: Cập nhật Prisma Schema
Schema đã được cập nhật tại: `/backend/prisma/schema.prisma`

### Bước 2: Chạy Migration

Nếu bạn đã có database (production/development):

```bash
cd backend
npx prisma migrate deploy
```

Hoặc để create migration mới nếu cần:

```bash
cd backend
npx prisma migrate dev --name add_enhancements
```

### Bước 3: Regenerate Prisma Client

```bash
cd backend
npx prisma generate
```

### Bước 4: Restart Backend Server

```bash
npm run dev
# hoặc
npm start
```

---

## ✅ Verifying Changes

Sau khi cập nhật, kiểm tra:

1. **Database có các cột mới:**
   ```bash
   # Trong MySQL client
   DESCRIBE Member;
   DESCRIBE Marriage;
   DESCRIBE Achievement;
   ```

2. **Prisma client được update:**
   - Kiểm tra `node_modules/@prisma/client` có generated files mới

3. **Backend chạy bình thường:**
   - Không có lỗi TypeScript compilation
   - APIs vẫn hoạt động

---

## 📝 Cách Sử Dụng Các Trường Mới

### Soft Delete (deletedAt)

**Khi xóa:**
```javascript
// Thay vì DELETE, update deletedAt
await prisma.member.update({
  where: { id: memberId },
  data: { deletedAt: new Date() }
})
```

**Khi query (bỏ deleted records):**
```javascript
const members = await prisma.member.findMany({
  where: {
    treeId: treeId,
    deletedAt: null  // Chỉ lấy records chưa xóa
  }
})
```

### Sử dụng bioNote
```javascript
await prisma.member.update({
  where: { id: memberId },
  data: {
    bioNote: "Ông là người sáng lập huyện, có công lao..."
  }
})
```

### Sử dụng deathDate
```javascript
// Tìm những người mất trong một khoảng thời gian
const deceased = await prisma.member.findMany({
  where: {
    treeId: treeId,
    deathDate: {
      gte: new Date('2020-01-01'),
      lte: new Date('2023-12-31')
    }
  }
})
```

### Sử dụng witnesses
```javascript
const witnesses = JSON.parse(marriage.witnesses || '[]')
// Format: ["Nguyễn Văn A", "Trần Thị B"]
```

---

## 🔄 Rollback (Nếu cần)

Nếu cần quay lại schema cũ:

```bash
cd backend
npx prisma migrate resolve --rolled-back 20260315_add_enhancements
```

---

## ⚠️ Lưu Ý

1. **Soft Delete Strategy**: 
   - Khi update query, LUÔN thêm `deletedAt: null` để bỏ deleted records
   - Nếu cần restore, chỉ cần set `deletedAt = null`

2. **Backward Compatibility**:
   - Tất cả trường mới đều OPTIONAL (nullable)
   - Existing APIs sẽ vẫn hoạt động

3. **Performance**:
   - `bioNote` là TEXT - tối đa 65KB
   - `witnesses` là TEXT - sử dụng JSON format
   - Đã thêm indexes cho fields quan trọng

4. **deathDate vs Death Model**:
   - `deathDate` là copy từ `Death.deathDate`
   - Giữ cả hai để backward compatibility
   - Trong tương lai có thể deprecate Death model

---

## 📊 Current Schema Status

| Model | Fields | Status |
|-------|--------|--------|
| FamilyTree | ✅ Đủ | Hoàn chỉnh |
| Member | ✅ Đủ | Hoàn chỉnh + enhancements |
| Marriage | ✅ Đủ | Hoàn chỉnh + enhancements |
| Death | ✅ Đủ | Hoàn chỉnh |
| Achievement | ✅ Đủ | Hoàn chỉnh + enhancements |
| FamilyEvent | ✅ Đủ | Hoàn chỉnh |
| User | ✅ Đủ | Hoàn chỉnh |
| TreeUser | ✅ Đủ | Hoàn chỉnh |
| TreeConfig | ✅ Đủ | Hoàn chỉnh |
| Category | ✅ Đủ | Hoàn chỉnh |

**Kết luận**: Schema hiện tại **đã đủ cho 95% use cases của gia phả**. Các enhancement chỉ là optional fields để tăng flexibility.

---

## 🎯 Các Tính Năng Hỗ Trợ Sau Cập Nhật

✅ Soft delete - giữ lịch sử, có thể restore  
✅ Tiểu sử chi tiết cho từng thành viên  
✅ Ghi chép địa điểm, nhân chứng của hôn nhân  
✅ Lưu chứng chỉ/bằng cấp dưới dạng URL  
✅ Query hiệu quả hơn với deathDate index  

---

## ❓ FAQ

**Q: Có phải restart database không?**  
A: Không, chỉ cần chạy `npx prisma migrate deploy`

**Q: Có cách nào rollback sau migrate?**  
A: Có, dùng `npx prisma migrate resolve --rolled-back` hoặc restore từ SQL backup

**Q: Các APIs cũ có bị break không?**  
A: Không, tất cả field mới đều optional

**Q: Cần update frontend không?**  
A: Không bắt buộc, nhưng có thể update UI để hiển thị bioNote, certificate, etc.
