import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Nav } from "@/components/nav";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  let username: string | null = null;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { username: true },
    });
    username = user?.username ?? null;
  }

  return (
    <>
      <Nav username={username} />
      {children}
    </>
  );
}
