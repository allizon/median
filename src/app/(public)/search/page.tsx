import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MediaType } from "@prisma/client";
import { CatalogSearch } from "@/components/catalog-search";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string; page?: string; perPage?: string }>;
}

const VALID_TYPES = new Set<string>(["movie", "tv_show"]);
const VALID_PER_PAGE = new Set(["10", "25", "50", "all"]);
const DEFAULT_PER_PAGE = "50";

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const { q, type, perPage: rawPerPage } = params;
  const session = await auth();

  const query = q?.trim() ?? "";
  const typeFilter =
    type && VALID_TYPES.has(type) ? (type as MediaType) : undefined;

  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const perPage = rawPerPage && VALID_PER_PAGE.has(rawPerPage) ? rawPerPage : DEFAULT_PER_PAGE;
  const take = perPage === "all" ? undefined : parseInt(perPage, 10);
  const skip = perPage === "all" ? 0 : (page - 1) * take!;

  const where = {
    ...(query ? { title: { contains: query, mode: "insensitive" } } : {}),
    ...(typeFilter ? { type: typeFilter } : {}),
  };

  const [results, totalCount] = await Promise.all([
    prisma.media.findMany({
      where,
      select: {
        id: true,
        title: true,
        year: true,
        creator: true,
        type: true,
      },
      orderBy: { title: "asc" },
      ...(take !== undefined ? { take } : {}),
      skip,
    }),
    prisma.media.count({ where }),
  ]);

  const pageSize = perPage === "all" ? (totalCount || 1) : parseInt(perPage, 10);
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const currentPage = Math.min(page, totalPages);

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
      currentPage={currentPage}
      totalPages={totalPages}
      perPage={perPage}
    />
  );
}
