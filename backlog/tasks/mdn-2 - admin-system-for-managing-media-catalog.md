---
id: MDN-2
title: Admin system for managing media catalog
status: To Do
assignee: []
created_date: ''
updated_date: '2026-05-31 17:28'
labels: []
dependencies: []
ordinal: 22000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
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
<!-- SECTION:DESCRIPTION:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Completed Task 2: Install Tailwind v4 and apply AstroVista theme

All steps executed successfully:

1. Installed Tailwind v4 packages
   - tailwindcss 4.3.0
   - @tailwindcss/postcss 4.3.0
   - postcss 8.5.15

2. Created PostCSS configuration file (postcss.config.mjs) with @tailwindcss/postcss plugin

3. Replaced globals.css with AstroVista theme
   - Imported Tailwind CSS
   - Added custom variant for dark mode
   - Configured root CSS variables with oklch color values for light theme
   - Configured .dark class CSS variables for dark theme
   - Added @theme inline block with color palette and design tokens
   - Added base layer styles for borders, outlines, and body

4. Verified dev server starts without CSS errors
   - Server started successfully in 224ms
   - GET / responded with 200 status
   - No CSS compilation errors

5. Committed all changes to git
   - Commit: 9913f23
   - Message: "feat: install Tailwind v4 with AstroVista theme tokens"
   - Modified files: postcss.config.mjs, src/app/globals.css, package.json, pnpm-lock.yaml
<!-- SECTION:FINAL_SUMMARY:END -->
