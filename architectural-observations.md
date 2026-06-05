# Architectural Deepening Observations

**Date**: 2026-06-01  
**Context**: Median — Personal media diary and wishlist application

This document records architectural friction points identified during exploration. Each opportunity follows the improvement-codebase-architecture skill's deepening pattern: moving from shallow modules (interface nearly as complex as implementation) to deep modules (high leverage at a seam).

---

## Domain Vocabulary (from CONTEXT.md)

- **DiaryEntry**: User's personal record of consumption state (`in-progress`, `paused`, `abandoned`, `finished`)
- **ListItem**: Media item's position within a specific list; carries no consumption state
- **List**: Named, user-owned collection with visibility setting and collaborators; includes **Wishlist** (default personal List)
- **Media**: Catalog entry with title, type, year, creator; created explicitly by users
- **User**: Account holder; owns Lists, has DiaryEntries, casts votes

---

## Deepening Opportunities

### 1. List Management Actions Module

**File**: `src/lib/actions/list.ts`  
**Functions**: `getUserLists`, `addToWishlist`, `addToList`, `createListAndAdd`

**Problem Statement**:
- Module contains three related functions handling list-related mutations
- Tightly coupled with direct Prisma calls
- Shared concerns (authentication checks, validation patterns) are duplicated across functions
- Interface is shallow because implementation complexity follows directly

**Deepening Solution**:
- Extract a **ListService** adapter interface abstracting Prisma operations
- Consolidate shared logic into service-layer functions:
  - Validation schemas centralized
  - Auth check abstraction
  - Error handling patterns unified
- Create `useList` namespace with typed methods for list operations
- Separate read (`get*`) vs. write (`add*`, `create*`) operations at the seam

**Benefits**:
- **Locality**: All list business logic concentrated in one place
- **Leverage**: Callers need only know the `useList` interface
- **Tests**: Mock service layer independently from Prisma; easier to test edge cases

---

### 2. Media Operations Module

**File**: `src/lib/actions/media.ts`  
**Functions**: `checkMediaDuplicates`, `createMedia`

**Problem Statement**:
- Module mixes validation, duplicate checking, and data creation in a single function
- Interleaved concerns: duplicate check is a side-effect affecting flow
- `checkMediaDuplicates` lives at module level but is coupled to create path
- No reuse path for duplicate detection outside of creation

**Deepening Solution**:
- Extract **MediaService** interface separating:
  - Pure validation (`validateCreateMediaInput`)
  - Business logic (`checkDuplicateOrForce`)
  - Data creation (`createMediaRecord`)
- Move `checkMediaDuplicates` into service seam where it belongs logically
- Consider making duplicate check a separate action for optional invocation

**Benefits**:
- **Locality**: Duplicate detection and media creation become one coherent capability
- **Leverage**: Clean separation allows reusing validation across entry points (import, search)
- **Tests**: Unit-test duplicate detection independently; mock service layer easily

---

### 3. Profile List Management Actions Module

**File**: `src/app/(public)/profile/[username]/actions.ts`  
**Functions**: `updateFeaturedListsAction`

**Problem Statement**:
- Module performs bulk updates via `Promise.all()`
- Lacks explicit type safety for the operation
- Couples directly to Prisma without abstraction
- Future features (position validation, conflict handling) require editing in place

**Deepening Solution**:
- Create **ProfileListService** adapter interface with typed methods
- Extract bulk operations into dedicated methods with proper TypeScript types
- Add seam-level handlers for list membership changes (add/remove member from featured lists)

**Benefits**:
- **Locality**: All profile-list interaction logic in one place
- **Leverage**: Interface clearly states possible operations on user's lists
- **Tests**: Mock service layer; validate position constraints at interface level

---

### 4. Signup Flow Module

**File**: `src/app/signup/actions.ts`  
**Function**: `signupAction`

**Problem Statement**:
- Module handles user creation but tightly couples three concerns:
  - Validation
  - Existence check
  - Password hashing, list creation, and sign-in
- `redirect()` call hides real error handling flow
- Error state limited to form errors, not server-side failures during account creation

**Deepening Solution**:
- Extract **UserCreationService** interface separating:
  - Validation (`validateSignupInput`)
  - Duplicate detection (`checkUserConflict`)
  - Account provisioning (`createAccountAndDefaultWishlist`)
  - Session establishment (`establishUserSession`) — return status, no redirect
- Consolidate shared patterns with login module

**Benefits**:
- **Locality**: All account creation logic at a seam; sign-in failure becomes explicit return value
- **Leverage**: Can reuse account creation for password reset (deferred phase) or bulk import
- **Tests**: Isolate validation errors from database failures; test auth integration separately

---

## Common Pattern Across Opportunities

**Shallow State**: Functions call Prisma directly with mixed concerns (validation + DB + business logic).

**Deep State**: Introduce service-layer adapters at seams, separating interface from implementation.

This aligns with CONTEXT.md's domain language: Lists and Media are core domain concepts warranting deep, reusable modules.

---

## Glossary Alignment (CONTEXT.md)

| Term | Usage in Observations |
|------|----------------------|
| **List** | Refers to user-owned collection with visibility; includes Wishlist as default List |
| **Media** | Catalog entry with title, type, year, creator; explicitly created by users |
| **User** | Account holder owning Lists, having DiaryEntries, casting votes |

---

## Next Steps

For each opportunity, the deepening process involves:

1. **Grilling loop**: Walk design tree with user through constraints, dependencies, and shape of deepened module
2. **CONTEXT.md updates**: Add domain terms if new concepts emerge (e.g., "Service" or namespace names)
3. **ADR creation**: Record decisions in `docs/adr/` if candidate is deferred or rejected for architectural reasons

See [/Users/allison/.agents/skills/improve-codebase-architecture/SKILL.md](../improve-codebase-architecture/SKILL.md) for full process and grilling loop instructions.
