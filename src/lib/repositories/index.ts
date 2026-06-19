import { prisma } from "@/lib/prisma";
import { UserRepository } from "./user.repository";
import { ListRepository } from "./list.repository";
import { MediaRepository } from "./media.repository";
import { DiaryEntryRepository } from "./diary-entry.repository";
import { ProfileRepository } from "./profile.repository";

export const userRepository = new UserRepository(prisma);
export const listRepository = new ListRepository(prisma);
export const mediaRepository = new MediaRepository(prisma);
export const diaryEntryRepository = new DiaryEntryRepository(prisma);
export const profileRepository = new ProfileRepository(prisma);

export { UserRepository } from "./user.repository";
export { ListRepository } from "./list.repository";
export { MediaRepository } from "./media.repository";
export { DiaryEntryRepository } from "./diary-entry.repository";
export { ProfileRepository } from "./profile.repository";
export type { ViewerRole } from "./profile.repository";
