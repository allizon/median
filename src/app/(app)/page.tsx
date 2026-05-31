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
          &#10002; Log something
        </Link>
      </div>

      {/* Widget grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* My Lists */}
        <section className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            My Lists
          </h2>
          {lists.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lists yet.</p>
          ) : (
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
          )}
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
