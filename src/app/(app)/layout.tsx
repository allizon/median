import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Nav } from "@/components/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (!session.user.username) redirect("/login");  // orphaned session guard

  return (
    <>
      <Nav username={session.user.username} />
      {children}
    </>
  );
}
