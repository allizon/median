---
id: MDN-36
title: Schema migration — ListItemScore and ListMember invite status
status: To Do
assignee: []
created_date: '2026-06-06'
updated_date: '2026-06-06'
labels:
  - schema
  - collaborative-lists
dependencies: []
ordinal: 45000
---

## Description

Two schema changes needed before any collaborative list or enthusiasm score features can be built. Neither change breaks existing functionality, but both are prerequisites for MDN-29, MDN-32, MDN-15, and MDN-35.

## Change 1: Replace `ListVote` with `ListItemScore`

The current `ListVote` model is a boolean join table — it records only that a user voted on an item, not how enthusiastically. Replace it with `ListItemScore`, which stores a 0–4 enthusiasm score per user per list item.

**New model:**
```prisma
model ListItemScore {
  listItemId String
  userId     String
  score      Int      // 0–4
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  listItem ListItem @relation(fields: [listItemId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([listItemId, userId])
}
```

- Absence of a row = item not yet scored by that user
- Score of 0 on a collaborative list = intent to remove (enforced at app layer, not DB layer)
- Score range (0–4) enforced at app layer via Zod validation

**Migration:** Drop `ListVote` table, create `ListItemScore` table. No data to migrate (votes are not meaningful to carry forward as scores).

## Change 2: Add invite status to `ListMember`

The current `ListMember` model only records `joinedAt` — there is no concept of a pending invite. Add a `status` field to support the invite flow (MDN-15, MDN-35).

**Updated model:**
```prisma
enum ListMemberStatus {
  pending
  accepted
}

model ListMember {
  listId    String
  userId    String
  status    ListMemberStatus @default(pending)
  joinedAt  DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  list List @relation(fields: [listId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([listId, userId])
}
```

**Migration:** Add `status` column with default `accepted` so all existing `ListMember` rows are backfilled correctly (existing members are already in, not pending).

## Acceptance criteria

- [ ] `ListVote` model and table removed from schema and database
- [ ] `ListItemScore` model created with `listItemId`, `userId`, `score` (Int), `createdAt`, `updatedAt`
- [ ] `ListItem` relation updated to reference `ListItemScore` instead of `ListVote`
- [ ] `User` relation updated to reference `ListItemScore` instead of `ListVote`
- [ ] `ListMemberStatus` enum added (`pending`, `accepted`)
- [ ] `ListMember.status` field added, defaulting to `pending` in schema
- [ ] Migration backfills all existing `ListMember` rows to `accepted`
- [ ] Prisma client regenerated, TypeScript compiles cleanly
- [ ] Existing list functionality (add to list, wishlist, list display) unaffected

## Reference

- MDN-32 (implementation plan — Step 1)
- MDN-29 (personal list implementation — needs `ListItemScore`)
- MDN-15 (invite flow — needs `ListMember.status`)
- MDN-35 (shareable invite link — needs `ListMember.status`)
