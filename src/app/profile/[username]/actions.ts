"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateFeaturedListsAction(
  ownerId: string,
  updates: { id: string; featuredOnProfile: boolean; profilePosition: number | null }[]
) {
  await Promise.all(
    updates.map(({ id, featuredOnProfile, profilePosition }) =>
      prisma.list.updateMany({
        where: { id, ownerId },
        data: { featuredOnProfile, profilePosition },
      })
    )
  );
  revalidatePath(`/profile/${ownerId}`);
}
