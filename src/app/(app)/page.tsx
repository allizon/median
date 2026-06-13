import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NewListButton } from "@/components/new-list-button";
import { WishlistWidget, type WishlistItem } from "@/components/wishlist-widget";
import { getRandomGreeting } from "@/lib/greetings";

export default async function HomePage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const userName = session!.user!.name || "there";

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
      take: 10,
      select: {
        id: true,
        media: { select: { id: true, title: true, type: true, year: true, creator: true } },
      },
    }),
  ]);

  const wishlist = lists.find((l) => l.isDefaultWishlist);
  const nonWishlistLists = lists.filter((l) => !l.isDefaultWishlist);

  const typedWishlistItems: WishlistItem[] = wishlistItems.map((i) => ({
    id: i.id,
    media: i.media,
  }));

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      {/* Welcome greeting */}
      <p className="text-lg md:text-2xl font-semibold text-foreground text-center">
        {(() => {
          const greeting = getRandomGreeting();
          return (
            <>
              {greeting.before}
              <Link
                href={`/profile/${session!.user!.username}`}
                className="hover:text-primary transition-colors underline underline-offset-2"
              >
                {userName}
              </Link>
              {greeting.after}
            </>
          );
        })()}
      </p>

      {/* CTAs */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/search"
          className={cn(buttonVariants({ variant: "default", size: "lg" }), "w-full justify-center")}
        >
          + Add to Watchlist
        </Link>
        <Link
          href="/search"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full justify-center")}
        >
          Browse catalog
        </Link>
      </div>

      {/* Up Next — full width, hero widget */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Up Next
          </h2>
          {wishlist && (
            <Link
              href={`/lists/${wishlist.id}`}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Manage watchlist →
            </Link>
          )}
        </div>
        <div className="px-4 pb-4">
          <WishlistWidget
            initialItems={typedWishlistItems}
            wishlistId={wishlist?.id ?? null}
          />
        </div>
      </section>

      {/* My Lists */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            My Lists
          </h2>
          <NewListButton />
        </div>
        {nonWishlistLists.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No lists yet.{" "}
            <span className="text-primary">Create one above to organize what you want to watch.</span>
          </p>
        ) : (
          <ul className="space-y-0.5">
            {nonWishlistLists.map((list) => (
              <li key={list.id}>
                <Link
                  href={`/lists/${list.id}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted transition-colors gap-2"
                >
                  <span className="truncate">{list.name}</span>
                  <div className="flex items-center gap-2 shrink-0 text-muted-foreground text-xs">
                    {list._count.members > 0 && (
                      <span>{list._count.members + 1} members</span>
                    )}
                    <span>{list._count.items} items</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
