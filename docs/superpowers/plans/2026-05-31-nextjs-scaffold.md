# Next.js App Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Median Next.js application with Tailwind v4, shadcn/ui (AstroVista theme), dark mode, Prisma schema, and Auth.js v5 — no database credentials yet, but everything else ready to run locally.

**Architecture:** Full-stack TypeScript/Next.js App Router at the repo root with a `src/` directory. Prisma runs server-side only; Auth.js v5 uses the Prisma adapter for database-backed sessions. Client-side providers (ThemeProvider, SessionProvider) are isolated in a single `src/components/providers.tsx` wrapper.

**Tech Stack:** Next.js 15 (App Router), TypeScript, pnpm, Tailwind v4, shadcn/ui, next-themes, Auth.js v5 (`next-auth@beta`), `@auth/prisma-adapter`, Prisma, Postgres (Neon — credentials added later)

---

## File Map

| File | Purpose |
|---|---|
| `package.json` | Created by `create-next-app` |
| `src/app/globals.css` | AstroVista theme tokens + Tailwind v4 imports |
| `src/app/layout.tsx` | Root layout — fonts, Providers wrapper |
| `src/app/page.tsx` | Placeholder home page |
| `src/components/providers.tsx` | Client component — ThemeProvider + SessionProvider |
| `src/components/theme-toggle.tsx` | Dark/light mode toggle button |
| `src/lib/prisma.ts` | Prisma client singleton |
| `src/auth.ts` | Auth.js v5 config — credentials provider, Prisma adapter |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth.js route handler |
| `src/middleware.ts` | Auth.js middleware — protects authenticated routes |
| `prisma/schema.prisma` | Full Median data model + Auth.js required models |
| `.env.example` | All required env vars with descriptions, no real values |
| `.env.local` | Real local values — gitignored (not committed) |
| `postcss.config.mjs` | Tailwind v4 PostCSS plugin |
| `next.config.ts` | Created by `create-next-app`, minimal changes |
| `.gitignore` | Ensure `.env.local` is present |

---

## Task 1: Initialize Next.js app

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `eslint.config.mjs`, `pnpm-lock.yaml`

- [ ] **Step 1: Run create-next-app**

From the repo root (`/Users/allison/github/median`):

```bash
pnpm create next-app@latest . --typescript --eslint --app --src-dir --import-alias "@/*" --use-pnpm --no-tailwind --turbopack
```

When prompted about existing files (e.g. `README.md`), choose to keep your existing version. Answer **No** to Tailwind (we install v4 manually in Task 2). Answer **Yes** to Turbopack for local dev speed.

Expected output ends with: `Success! Created ... at .`

- [ ] **Step 2: Verify the app starts**

```bash
pnpm dev
```

Visit `http://localhost:3000`. Expected: default Next.js welcome page with no errors in the terminal. Stop the server (`Ctrl+C`).

- [ ] **Step 3: Strip the default boilerplate**

Replace `src/app/page.tsx` with a minimal placeholder:

```tsx
export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-lg">Median — coming soon</p>
    </main>
  );
}
```

Remove `src/app/page.module.css` if it exists:

```bash
rm -f src/app/page.module.css
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml next.config.ts tsconfig.json eslint.config.mjs .gitignore src/ public/
git commit -m "feat: initialize Next.js 15 app with App Router and TypeScript"
```

---

## Task 2: Install and configure Tailwind v4

**Files:**
- Create: `postcss.config.mjs`
- Modify: `src/app/globals.css`
- Modify: `package.json` (via pnpm add)

- [ ] **Step 1: Install Tailwind v4 packages**

```bash
pnpm add tailwindcss @tailwindcss/postcss postcss
```

- [ ] **Step 2: Create PostCSS config**

Create `postcss.config.mjs`:

```js
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 3: Replace globals.css with the AstroVista theme**

Replace the entire contents of `src/app/globals.css` with:

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(0.9383 0.0042 236.4993);
  --foreground: oklch(0.3211 0 0);
  --card: oklch(1.0000 0 0);
  --card-foreground: oklch(0.3211 0 0);
  --popover: oklch(1.0000 0 0);
  --popover-foreground: oklch(0.3211 0 0);
  --primary: oklch(0.6420 0.1691 38.5815);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.4138 0.0846 259.8759);
  --secondary-foreground: oklch(1.0000 0 0);
  --muted: oklch(0.9846 0.0017 247.8389);
  --muted-foreground: oklch(0.5510 0.0234 264.3637);
  --accent: oklch(0.9119 0.0222 243.8174);
  --accent-foreground: oklch(0.3791 0.1378 265.5222);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.8452 0 0);
  --input: oklch(0.9700 0.0029 264.5420);
  --ring: oklch(0.6397 0.1720 36.4421);
  --chart-1: oklch(0.6693 0.0706 248.9230);
  --chart-2: oklch(0.6678 0.1546 41.6200);
  --chart-3: oklch(0.5957 0.1807 19.9763);
  --chart-4: oklch(0.7859 0.1342 83.6986);
  --chart-5: oklch(0.4227 0.0732 267.3899);
  --sidebar: oklch(0.9030 0.0046 258.3257);
  --sidebar-foreground: oklch(0.3211 0 0);
  --sidebar-primary: oklch(0.6397 0.1720 36.4421);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.9119 0.0222 243.8174);
  --sidebar-accent-foreground: oklch(0.3791 0.1378 265.5222);
  --sidebar-border: oklch(0.9276 0.0058 264.5313);
  --sidebar-ring: oklch(0.6397 0.1720 36.4421);
  --font-sans: Outfit, sans-serif;
  --font-serif: Merriweather, serif;
  --font-mono: Fira Code, monospace;
  --radius: 0.5rem;
  --shadow-x: 0px;
  --shadow-y: 1px;
  --shadow-blur: 3px;
  --shadow-spread: 0px;
  --shadow-opacity: 0.1;
  --shadow-color: #1a1a1a;
  --shadow-2xs: 0px 1px 3px 0px hsl(0 0% 10.1961% / 0.05);
  --shadow-xs: 0px 1px 3px 0px hsl(0 0% 10.1961% / 0.05);
  --shadow-sm: 0px 1px 3px 0px hsl(0 0% 10.1961% / 0.10), 0px 1px 2px -1px hsl(0 0% 10.1961% / 0.10);
  --shadow: 0px 1px 3px 0px hsl(0 0% 10.1961% / 0.10), 0px 1px 2px -1px hsl(0 0% 10.1961% / 0.10);
  --shadow-md: 0px 1px 3px 0px hsl(0 0% 10.1961% / 0.10), 0px 2px 4px -1px hsl(0 0% 10.1961% / 0.10);
  --shadow-lg: 0px 1px 3px 0px hsl(0 0% 10.1961% / 0.10), 0px 4px 6px -1px hsl(0 0% 10.1961% / 0.10);
  --shadow-xl: 0px 1px 3px 0px hsl(0 0% 10.1961% / 0.10), 0px 8px 10px -1px hsl(0 0% 10.1961% / 0.10);
  --shadow-2xl: 0px 1px 3px 0px hsl(0 0% 10.1961% / 0.25);
  --tracking-normal: 0em;
  --spacing: 0.25rem;
}

.dark {
  --background: oklch(0.2178 0 0);
  --foreground: oklch(0.9219 0 0);
  --card: oklch(0.2435 0 0);
  --card-foreground: oklch(0.9219 0 0);
  --popover: oklch(0.2435 0 0);
  --popover-foreground: oklch(0.9219 0 0);
  --primary: oklch(0.6420 0.1691 38.5815);
  --primary-foreground: oklch(1.0000 0 0);
  --secondary: oklch(0.3743 0.0726 258.5213);
  --secondary-foreground: oklch(0.9219 0 0);
  --muted: oklch(0.2850 0 0);
  --muted-foreground: oklch(0.5999 0 0);
  --accent: oklch(0.3380 0.0589 267.5867);
  --accent-foreground: oklch(0.8823 0.0571 254.1284);
  --destructive: oklch(0.6368 0.2078 25.3313);
  --destructive-foreground: oklch(1.0000 0 0);
  --border: oklch(0.3290 0 0);
  --input: oklch(0.3092 0 0);
  --ring: oklch(0.6397 0.1720 36.4421);
  --chart-1: oklch(0.7124 0.0606 248.6896);
  --chart-2: oklch(0.6678 0.1546 41.6200);
  --chart-3: oklch(0.5957 0.1807 19.9763);
  --chart-4: oklch(0.7859 0.1342 83.6986);
  --chart-5: oklch(0.4227 0.0732 267.3899);
  --sidebar: oklch(0.2393 0 0);
  --sidebar-foreground: oklch(0.9219 0 0);
  --sidebar-primary: oklch(0.6397 0.1720 36.4421);
  --sidebar-primary-foreground: oklch(1.0000 0 0);
  --sidebar-accent: oklch(0.3380 0.0589 267.5867);
  --sidebar-accent-foreground: oklch(0.8823 0.0571 254.1284);
  --sidebar-border: oklch(0.3290 0 0);
  --sidebar-ring: oklch(0.6397 0.1720 36.4421);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  --font-sans: var(--font-sans);
  --font-mono: var(--font-mono);
  --font-serif: var(--font-serif);

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --shadow-2xs: var(--shadow-2xs);
  --shadow-xs: var(--shadow-xs);
  --shadow-sm: var(--shadow-sm);
  --shadow: var(--shadow);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);
  --shadow-2xl: var(--shadow-2xl);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 4: Verify the dev server still starts with no CSS errors**

```bash
pnpm dev
```

Visit `http://localhost:3000`. Expected: page renders with the AstroVista background color (light blue-gray, `oklch(0.9383 0.0042 236.4993)`). No console errors. Stop server.

- [ ] **Step 5: Commit**

```bash
git add postcss.config.mjs src/app/globals.css package.json pnpm-lock.yaml
git commit -m "feat: install Tailwind v4 with AstroVista theme tokens"
```

---

## Task 3: Initialize shadcn/ui

**Files:**
- Create: `components.json`, `src/lib/utils.ts`, `src/components/ui/` (populated by shadcn as components are added)

- [ ] **Step 1: Run shadcn init**

```bash
pnpm dlx shadcn@latest init
```

When prompted:
- **Which style?** → Default
- **Which color?** → (doesn't matter — we already have our own tokens in globals.css; pick any, we'll verify it doesn't overwrite our CSS)
- **Use CSS variables?** → Yes

After init, **check** that `globals.css` was not overwritten. If shadcn replaced it, restore it from the version in Task 2 Step 3. The `components.json` and `src/lib/utils.ts` are the only new files we need from this step.

- [ ] **Step 2: Verify components.json looks correct**

`components.json` should reference `src/components/ui` as the component path. It should look roughly like:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

- [ ] **Step 3: Add the Button component to verify shadcn is working**

```bash
pnpm dlx shadcn@latest add button
```

Expected: creates `src/components/ui/button.tsx`.

- [ ] **Step 4: Update the placeholder page to use the Button**

Update `src/app/page.tsx`:

```tsx
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center gap-4">
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
    </main>
  );
}
```

- [ ] **Step 5: Verify buttons render correctly**

```bash
pnpm dev
```

Visit `http://localhost:3000`. Expected: three buttons visible, styled with the AstroVista orange primary color. No TypeScript or CSS errors. Stop server.

- [ ] **Step 6: Commit**

```bash
git add components.json src/lib/utils.ts src/components/ui/ src/app/page.tsx package.json pnpm-lock.yaml
git commit -m "feat: initialize shadcn/ui with AstroVista theme"
```

---

## Task 4: Set up Google Fonts via next/font

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css` (update `--font-sans` / `--font-mono` to CSS variable references)

The AstroVista theme specifies Outfit (sans), Merriweather (serif), and Fira Code (mono). All three are available via `next/font/google`.

- [ ] **Step 1: Install fonts and wire into layout**

Replace the contents of `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Outfit, Merriweather, Fira_Code } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-serif",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Median",
  description: "Your personal media diary",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${merriweather.variable} ${firaCode.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
```

Note: `suppressHydrationWarning` on `<html>` is required for `next-themes` (added in Task 5) — safe to include now.

- [ ] **Step 2: Verify fonts load**

```bash
pnpm dev
```

Visit `http://localhost:3000`. Open DevTools → Elements. The `<body>` should have CSS variable classes from next/font. The buttons should render in the Outfit typeface (rounded, geometric). Stop server.

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: wire Outfit, Merriweather, and Fira Code fonts via next/font"
```

---

## Task 5: Set up dark mode with next-themes

**Files:**
- Create: `src/components/providers.tsx`
- Create: `src/components/theme-toggle.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Install next-themes**

```bash
pnpm add next-themes
```

- [ ] **Step 2: Create the Providers component**

Create `src/components/providers.tsx`:

```tsx
"use client";

import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  );
}
```

- [ ] **Step 3: Wrap the layout with Providers**

Update `src/app/layout.tsx` to import and use `Providers`:

```tsx
import type { Metadata } from "next";
import { Outfit, Merriweather, Fira_Code } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-serif",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Median",
  description: "Your personal media diary",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${merriweather.variable} ${firaCode.variable} font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Create the ThemeToggle component**

Create `src/components/theme-toggle.tsx`:

```tsx
"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? "Light" : "Dark"}
    </Button>
  );
}
```

- [ ] **Step 5: Add ThemeToggle to the placeholder page**

Update `src/app/page.tsx`:

```tsx
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <ThemeToggle />
    </main>
  );
}
```

- [ ] **Step 6: Verify dark mode works**

```bash
pnpm dev
```

Visit `http://localhost:3000`. Click the Dark/Light toggle. Expected: background switches between the light blue-gray (`oklch(0.9383...)`) and the dark charcoal (`oklch(0.2178...)`). No hydration warnings in the console. Stop server.

- [ ] **Step 7: Commit**

```bash
git add src/components/providers.tsx src/components/theme-toggle.tsx src/app/layout.tsx src/app/page.tsx package.json pnpm-lock.yaml
git commit -m "feat: add dark mode with next-themes and ThemeToggle component"
```

---

## Task 6: Set up Prisma with the full Median schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Modify: `package.json` (via pnpm add)
- Modify: `.gitignore` (ensure `prisma/migrations/` is tracked, `.env.local` is not)

- [ ] **Step 1: Install Prisma**

```bash
pnpm add prisma @prisma/client
pnpm exec prisma init --datasource-provider postgresql
```

This creates `prisma/schema.prisma` and adds `DATABASE_URL` to `.env`. We'll replace `.env` with `.env.local` in Task 8.

- [ ] **Step 2: Write the full schema**

Replace the contents of `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Auth.js required models ───────────────────────────────────────────────

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ─── Median models ──────────────────────────────────────────────────────────

model User {
  id                      String   @id @default(cuid())
  username                String   @unique
  email                   String   @unique
  emailVerified           DateTime?
  passwordHash            String
  displayName             String?
  showInProgressOnProfile Boolean  @default(false)
  createdAt               DateTime @default(now())

  accounts     Account[]
  sessions     Session[]

  ownedLists   List[]               @relation("ListOwner")
  memberLists  ListMember[]
  addedItems   ListItem[]
  votes        ListVote[]

  diaryEntries DiaryEntry[]
  companions   DiaryEntryCompanion[]

  createdMedia Media[] @relation("MediaCreatedBy")
  updatedMedia Media[] @relation("MediaUpdatedBy")

  sentRequests     Friendship[] @relation("FriendshipRequester")
  receivedRequests Friendship[] @relation("FriendshipAddressee")
}

enum MediaType {
  movie
  tv_show
  book
}

model Media {
  id          String    @id @default(cuid())
  title       String
  year        Int?
  creator     String?
  type        MediaType
  externalId  String?
  createdById String
  updatedById String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  createdBy User  @relation("MediaCreatedBy", fields: [createdById], references: [id])
  updatedBy User? @relation("MediaUpdatedBy", fields: [updatedById], references: [id])

  seasons      Season[]
  diaryEntries DiaryEntry[]
  listItems    ListItem[]
}

model Season {
  id      String  @id @default(cuid())
  mediaId String
  number  Int
  title   String?

  media        Media        @relation(fields: [mediaId], references: [id], onDelete: Cascade)
  diaryEntries DiaryEntry[]

  @@unique([mediaId, number])
}

enum DiaryStatus {
  in_progress
  paused
  abandoned
  finished
}

model DiaryEntry {
  id           String      @id @default(cuid())
  userId       String
  mediaId      String
  seasonId     String?
  status       DiaryStatus
  rating       Int?
  notes        String?     @db.Text
  dateFinished DateTime?   @db.Date
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  user       User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  media      Media                 @relation(fields: [mediaId], references: [id])
  season     Season?               @relation(fields: [seasonId], references: [id])
  companions DiaryEntryCompanion[]

  @@unique([userId, mediaId, seasonId])
}

model DiaryEntryCompanion {
  diaryEntryId String
  userId       String

  diaryEntry DiaryEntry @relation(fields: [diaryEntryId], references: [id], onDelete: Cascade)
  user       User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([diaryEntryId, userId])
}

enum ListVisibility {
  private
  friends
  public
}

model List {
  id                String         @id @default(cuid())
  ownerId           String
  name              String
  visibility        ListVisibility @default(private)
  isDefaultWishlist Boolean        @default(false)
  featuredOnProfile Boolean        @default(false)
  profilePosition   Int?
  createdAt         DateTime       @default(now())

  owner   User         @relation("ListOwner", fields: [ownerId], references: [id], onDelete: Cascade)
  members ListMember[]
  items   ListItem[]
}

model ListMember {
  listId   String
  userId   String
  joinedAt DateTime @default(now())

  list List @relation(fields: [listId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([listId, userId])
}

model ListItem {
  id        String   @id @default(cuid())
  listId    String
  mediaId   String
  addedById String
  addedAt   DateTime @default(now())

  list    List      @relation(fields: [listId], references: [id], onDelete: Cascade)
  media   Media     @relation(fields: [mediaId], references: [id])
  addedBy User      @relation(fields: [addedById], references: [id])
  votes   ListVote[]

  @@unique([listId, mediaId])
}

model ListVote {
  listItemId String
  userId     String

  listItem ListItem @relation(fields: [listItemId], references: [id], onDelete: Cascade)
  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([listItemId, userId])
}

enum FriendshipStatus {
  pending
  accepted
}

model Friendship {
  id          String           @id @default(cuid())
  requesterId String
  addresseeId String
  status      FriendshipStatus @default(pending)
  createdAt   DateTime         @default(now())

  requester User @relation("FriendshipRequester", fields: [requesterId], references: [id], onDelete: Cascade)
  addressee User @relation("FriendshipAddressee", fields: [addresseeId], references: [id], onDelete: Cascade)

  @@unique([requesterId, addresseeId])
}
```

- [ ] **Step 3: Validate the schema**

```bash
pnpm exec prisma validate
```

Expected: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 4: Create the Prisma client singleton**

Create `src/lib/prisma.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["query"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 5: Remove the .env file prisma init created**

`prisma init` creates a `.env` file. We want `.env.local` (Next.js convention, ignored by git by default). Remove `.env`:

```bash
rm .env
```

We'll create `.env.example` and `.env.local` in Task 8.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma src/lib/prisma.ts package.json pnpm-lock.yaml
git commit -m "feat: add Prisma with full Median data model schema"
```

---

## Task 7: Set up Auth.js v5

**Files:**
- Create: `src/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/middleware.ts`
- Modify: `src/components/providers.tsx`

- [ ] **Step 1: Install Auth.js v5 and the Prisma adapter**

```bash
pnpm add next-auth@beta @auth/prisma-adapter bcryptjs
pnpm add -D @types/bcryptjs
```

- [ ] **Step 2: Create the Auth.js config**

Create `src/auth.ts`:

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { username: parsed.data.username },
        });
        if (!user) return null;

        const passwordValid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!passwordValid) return null;

        return {
          id: user.id,
          name: user.displayName ?? user.username,
          email: user.email,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
});
```

Note: `zod` should already be available as a transitive dependency. If `pnpm exec tsc --noEmit` complains it's missing, run `pnpm add zod`.

- [ ] **Step 3: Create the Auth.js route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 4: Create the middleware**

Create `src/middleware.ts`:

```ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthRoute = req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/signup");
  const isPublicRoute =
    isAuthRoute ||
    req.nextUrl.pathname.startsWith("/api/auth") ||
    req.nextUrl.pathname.startsWith("/@");

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] **Step 5: Add SessionProvider to Providers**

Update `src/components/providers.tsx`:

```tsx
"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
```

- [ ] **Step 6: Type-check (no DB needed)**

```bash
pnpm exec tsc --noEmit
```

Expected: no TypeScript errors. Auth.js type errors about missing `AUTH_SECRET` may appear at runtime but not at compile time — that's fine, it gets set in `.env.local`.

- [ ] **Step 7: Commit**

```bash
git add src/auth.ts src/app/api/ src/middleware.ts src/components/providers.tsx package.json pnpm-lock.yaml
git commit -m "feat: configure Auth.js v5 with credentials provider and Prisma adapter"
```

---

## Task 8: Environment variables and .env.local setup

**Files:**
- Create: `.env.example`
- Create: `.env.local` (gitignored — not committed)
- Modify: `.gitignore`

- [ ] **Step 1: Verify .env.local is gitignored**

Check `.gitignore` for `.env.local`. Next.js adds this by default. Verify:

```bash
grep "\.env\.local" .gitignore
```

Expected: `.env.local` appears. If not, add it:

```bash
echo ".env.local" >> .gitignore
```

- [ ] **Step 2: Create .env.example**

Create `.env.example`:

```bash
# Database — Neon Postgres connection string
# Get this from your Neon project dashboard → Connection Details → Connection string
# Use the pooled connection string (port 5432) for general use
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

# Auth.js secret — used to sign session tokens
# Generate with: openssl rand -base64 32
AUTH_SECRET=""

# Auth.js URL — set to your local dev URL in .env.local, production URL in Vercel env vars
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 3: Create .env.local with placeholder values**

Create `.env.local` (this is your local dev file — never committed):

```bash
# Fill in real values before running prisma migrate dev
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
AUTH_SECRET="replace-me-with-output-of-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

Generate a real `AUTH_SECRET` value:

```bash
openssl rand -base64 32
```

Paste the output into `.env.local` as the value for `AUTH_SECRET`.

Note: `DATABASE_URL` stays as a placeholder until the Neon project is created. The dev server will start without it, but any page that touches Prisma will error until it's filled in.

- [ ] **Step 4: Verify the dev server starts**

```bash
pnpm dev
```

Visit `http://localhost:3000`. Expected: the page loads (dark/light toggle works, buttons visible). The middleware redirects unauthenticated users to `/login` — since `/login` doesn't exist yet, you'll get a 404, which is expected. No server crash. Stop server.

- [ ] **Step 5: Commit**

```bash
git add .env.example .gitignore
git commit -m "feat: add .env.example with all required environment variables"
```

---

## Task 9: Final type-check and build verification

- [ ] **Step 1: Run full TypeScript check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Run ESLint**

```bash
pnpm lint
```

Expected: no errors (warnings about `any` types from Auth.js internals are acceptable).

- [ ] **Step 3: Run a production build**

```bash
pnpm build
```

Expected: build completes successfully. The middleware and auth routes compile without errors. Prisma client generation runs as part of the build.

- [ ] **Step 4: Commit if any lint/type fixes were needed**

If Steps 1–3 required any fixes, commit them:

```bash
git add -p
git commit -m "fix: resolve TypeScript and lint issues from scaffold"
```

---

## Next steps (not in this plan)

1. **Create Neon project** — get a real `DATABASE_URL` and update `.env.local`
2. **Create Vercel project** — connect the repo, add env vars in the Vercel dashboard
3. **Run first migration** — `pnpm exec prisma migrate dev --name init`
4. **Build the login and signup pages** — `/login` and `/signup` routes
