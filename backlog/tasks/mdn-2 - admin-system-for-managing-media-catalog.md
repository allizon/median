---
id: MDN-2
title: Admin system for managing media catalog
status: To Do
created: 2026-05-31
---

## Description

Build an admin interface for managing the shared media catalog. The current design allows any logged-in user to add and edit media items, but there is no way to delete items, merge duplicates, or perform bulk operations. An admin system would provide privileged access to these operations.

## Scope to define

- **Who is an admin?** A boolean `isAdmin` flag on User, or a separate role/permission model?
- **What operations does admin unlock?**
  - Delete a media item (and handle cascade — what happens to DiaryEntries and ListItems referencing it?)
  - Merge duplicate media items (combine references, pick canonical record)
  - Bulk edit metadata (e.g. fix a batch of bad `type` values)
  - View all users and their diary/list counts (read-only audit)
  - Promote/demote other admins
- **Where does the admin UI live?** Separate `/admin` route subtree, restricted by middleware.
- **Audit log?** Should admin actions be logged (who deleted what, when)?

## Context

- The PRD flags duplicate catalog entries as a known rough edge (deferred to Phase 3 with external enrichment). An admin delete/merge tool is a lower-tech interim solution.
- Deleting a media item has significant cascade implications: DiaryEntries and ListItems would need to be either deleted or soft-deleted. This needs a decision before implementation.
- Phase 3 (external catalog enrichment) may subsume or reshape the merge workflow — coordinate with that phase.

## Reference

- PRD section 5.2 (Media Catalog — deduplication note)
- PRD Phase 3 (External Catalog Enrichment)
