import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { getProxyRedirect } from "@/lib/auth-routing";

export default auth((req) => {
  const redirectPath = getProxyRedirect(req.auth, req.nextUrl.pathname);
  if (redirectPath) {
    return NextResponse.redirect(new URL(redirectPath, req.nextUrl));
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
