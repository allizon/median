import Link from "next/link";

interface NavProps {
  username?: string | null;
}

export function Nav({ username }: NavProps) {
  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto max-w-4xl px-4 h-12 flex items-center justify-between">
        <Link href="/" className="font-semibold text-sm tracking-tight">
          Median
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link
            href="/search"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Search
          </Link>
          {username ? (
            <Link
              href={`/profile/${username}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              @{username}
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
