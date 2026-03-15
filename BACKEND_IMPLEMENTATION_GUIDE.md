# Backend Implementation Guide - Schema Updates

## 🎯 Overview

New schema fields require **minor API updates** to ensure soft delete strategy is enforced across all queries.

---

## 1. Soft Delete Strategy

### Principle
- Instead of `DELETE`, update `deletedAt = NOW()`
- Always filter `WHERE deletedAt IS NULL` in queries
- Allow restore by setting `deletedAt = NULL`

### Implementation Pattern

**BEFORE (Hard Delete):**
```javascript
await prisma.member.delete({
  where: { id: memberId }
})
```

**AFTER (Soft Delete):**
```javascript
await prisma.member.update({
  where: { id: memberId },
  data: { deletedAt: new Date() }
})
```

---

## 2. Query Pattern Updates

### All SELECT queries should filter deleted records

**PATTERN:**
```javascript
// ✅ CORRECT - Filter soft-deleted records
const members = await prisma.member.findMany({
  where: {
    treeId: treeId,
    deletedAt: null  // <- IMPORTANT
  }
})

// ❌ WRONG - Returns deleted records too
const members = await prisma.member.findMany({
  where: { treeId: treeId }
})
```

### Files to Update

**Member APIs** (`backend/src/routes/members.ts` or similar):

```typescript
// GET /api/trees/:treeId/members
export async function getMembers(treeId: number) {
  return prisma.member.findMany({
    where: {
      treeId,
      deletedAt: null  // <- Add this
    }
  })
}

// DELETE /api/members/:id
export async function deleteMember(memberId: number) {
  return prisma.member.update({
    where: { id: memberId },
    data: { deletedAt: new Date() }  // <- Change to soft delete
  })
}

// RESTORE /api/members/:id/restore
export async function restoreMember(memberId: number) {
  return prisma.member.update({
    where: { id: memberId },
    data: { deletedAt: null }
  })
}
```

**Marriage APIs:**

```typescript
export async function getMarriages(treeId: number) {
  return prisma.marriage.findMany({
    where: {
      treeId,
      deletedAt: null  // <- Add this
    }
  })
}

export async function deleteMarriage(marriageId: number) {
  return prisma.marriage.update({
    where: { id: marriageId },
    data: { deletedAt: new Date() }
  })
}
```

**Achievement APIs:**

```typescript
export async function getAchievements(memberId: number) {
  return prisma.achievement.findMany({
    where: {
      memberId,
      deletedAt: null  // <- Add this
    }
  })
}

export async function deleteAchievement(achievementId: number) {
  return prisma.achievement.update({
    where: { id: achievementId },
    data: { deletedAt: new Date() }
  })
}
```

---

## 3. New Field Usage

### bioNote - Extended Biography

**Update Member:**
```javascript
await prisma.member.update({
  where: { id: memberId },
  data: {
    bioNote: "Ông Nguyễn Văn A sinh năm 1950, là người sáng lập xã...\n\nCó công lao..."
  }
})
```

**Query:**
```javascript
const member = await prisma.member.findUnique({
  where: { id: memberId },
  select: {
    id: true,
    fullName: true,
    bioNote: true
  }
})
```

### deathDate - Quick Death Info Access

**When recording death:**
```javascript
// Option 1: Use deathDate (faster queries)
await prisma.member.update({
  where: { id: memberId },
  data: {
    isDeceased: true,
    deathDate: new Date(deathInfo.deathDate)
  }
})

// Option 2: Or keep using Death model (detailed info)
await prisma.death.create({
  data: {
    memberId,
    deathDate: new Date(deathInfo.deathDate),
    cause: deathInfo.cause,
    burialPlace: deathInfo.burialPlace,
    longevity: deathInfo.longevity,
    note: deathInfo.note
  }
})

// Both can coexist - deathDate is just a cache
```

**Query members by death date:**
```javascript
const deceased2023 = await prisma.member.findMany({
  where: {
    treeId,
    deathDate: {
      gte: new Date('2023-01-01'),
      lte: new Date('2023-12-31')
    },
    deletedAt: null
  }
})
```

### Marriage Enhancements

**Create marriage with witnesses:**
```javascript
const witnesses = ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C"]

await prisma.marriage.create({
  data: {
    husbandId,
    wifeId,
    marriageDate: new Date('2000-01-15'),
    location: "Chùa Bà Đanh, Huế",
    witnesses: JSON.stringify(witnesses),  // <- Store as JSON string
    status: "living",
    note: "Lễ cưới tại nhà thờ..."
  }
})
```

**Query and parse witnesses:**
```javascript
const marriage = await prisma.marriage.findUnique({
  where: { id: marriageId }
})

const witnesses = JSON.parse(marriage.witnesses || '[]')
console.log(witnesses)  // ["Nguyễn Văn A", "Trần Thị B", "Lê Văn C"]
```

### Achievement with Certificate

**Create achievement:**
```javascript
await prisma.achievement.create({
  data: {
    memberId,
    type: "education",
    level: "national",
    year: 2010,
    description: "Tốt nghiệp Đại học Kinh Tế",
    issuedBy: "Trường Đại học Kinh Tế Tp.HCM",
    certificate: "https://example.com/certs/abc123.pdf"
  }
})
```

---

## 4. Database Constraints & Indexes

### Indexes Added (for performance)

```sql
-- Member
CREATE INDEX idx_Member_deletedAt ON Member(deletedAt);
CREATE INDEX idx_Member_deathDate ON Member(deathDate);

-- Marriage
CREATE INDEX idx_Marriage_deletedAt ON Marriage(deletedAt);
CREATE INDEX idx_Marriage_husbandId ON Marriage(husbandId);
CREATE INDEX idx_Marriage_wifeId ON Marriage(wifeId);

-- Achievement
CREATE INDEX idx_Achievement_deletedAt ON Achievement(deletedAt);
CREATE INDEX idx_Achievement_year ON Achievement(year);
CREATE INDEX idx_Achievement_memberId ON Achievement(memberId);
```

These are **automatically created** by the migration.

---

## 5. Audit Trail with Soft Delete

### Track deletions in AuditLog

```typescript
export async function deleteMemberWithAudit(
  memberId: number, 
  userId: number
) {
  const member = await prisma.member.findUnique({
    where: { id: memberId }
  })

  // Soft delete
  await prisma.member.update({
    where: { id: memberId },
    data: { deletedAt: new Date() }
  })

  // Log the deletion
  await prisma.auditLog.create({
    data: {
      treeId: member.treeId,
      userId,
      memberId,
      action: "DELETE",
      tableName: "Member",
      recordId: memberId,
      note: `Deleted member: ${member.fullName}`
    }
  })
}
```

---

## 6. API Response Format

### Include deletedAt in responses?

**Option A: Never show deletedAt to frontend** (Recommended)
```javascript
const member = await prisma.member.findMany({
  where: { treeId, deletedAt: null },
  select: {
    id: true,
    fullName: true,
    gender: true,
    // ... other fields
    // deletedAt: false (don't include)
  }
})
```

**Option B: Include for admin view**
```javascript
const member = await prisma.member.findMany({
  where: { 
    treeId,
    deletedAt: isAdmin ? undefined : null  // Show deleted if admin
  },
  select: {
    id: true,
    fullName: true,
    deletedAt: isAdmin  // Include for admin
  }
})
```

---

## 7. Testing Soft Delete Logic

### Unit Tests

```typescript
describe('Member Soft Delete', () => {
  it('should soft delete a member', async () => {
    const member = await prisma.member.create({
      data: { ... }
    })
    
    await deleteMember(member.id)
    
    const deleted = await prisma.member.findUnique({
      where: { id: member.id }
    })
    
    expect(deleted.deletedAt).not.toBeNull()
  })

  it('should not return deleted members in query', async () => {
    // Create member
    const member = await prisma.member.create({ ... })
    
    // Delete it
    await deleteMember(member.id)
    
    // Query should not return it
    const members = await prisma.member.findMany({
      where: { treeId, deletedAt: null }
    })
    
    expect(members).not.toContainEqual(member)
  })

  it('should restore a deleted member', async () => {
    const member = await prisma.member.create({ ... })
    await deleteMember(member.id)
    await restoreMember(member.id)
    
    const restored = await prisma.member.findUnique({
      where: { id: member.id }
    })
    
    expect(restored.deletedAt).toBeNull()
  })
})
```

---

## 8. Migration Execution

### Step-by-step

```bash
# 1. Check migration status
npx prisma migrate status

# 2. Apply migrations
npx prisma migrate deploy

# 3. Regenerate Prisma Client
npx prisma generate

# 4. Verify schema
npx prisma db pull  # Check against actual database

# 5. Restart backend
npm run dev
```

### Troubleshooting

**Error: Foreign key constraint fails**
- Ensure migrations run in correct order
- Check if records reference deleted records

**Error: Column already exists**
- Someone else already ran the migration
- Just run `npx prisma generate` to sync client

---

## 9. Checklist for Implementation

- [ ] Update all Member queries with `deletedAt: null`
- [ ] Update all Marriage queries with `deletedAt: null`
- [ ] Update all Achievement queries with `deletedAt: null`
- [ ] Change `delete()` calls to soft `update()`
- [ ] Add restore endpoints (optional but recommended)
- [ ] Add audit logging to delete operations
- [ ] Update response DTOs if needed
- [ ] Add unit tests for soft delete
- [ ] Test marriage witnesses JSON parsing
- [ ] Test achievement certificate URL handling
- [ ] Run migration on development database
- [ ] Run migration on staging database
- [ ] Verify all tests pass
- [ ] Deploy to production

---

## 10. Future Enhancements

### Optional: Add Utility Functions

```typescript
// utils/queryHelpers.ts

export const ACTIVE_FILTER = {
  deletedAt: null
} as const

// Usage
const members = await prisma.member.findMany({
  where: {
    treeId,
    ...ACTIVE_FILTER
  }
})
```

### Optional: Add Middleware

```typescript
// middleware/softDeleteFilter.ts
// Auto-apply deletedAt filter to all queries
```

---

**Implementation Priority**: HIGH  
**Estimated Time**: 2-4 hours  
**Breaking Changes**: None (backward compatible)

