import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AddToListButtons } from "@/components/add-to-list-buttons";

const TYPE_LABELS: Record<string, string> = {
  movie: "Movie",
  tv_show: "TV Show",
};

const CREATOR_LABELS: Record<string, string> = {
  movie: "Director",
  tv_show: "Creator / Showrunner",
};

export default async function MediaItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const [media, inWishlist] = await Promise.all([
    prisma.media.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        type: true,
        year: true,
        creator: true,
        createdAt: true,
        seasons: {
          orderBy: { number: "asc" },
          select: { id: true, number: true, title: true },
        },
        createdBy: {
          select: { username: true, displayName: true },
        },
      },
    }),
    session?.user?.id
      ? prisma.listItem
          .findFirst({
            where: {
              mediaId: id,
              list: { ownerId: session.user.id, isDefaultWishlist: true },
            },
            select: { id: true },
          })
          .then(Boolean)
      : false,
  ]);

  if (!media) notFound();

  const typeLabel = TYPE_LABELS[media.type] ?? media.type;
  const creatorLabel = CREATOR_LABELS[media.type] ?? "Creator";

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground uppercase tracking-wide font-medium">
            {typeLabel}
          </p>
          <h1 className="text-3xl font-bold">{media.title}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {media.year && <span>{media.year}</span>}
            {media.creator && (
              <span>
                {creatorLabel}: {media.creator}
              </span>
            )}
          </div>
        </div>
        {session?.user && (
          <AddToListButtons mediaId={media.id} inWishlist={inWishlist} />
        )}
      </div>

      {/* Seasons */}
      {media.type === "tv_show" && media.seasons.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Seasons
          </h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {media.seasons.map((s) => (
              <li key={s.id} className="px-4 py-3 text-sm">
                <span className="font-medium">Season {s.number}</span>
                {s.title && (
                  <span className="text-muted-foreground"> — {s.title}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Meta */}
      <p className="text-xs text-muted-foreground">
        Added by{" "}
        <Link
          href={`/profile/${media.createdBy.username}`}
          className="underline underline-offset-2 hover:text-foreground"
        >
          {media.createdBy.displayName ?? media.createdBy.username}
        </Link>
      </p>
    </main>
  );
}
