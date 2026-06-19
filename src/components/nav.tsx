"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AddMediaModal } from "@/components/add-media-modal";

interface NavProps {
  username?: string | null;
}

export function Nav({ username }: NavProps) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = React.useState(false);

  const linkClass = (active: boolean) =>
    cn(
      "text-sm transition-colors",
      active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground",
    );

  const isHome = pathname === "/" || pathname.startsWith("/lists");
  const isProfile = username && pathname === `/profile/${username}`;

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto max-w-4xl px-4 h-12 flex items-center justify-between">
        <Link
          href="/"
          className={cn(
            "font-semibold text-sm tracking-tight",
            isHome
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground transition-colors",
          )}
        >
          Median
        </Link>
        <nav className="flex items-center gap-5">
          {username ? (
            <Link href={`/`} className={linkClass(!!isProfile)}>
              @{username}
            </Link>
          ) : (
            <Link href="/login" className={linkClass(false)}>
              Sign in
            </Link>
          )}
        </nav>
      </div>
      <AddMediaModal open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
