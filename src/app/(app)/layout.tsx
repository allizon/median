import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Nav } from "@/components/nav";
import { isValidSession } from "@/lib/auth-routing";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!isValidSession(session)) redirect("/login"); // also guards orphaned sessions

  return (
    <>
      <Nav username={session.user.username} />
      {children}
    </>
  );
}
