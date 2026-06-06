import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ListDetail } from "./list-detail";

interface ListPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListPage({ params }: ListPageProps) {
  const { id } = await params;
  const session = await auth();
  const userId = session!.user!.id!;

  const list = await prisma.list.findFirst({
    where: { id, ownerId: userId },
    select: {
      id: true,
      name: true,
      visibility: true,
      isDefaultWishlist: true,
      items: {
        select: {
          id: true,
          addedAt: true,
          media: {
            select: {
              id: true,
              title: true,
              type: true,
              year: true,
              creator: true,
            },
          },
          scores: {
            where: { userId },
            select: { score: true },
            take: 1,
          },
        },
        orderBy: { addedAt: "asc" },
      },
    },
  });

  if (!list) notFound();

  const items = list.items.map((item) => ({
    id: item.id,
    addedAt: item.addedAt,
    score: item.scores[0]?.score ?? null,
    media: item.media,
  }));

  return (
    <ListDetail
      list={{
        id: list.id,
        name: list.name,
        visibility: list.visibility,
        isDefaultWishlist: list.isDefaultWishlist,
      }}
      initialItems={items}
    />
  );
}
