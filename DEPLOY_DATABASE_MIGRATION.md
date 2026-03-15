# Database Migration Guide - Add Member Fields

## Problem Fixed
- EditMemberModal now properly loads existing member data
- Added two new fields: **Tiểu sử / Ghi chú (bio)** and **Địa chỉ hiện tại (address)**
- Form now fully functional with all fields loading and saving correctly

## What Changed

### 1. Schema Updates (Prisma)
**File:** `/backend/prisma/schema.prisma`

Added two new fields to the `Member` model:
```prisma
address    String?    @db.VarChar(255)  // Địa chỉ hiện tại
bio        String?    @db.Text          // Tiểu sử / ghi chú dài
```

Also added:
- `deathDate` - Quick lookup of death date (mirrors Death.deathDate)
- `deletedAt` - Soft delete support for audit trail

### 2. Database Migration
**File:** `/backend/prisma/migrations/20260315_add_enhancements/migration.sql`

SQL commands to add columns to the `Member` table in your database.

### 3. Frontend (Already Complete)
**File:** `/frontend/src/components/tree/modals/EditMemberModal.jsx`

- Already has `address` and `bio` in form state
- useEffect properly initializes these fields from member object
- Textarea component for bio field already imported and used
- Form sends these fields to backend

---

## Deployment Steps

### Step 1: Stop Running Services
```bash
# Terminal 1 - Stop frontend
cd frontend
Ctrl+C

# Terminal 2 - Stop backend
cd backend
Ctrl+C
```

### Step 2: Run Database Migration
```bash
cd backend
npx prisma migrate deploy
```

**Expected output:**
```
✔ Your database is now in sync with your schema.

 ✔ Generated Prisma Client (v5.x.x) to ./node_modules/@prisma/client
```

If migration already applied, you'll see:
```
Already applied migrations up to 20260315_add_enhancements
```

### Step 3: Generate Prisma Client
```bash
cd backend
npx prisma generate
```

### Step 4: Restart Backend
```bash
cd backend
npm run dev
# or
npm start
```

### Step 5: Restart Frontend (No changes needed, but refresh for safety)
```bash
cd frontend
npm start
```

### Step 6: Test in Browser
1. Navigate to member edit form
2. Verify old data loads:
   - Name ✓
   - Birth date ✓
   - Occupation ✓
   - Hometown ✓
   - Address ✓ (NEW)
   - Bio ✓ (NEW)
3. Edit a member's address and bio
4. Click "Cập nhật" (Update)
5. Refresh and verify data persists

---

## Troubleshooting

### Migration Fails: "Column already exists"
**Cause:** Migration already applied
**Solution:** Check database manually:
```bash
# In MySQL/MariaDB client
SHOW COLUMNS FROM Member;
```
Should show `address` and `bio` columns.

### Fields Still Empty After Update
**Cause:** Backend cache issue
**Solution:** 
1. Clear browser cache (Cmd/Ctrl + Shift + Delete)
2. Restart backend: `npm run dev`
3. Refresh page

### Cannot connect to database
**Check:**
```bash
# Terminal
cd backend
npx prisma db push --force-reset  # WARNING: Only for development!
```

### Rollback (If Needed)
```bash
# Remove the migration
cd backend
npx prisma migrate resolve --rolled-back 20260315_add_enhancements

# Then re-run
npx prisma migrate deploy
```

---

## Verification Checklist
- [ ] Migration ran successfully
- [ ] `npm run dev` starts without errors
- [ ] Member edit form loads existing data
- [ ] Can edit address field
- [ ] Can edit bio field
- [ ] Changes save to database
- [ ] Data persists on page refresh

---

## Field Specifications

### bio (Tiểu sử / Ghi chú)
- **Type:** LONGTEXT (unlimited)
- **Use:** Long biographical information, family history, memorable events
- **Frontend:** Textarea with 3 rows, can expand
- **Placeholder:** "Ghi chú về cuộc đời, đóng góp, kỷ niệm..."

### address (Địa chỉ hiện tại)
- **Type:** VARCHAR(255)
- **Use:** Current residence address
- **Frontend:** Single-line text input
- **Placeholder:** "Số nhà, đường, quận..."

---

## API Impact
No changes needed to API routes. The backend automatically includes these fields in:
- `GET /api/trees/:treeId/members` - List all members
- `GET /api/trees/:treeId/members/:id` - Get single member
- `PUT /api/trees/:treeId/members/:id` - Update member
- `POST /api/trees/:treeId/members` - Create member

---

## Timeline
- **Deployment time:** 2-5 minutes
- **Database size increase:** Negligible (text columns)
- **No downtime required:** Can apply during operating hours
- **Backward compatible:** ✓ Old data still works

---

## Next Steps
1. Run migration now
2. Test in development
3. Deploy to production when ready
4. Monitor for any issues

If issues occur, check `/backend/prisma/migrations/` for the exact SQL applied.
