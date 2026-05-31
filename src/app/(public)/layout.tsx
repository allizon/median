import { auth } from "@/auth";
import { Nav } from "@/components/nav";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const username = session?.user?.username ?? null;

  return (
    <>
      <Nav username={username} />
      {children}
    </>
  );
}
