"use server";

import { auth } from "@/auth";
import { userRepository } from "@/lib/repositories";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username may only contain letters, numbers, underscores, and hyphens"
    ),
  displayName: z.string().max(50, "Display name must be at most 50 characters").optional(),
  showInProgressOnProfile: z.boolean(),
});

export type SettingsState = {
  success?: boolean;
  errors?: {
    username?: string[];
    displayName?: string[];
  };
  error?: string;
} | null;

export async function updateProfileAction(
  _prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const parsed = profileSchema.safeParse({
    username: formData.get("username"),
    displayName: formData.get("displayName") || undefined,
    showInProgressOnProfile: formData.get("showInProgressOnProfile") === "on",
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { username, displayName, showInProgressOnProfile } = parsed.data;

  const existing = await userRepository.findFirstByUsernameExcludingId(username, session.user.id);

  if (existing) {
    return { errors: { username: ["That username is already taken"] } };
  }

  const updated = await userRepository.update(session.user.id, {
    username,
    displayName: displayName ?? null,
    showInProgressOnProfile,
  });

  revalidatePath(`/profile/${updated.username}`);
  revalidatePath("/settings");

  return { success: true };
}
