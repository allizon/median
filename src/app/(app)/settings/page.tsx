import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const session = await auth();

  const user = await prisma.user.findUnique({
    where: { id: session!.user!.id! },
    select: {
      username: true,
      displayName: true,
      showInProgressOnProfile: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-lg px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile and preferences.</p>
      </div>
      <SettingsForm user={user} />
    </main>
  );
}
