import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MediaType } from "@prisma/client";
import { CatalogSearch } from "@/components/catalog-search";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

const VALID_TYPES = new Set<string>(["movie", "tv_show"]);

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, type } = await searchParams;
  const session = await auth();

  const query = q?.trim() ?? "";
  const typeFilter =
    type && VALID_TYPES.has(type) ? (type as MediaType) : undefined;

  const results = await prisma.media.findMany({
    where: {
      ...(query ? { title: { contains: query, mode: "insensitive" } } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
    },
    select: {
      id: true,
      title: true,
      year: true,
      creator: true,
      type: true,
    },
    orderBy: { title: "asc" },
    take: 50,
  });

  // Pre-load wishlist state for each result so buttons render correctly
  let wishlistMediaIds = new Set<string>();
  if (session?.user?.id && results.length > 0) {
    const wishlistItems = await prisma.listItem.findMany({
      where: {
        list: { ownerId: session.user.id, isDefaultWishlist: true },
        mediaId: { in: results.map((r) => r.id) },
      },
      select: { mediaId: true },
    });
    wishlistMediaIds = new Set(wishlistItems.map((i) => i.mediaId));
  }

  return (
    <CatalogSearch
      query={query}
      typeFilter={typeFilter}
      results={results}
      isAuthenticated={!!session?.user}
      wishlistMediaIds={[...wishlistMediaIds]}
    />
  );
}
