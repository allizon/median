"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function loginAction(
  _prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", { username, password, redirect: false });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Invalid username or password." };
    }
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/");
}
