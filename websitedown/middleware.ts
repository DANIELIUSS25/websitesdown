import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const downRouteRegex = /^\/([a-z0-9-]+)-down\/?$/i;
const statusRouteRegex = /^\/([a-z0-9-]+)-status\/?$/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname === "/favicon.ico") {
    return NextResponse.next();
  }

  // Rewrite /discord-down → / (homepage handles it)
  if (downRouteRegex.test(pathname) || statusRouteRegex.test(pathname)) {
    const rewritten = request.nextUrl.clone();
    rewritten.pathname = "/";
    return NextResponse.rewrite(rewritten);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
