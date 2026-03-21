import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("ratio_session");
  const { pathname } = request.nextUrl;

  const isPublicPage = 
    pathname === "/login" || 
    pathname === "/onboarding" || 
    pathname === "/setup";

  const isStatic = 
    pathname.startsWith("/api") || 
    pathname.startsWith("/_next") || 
    pathname.includes("favicon.ico") ||
    pathname.includes("manifest.json") ||
    pathname.includes("icons/") ||
    pathname.includes("fonts/") ||
    pathname.includes("mc_bg/") ||
    pathname.endsWith(".mp4") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".ttf") ||
    pathname.endsWith(".otf");

  if (isStatic) return NextResponse.next();

  if (!hasSession && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && (pathname === "/login" || pathname === "/setup")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons/|fonts/|mc_bg/|.*\\.mp4|.*\\.png|.*\\.jpg|.*\\.gif|.*\\.ttf|.*\\.otf).*)",
  ],
};
