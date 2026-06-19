"use server";

import { listRepository } from "@/lib/repositories";
import { revalidatePath } from "next/cache";

export async function updateFeaturedListsAction(
  ownerId: string,
  updates: { id: string; featuredOnProfile: boolean; profilePosition: number | null }[]
) {
  await Promise.all(
    updates.map(({ id, featuredOnProfile, profilePosition }) =>
      listRepository.updateListFeatured(id, ownerId, { featuredOnProfile, profilePosition })
    )
  );
  revalidatePath(`/profile/${ownerId}`);
}
