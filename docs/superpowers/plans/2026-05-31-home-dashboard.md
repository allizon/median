# Home Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder home page with a real dashboard (dual CTA, My Lists, Up Next), add a persistent nav bar to all pages, and restructure routes into `(app)` / `(public)` groups.

**Architecture:** Two Next.js route groups — `(app)` for protected pages (auth redirect in layout) and `(public)` for pages with optional auth. A shared `Nav` server component is rendered by both layouts. The home dashboard is a single server component that fetches lists and wishlist items in parallel.

**Tech Stack:** Next.js 15 app router, Prisma, Auth.js v5, Tailwind CSS

**Design spec:** `docs/superpowers/specs/2026-05-31-home-dashboard-design.md`

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `prisma/schema.prisma` | Add `updatedAt` to `List` model |
| Create | `src/components/nav.tsx` | Persistent nav bar (Median / Search / @username) |
| Create | `src/app/(app)/layout.tsx` | Auth check + nav for protected pages |
| Create | `src/app/(app)/page.tsx` | Home dashboard |
| Create | `src/app/(public)/layout.tsx` | Nav (no auth redirect) for public pages |
| Move | `src/app/search/` → `src/app/(public)/search/` | No change to URL |
| Move | `src/app/media/` → `src/app/(public)/media/` | No change to URL |
| Move | `src/app/profile/` → `src/app/(public)/profile/` | No change to URL |
| Move | `src/app/settings/` → `src/app/(app)/settings/` | No change to URL |
| Delete | `src/app/page.tsx` | Replaced by `(app)/page.tsx` |

---

## Task 1: Add `updatedAt` to the List model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `updatedAt` to the List model**

In `prisma/schema.prisma`, find the `List` model (around line 158) and add `updatedAt` after `createdAt`:

```prisma
model List {
  id                String         @id @default(cuid())
  ownerId           String
  name              String
  visibility        ListVisibility @default(private)
  isDefaultWishlist Boolean        @default(false)
  featuredOnProfile Boolean        @default(false)
  profilePosition   Int?
  createdAt         DateTime       @default(now())
  updatedAt         DateTime       @updatedAt

  owner   User         @relation("ListOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members ListMember[]
  items   ListItem[]
}
```

- [ ] **Step 2: Run the migration**

```bash
npx prisma migrate dev --name add-list-updated-at
```

Expected output ends with: `Your database is now in sync with your schema.`

If using `db push` instead of migrations:
```bash
npx prisma db push
```

- [ ] **Step 3: Regenerate the Prisma client**

```bash
npx prisma generate
```

Expected: `Generated Prisma Client`

- [ ] **Step 4: Verify the app still builds**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add updatedAt to List model"
```

---

## Task 2: Create the Nav component

**Files:**
- Create: `src/components/nav.tsx`

- [ ] **Step 1: Create the nav component**

Create `src/components/nav.tsx`:

```tsx
import Link from "next/link";

interface NavProps {
  username?: string | null;
}

export function Nav({ username }: NavProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto max-w-4xl px-4 h-12 flex items-center justify-between">
        <Link href="/" className="font-semibold text-sm tracking-tight">
          Median
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link
            href="/search"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Search
          </Link>
          {username ? (
            <Link
              href={`/profile/${username}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              @{username}
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Verify TypeScript is happy**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/nav.tsx
git commit -m "feat: add Nav component"
```

---

## Task 3: Create the `(app)` route group layout

This layout protects all pages under `(app)/` — unauthenticated users are redirected to `/login`. It fetches the username from the database (the JWT session only carries `id`) and renders the Nav.

**Files:**
- Create: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Create the directory and layout**

```bash
mkdir -p src/app/\(app\)
```

Create `src/app/(app)/layout.tsx`:

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true },
  });

  return (
    <>
      <Nav username={user?.username} />
      {children}
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/layout.tsx"
git commit -m "feat: add (app) route group with auth redirect and nav"
```

---

## Task 4: Create the `(public)` route group layout

Pages here are publicly accessible but still show the nav bar. The nav shows "@username" when logged in, "Sign in" when not.

**Files:**
- Create: `src/app/(public)/layout.tsx`

- [ ] **Step 1: Create the directory and layout**

```bash
mkdir -p src/app/\(public\)
```

Create `src/app/(public)/layout.tsx`:

```tsx
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  let username: string | null = null;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true },
    });
    username = user?.username ?? null;
  }

  return (
    <>
      <Nav username={username} />
      {children}
    </>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(public)/layout.tsx"
git commit -m "feat: add (public) route group layout with optional-auth nav"
```

---

## Task 5: Move existing pages into route groups

URLs do not change — route groups are transparent in Next.js app router.

**Files:**
- Move: `src/app/search/` → `src/app/(public)/search/`
- Move: `src/app/media/` → `src/app/(public)/media/`
- Move: `src/app/profile/` → `src/app/(public)/profile/`
- Move: `src/app/settings/` → `src/app/(app)/settings/`
- Delete: `src/app/page.tsx`

- [ ] **Step 1: Move public pages**

```bash
mv src/app/search "src/app/(public)/search"
mv src/app/media "src/app/(public)/media"
mv src/app/profile "src/app/(public)/profile"
```

- [ ] **Step 2: Move settings into the protected group**

```bash
mv src/app/settings "src/app/(app)/settings"
```

- [ ] **Step 3: Delete the old placeholder home page**

```bash
rm src/app/page.tsx
```

- [ ] **Step 4: Verify the build**

```bash
npx tsc --noEmit
```

Expected: no errors. If you see import errors, check that internal imports within moved files (e.g. relative imports in `profile/[username]/actions.ts`) are still correct — they should be since you moved whole directories.

- [ ] **Step 5: Start the dev server and manually verify routes**

```bash
pnpm dev
```

Visit each of these and confirm they load with a nav bar:
- `http://localhost:3000/search` — should show search page with nav
- `http://localhost:3000/media/<any-id>` — should show media page with nav (or 404 if no ID)
- `http://localhost:3000/profile/<any-username>` — should show profile page with nav
- `http://localhost:3000/settings` — should redirect to `/login` if not logged in
- `http://localhost:3000/login` — should show login page with no nav
- `http://localhost:3000/signup` — should show signup page with no nav

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: reorganise pages into (app) and (public) route groups"
```

---

## Task 6: Build the home dashboard

**Files:**
- Create: `src/app/(app)/page.tsx`

- [ ] **Step 1: Create the home dashboard page**

Create `src/app/(app)/page.tsx`:

```tsx
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TYPE_LABELS: Record<string, string> = {
  movie: "Movie",
  tv_show: "TV Show",
  book: "Book",
};

const VISIBILITY_LABELS: Record<string, string> = {
  private: "Private",
  friends: "Friends",
  public: "Public",
};

export default async function HomePage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const [lists, wishlistItems] = await Promise.all([
    prisma.list.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      orderBy: [{ isDefaultWishlist: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        visibility: true,
        isDefaultWishlist: true,
        _count: { select: { items: true, members: true } },
      },
    }),
    prisma.listItem.findMany({
      where: { list: { ownerId: userId, isDefaultWishlist: true } },
      orderBy: { addedAt: "asc" },
      take: 5,
      select: {
        media: { select: { id: true, title: true, type: true } },
      },
    }),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Dual CTA */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/search"
          className={cn(buttonVariants({ variant: "default", size: "lg" }), "w-full justify-center")}
        >
          + Add to Wishlist
        </Link>
        <Link
          href="/search"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full justify-center")}
        >
          ✎ Log something
        </Link>
      </div>

      {/* Widget grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* My Lists */}
        <section className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            My Lists
          </h2>
          <ul className="space-y-0.5">
            {lists.map((list) => (
              <li key={list.id}>
                <Link
                  href={`/lists/${list.id}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition-colors gap-2"
                >
                  <span className="truncate">{list.name}</span>
                  <div className="flex items-center gap-2 shrink-0 text-muted-foreground">
                    {list._count.members > 0 && (
                      // _count.members counts ListMember rows (non-owner members); +1 for the owner
                      <span className="text-xs">{list._count.members + 1} members</span>
                    )}
                    <span>{list._count.items}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Up Next */}
        <section className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Up Next
          </h2>
          {wishlistItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing in your Wishlist yet.{" "}
              <Link
                href="/search"
                className="text-primary underline-offset-4 hover:underline"
              >
                Search to add something →
              </Link>
            </p>
          ) : (
            <ul className="space-y-0.5">
              {wishlistItems.map(({ media }) => (
                <li key={media.id}>
                  <Link
                    href={`/media/${media.id}`}
                    className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition-colors gap-2"
                  >
                    <span className="truncate">{media.title}</span>
                    <span className="text-muted-foreground shrink-0 text-xs">
                      {TYPE_LABELS[media.type] ?? media.type}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Start the dev server and manually verify the dashboard**

```bash
pnpm dev
```

While logged in, visit `http://localhost:3000` and confirm:
- Nav bar appears with "Median", "Search", and "@yourusername"
- Two CTA buttons side by side: "+ Add to Wishlist" and "✎ Log something" — both link to `/search`
- My Lists widget shows your lists (at minimum the Wishlist)
- Up Next widget shows wishlist items, or the empty state if the wishlist is empty
- Clicking a list card navigates to `/lists/<id>` (will 404 — that page isn't built yet, that's expected)
- Clicking a media item navigates to `/media/<id>`

While logged out, visit `http://localhost:3000` and confirm you are redirected to `/login`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/page.tsx"
git commit -m "feat: home dashboard with dual CTA, My Lists, and Up Next widgets"
```
