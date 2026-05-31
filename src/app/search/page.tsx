import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MediaType } from "@prisma/client";
import { CatalogSearch } from "@/components/catalog-search";

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

const VALID_TYPES = new Set<string>(["movie", "tv_show", "book"]);

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, type } = await searchParams;
  const session = await auth();

  const query = q?.trim() ?? "";
  const typeFilter =
    type && VALID_TYPES.has(type) ? (type as MediaType) : undefined;

  const results = query
    ? await prisma.media.findMany({
        where: {
          title: { contains: query, mode: "insensitive" },
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
      })
    : [];

  return (
    <CatalogSearch
      query={query}
      typeFilter={typeFilter}
      results={results}
      isAuthenticated={!!session?.user}
    />
  );
}
