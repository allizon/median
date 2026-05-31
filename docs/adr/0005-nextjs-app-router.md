# Next.js (App Router) as the frontend framework

We use [Next.js](https://nextjs.org) with the App Router as the frontend framework, deployed on Vercel.

The Vercel + Neon + Next.js combination provides a cohesive deployment workflow: each pull request gets a Vercel preview deployment paired with a Neon database branch, enabling isolated end-to-end testing without touching production data. This is the primary reason Next.js wins over Remix for this project.

Server Components and Server Actions allow Prisma queries to run server-side without a separate API layer, which suits Median's architecture: most pages are data-heavy reads (diary, lists, media pages) that benefit from server rendering, and most mutations are simple form submissions that map naturally to Server Actions.

**Considered alternatives:**

- **Remix**: Simpler loader/action mental model, excellent form handling, runs well on Vercel. Ruled out primarily because the Vercel + Neon preview branch workflow is significantly better integrated with Next.js, and Next.js has substantially more AI tooling training data (relevant for agentic development).
- **SvelteKit**: Pleasant DX, less boilerplate. Ruled out due to weaker TypeScript/Prisma ecosystem and harder team onboarding.

**Known trade-offs:**

- App Router caching and revalidation is genuinely complex. Prefer `revalidatePath` / `revalidateTag` over manual cache management.
- Server Actions have edge cases around error handling and optimistic UI — use a form library (e.g. `react-hook-form` + `zod`) for complex forms rather than raw Server Actions.
