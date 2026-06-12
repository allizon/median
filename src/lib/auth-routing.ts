import type { Session } from "next-auth";

/**
 * A session is only considered valid once it carries both a user id and a
 * username. A JWT cookie can decode successfully (valid signature, not
 * expired) while missing `username` — e.g. a stale token issued before
 * `username` was added to the jwt callback. Both the proxy and the (app)
 * layout must agree on this definition, otherwise one can treat the user as
 * logged in while the other treats them as logged out, causing a redirect
 * loop between `/` and `/login`.
 */
export function isValidSession(
  session: Session | null | undefined
): session is Session & { user: { id: string; username: string } } {
  return !!session?.user?.id && !!session.user.username;
}

/**
 * Decides whether the proxy should redirect the request, based on the same
 * session-validity definition used by the (app) layout's orphaned-session
 * guard. Returns the path to redirect to, or null if no redirect is needed.
 */
export function getProxyRedirect(
  session: Session | null | undefined,
  pathname: string
): string | null {
  const isLoggedIn = isValidSession(session);
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/signup");
  const isPublicRoute =
    isAuthRoute ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/@") ||
    pathname.startsWith("/profile/");

  if (!isLoggedIn && !isPublicRoute) return "/login";
  if (isLoggedIn && isAuthRoute) return "/";
  return null;
}
