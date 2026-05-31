"use server";

import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username may only contain letters, numbers, underscores, and hyphens"
    ),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignupState = {
  errors?: {
    username?: string[];
    email?: string[];
    password?: string[];
  };
  error?: string;
} | null;

export async function signupAction(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  const parsed = signupSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
    select: { username: true, email: true },
  });

  if (existing) {
    if (existing.username === username) {
      return { errors: { username: ["That username is already taken"] } };
    }
    return { errors: { email: ["An account with that email already exists"] } };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      ownedLists: {
        create: {
          name: "Wishlist",
          isDefaultWishlist: true,
          visibility: "private",
        },
      },
    },
  });

  try {
    await signIn("credentials", { username, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Account created but sign-in failed. Please log in." };
    }
  }

  redirect("/");
}
