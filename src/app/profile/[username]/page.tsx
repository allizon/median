import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FeaturedListsEditor } from "./FeaturedListsEditor";
import { AddMediaButton } from "./AddMediaButton";

type ViewerRole = "owner" | "friend" | "stranger" | "logged-out";

async function getViewerRole(viewerId: string | null, profileUserId: string): Promise<ViewerRole> {
  if (!viewerId) return "logged-out";
  if (viewerId === profileUserId) return "owner";

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "accepted",
      OR: [
        { requesterId: viewerId, addresseeId: profileUserId },
        { requesterId: profileUserId, addresseeId: viewerId },
      ],
    },
  });

  return friendship ? "friend" : "stranger";
}

async function getFriendshipState(viewerId: string, profileUserId: string) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: viewerId, addresseeId: profileUserId },
        { requesterId: profileUserId, addresseeId: viewerId },
      ],
    },
  });
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const profileUser = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      displayName: true,
      showInProgressOnProfile: true,
      createdAt: true,
    },
  });

  if (!profileUser) notFound();

  const session = await auth();
  const viewerId = session?.user?.id ?? null;
  const role = await getViewerRole(viewerId, profileUser.id);

  const canSeeStats = role === "owner" || role === "friend";

  const [stats, featuredLists, friendshipState] = await Promise.all([
    canSeeStats
      ? prisma.diaryEntry.groupBy({
          by: ["mediaId"],
          where: {
            userId: profileUser.id,
            status: "finished",
            seasonId: null,
          },
          _count: { mediaId: true },
        }).then(async () => {
          const counts = await prisma.$queryRaw<
            { type: string; count: bigint }[]
          >`
            SELECT m.type, COUNT(*)::int as count
            FROM "DiaryEntry" de
            JOIN "Media" m ON m.id = de."mediaId"
            WHERE de."userId" = ${profileUser.id}
              AND de.status = 'finished'
              AND de."seasonId" IS NULL
            GROUP BY m.type
          `;
          const avgRating = await prisma.diaryEntry.aggregate({
            where: {
              userId: profileUser.id,
              status: "finished",
              seasonId: null,
              rating: { not: null },
            },
            _avg: { rating: true },
          });
          const inProgress = profileUser.showInProgressOnProfile
            ? await prisma.diaryEntry.count({
                where: {
                  userId: profileUser.id,
                  status: "in_progress",
                  seasonId: null,
                },
              })
            : null;
          return { counts, avgRating: avgRating._avg.rating, inProgress };
        })
      : null,

    canSeeStats
      ? prisma.list.findMany({
          where: {
            ownerId: profileUser.id,
            featuredOnProfile: true,
            visibility: role === "friend" || role === "owner" ? { in: ["public", "friends"] } : "public",
          },
          orderBy: { profilePosition: "asc" },
          select: {
            id: true,
            name: true,
            visibility: true,
            featuredOnProfile: true,
            profilePosition: true,
            _count: { select: { items: true } },
            items: {
              take: 3,
              orderBy: { addedAt: "asc" },
              select: { media: { select: { title: true } } },
            },
          },
        })
      : null,

    role !== "owner" && viewerId
      ? getFriendshipState(viewerId, profileUser.id)
      : null,
  ]);

  const allOwnerLists =
    role === "owner"
      ? await prisma.list.findMany({
          where: {
            ownerId: profileUser.id,
          },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            name: true,
            visibility: true,
            featuredOnProfile: true,
            profilePosition: true,
            _count: { select: { items: true } },
          },
        })
      : null;

  const memberSince = profileUser.createdAt.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const countByType = (type: string) =>
    Number(
      (stats?.counts as { type: string; count: bigint }[] | undefined)?.find(
        (c) => c.type === type
      )?.count ?? 0
    );

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">
            {profileUser.displayName ?? profileUser.username}
          </h1>
          {profileUser.displayName && (
            <p className="text-muted-foreground">@{profileUser.username}</p>
          )}
          <p className="text-sm text-muted-foreground">Member since {memberSince}</p>
        </div>

        <div className="shrink-0">
          {role === "owner" && (
            <div className="flex items-center gap-3">
              <AddMediaButton />
              <Link
                href="/settings"
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Settings
              </Link>
            </div>
          )}
          {role !== "owner" && viewerId && (
            <FriendButton
              friendship={friendshipState}
              viewerId={viewerId}
              profileUserId={profileUser.id}
            />
          )}
        </div>
      </div>

      {/* Stats Bar — friends + owner only */}
      {canSeeStats && stats && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Stats
          </h2>
          {stats.counts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
          ) : (
            <div className="flex flex-wrap gap-4 text-sm">
              {countByType("movie") > 0 && (
                <span><strong>{countByType("movie")}</strong> movies</span>
              )}
              {countByType("tv_show") > 0 && (
                <span><strong>{countByType("tv_show")}</strong> TV shows</span>
              )}
              {countByType("book") > 0 && (
                <span><strong>{countByType("book")}</strong> books</span>
              )}
              {stats.avgRating !== null && stats.avgRating !== undefined && (
                <span>
                  avg rating <strong>{(stats.avgRating / 2).toFixed(1)}★</strong>
                </span>
              )}
              {stats.inProgress !== null && stats.inProgress !== undefined && stats.inProgress > 0 && (
                <span className="text-muted-foreground">
                  {stats.inProgress} in progress
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Featured Lists — friends + owner only */}
      {canSeeStats && (
        <div className="space-y-4">
          {role === "owner" ? (
            <FeaturedListsEditor
              lists={allOwnerLists ?? []}
              ownerId={profileUser.id}
              username={profileUser.username}
            />
          ) : (
            <>
              <h2 className="text-lg font-semibold">Featured Lists</h2>
              {featuredLists && featuredLists.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {featuredLists.map((list) => (
                    <Link
                      key={list.id}
                      href={`/lists/${list.id}`}
                      className="rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors space-y-1"
                    >
                      <p className="font-medium text-sm">{list.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {list._count.items} items
                      </p>
                      {list.items.length > 0 && (
                        <p className="text-xs text-muted-foreground truncate">
                          {list.items.map((i) => i.media.title).join(", ")}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No featured lists yet.</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Logged-out / stranger gate message */}
      {!canSeeStats && role !== "owner" && (
        <div className="rounded-xl border border-border bg-muted/30 p-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {role === "logged-out"
              ? "Sign in to see this user's stats and lists."
              : "Add this user as a friend to see their stats and lists."}
          </p>
          {role === "logged-out" && (
            <Link
              href="/login"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </main>
  );
}

function FriendButton({
  friendship,
  viewerId,
  profileUserId,
}: {
  friendship: { id: string; requesterId: string; status: string } | null;
  viewerId: string;
  profileUserId: string;
}) {
  if (!friendship) {
    return (
      <form action={`/api/friends/request`} method="POST">
        <input type="hidden" name="addresseeId" value={profileUserId} />
        <Button type="submit">Add Friend</Button>
      </form>
    );
  }

  if (friendship.status === "accepted") {
    return (
      <form action={`/api/friends/remove`} method="POST">
        <input type="hidden" name="friendshipId" value={friendship.id} />
        <Button variant="outline" type="submit">Friends</Button>
      </form>
    );
  }

  if (friendship.status === "pending" && friendship.requesterId === viewerId) {
    return <Button variant="outline" disabled>Request Sent</Button>;
  }

  // pending, we're the addressee
  return (
    <form action={`/api/friends/accept`} method="POST">
      <input type="hidden" name="friendshipId" value={friendship.id} />
      <Button type="submit">Accept Request</Button>
    </form>
  );
}

// need Button in server component context
function Button({
  children,
  type = "button",
  variant = "default",
  disabled,
}: {
  children: React.ReactNode;
  type?: "button" | "submit";
  variant?: "default" | "outline";
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/80",
    outline: "border border-border bg-background hover:bg-muted",
  };
  return (
    <button type={type} disabled={disabled} className={`${base} ${variants[variant]}`}>
      {children}
    </button>
  );
}
