import { describe, expect, it } from "vitest";
import { getProxyRedirect } from "@/lib/auth-routing";
import type { Session } from "next-auth";

const fullSession: Session = {
  user: { id: "user-1", username: "alice" },
  expires: "2099-01-01T00:00:00.000Z",
};

// Simulates a stale/legacy JWT cookie that decodes successfully (valid
// signature, not expired) but is missing the `username` claim — e.g. a
// token issued before `username` was added to the jwt callback, or one
// referencing a user whose `username` was never persisted to the token.
const orphanedSession: Session = {
  user: { id: "user-1" },
  expires: "2099-01-01T00:00:00.000Z",
};

describe("getProxyRedirect", () => {
  it("redirects logged-out users away from protected routes", () => {
    expect(getProxyRedirect(null, "/")).toBe("/login");
    expect(getProxyRedirect(null, "/lists/abc")).toBe("/login");
  });

  it("does not redirect logged-out users on public routes", () => {
    expect(getProxyRedirect(null, "/login")).toBeNull();
    expect(getProxyRedirect(null, "/signup")).toBeNull();
    expect(getProxyRedirect(null, "/profile/alice")).toBeNull();
  });

  it("redirects fully logged-in users away from auth routes", () => {
    expect(getProxyRedirect(fullSession, "/login")).toBe("/");
    expect(getProxyRedirect(fullSession, "/signup")).toBe("/");
  });

  it("does not redirect fully logged-in users on protected routes", () => {
    expect(getProxyRedirect(fullSession, "/")).toBeNull();
    expect(getProxyRedirect(fullSession, "/lists/abc")).toBeNull();
  });

  it("treats an orphaned session (missing username) as logged out", () => {
    // This is the MDN-45 case: previously `isLoggedIn = !!req.auth` was true
    // here, so visiting /login redirected to /, while the (app) layout's
    // orphaned-session guard redirected / back to /login — an infinite loop.
    expect(getProxyRedirect(orphanedSession, "/")).toBe("/login");
    expect(getProxyRedirect(orphanedSession, "/login")).toBeNull();
  });
});
